import pickle
import numpy as np
import librosa
import tensorflow as tf
from scipy.signal import butter, sosfilt
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.models import Model
from tensorflow.keras.layers import GlobalAveragePooling2D
import noisereduce as nr

# -----------------------------
# CONSTANTS
# -----------------------------
SR = 16000
IMG = 224

# -----------------------------
# LOAD MODELS
# -----------------------------
with open("models/pulseguard_model.pkl", "rb") as f:
    model_data = pickle.load(f)

binary_model = model_data["binary"]
multi_model = model_data["multi"]
classes = model_data["classes"]

# -----------------------------
# LOAD RESNET FEATURE EXTRACTOR
# -----------------------------
_base = ResNet50(weights="imagenet", include_top=False, input_shape=(IMG, IMG, 3))
extractor = Model(_base.input, GlobalAveragePooling2D()(_base.output))


# -----------------------------
# AUDIO QUALITY CHECK
# -----------------------------
def check_quality(y):
    if len(y) < SR * 0.5:
        return False, "Recording too short"

    noise = y[: int(SR * 0.1)]
    snr = 10 * np.log10((np.mean(y**2) + 1e-10) / (np.mean(noise**2) + 1e-10))

    # Allow noisy audio but flag it
    if snr < 0:
        return True, snr

    return True, snr
    if len(y) < SR * 0.5:
        return False, "Recording too short"

    noise = y[: int(SR * 0.1)]
    snr = 10 * np.log10((np.mean(y**2) + 1e-10) / (np.mean(noise**2) + 1e-10))

    def check_quality(y):
        if len(y) < SR * 0.5:
            return False, "Recording too short"

        noise = y[: int(SR * 0.1)]
        snr = 10 * np.log10((np.mean(y**2) + 1e-10) / (np.mean(noise**2) + 1e-10))

        # Allow noisy audio but flag it
        if snr < 0:
            return True, snr  # ⚠️ still process

        return True, snr

    return True, snr


# -----------------------------
# PREPROCESSING
# -----------------------------
def preprocess(y):
    # 1. Bandpass filter (heart freq range)
    sos = butter(4, [25 / 2000, 0.99], btype="band", output="sos")
    y = sosfilt(sos, y)

    noise_sample = y[: int(SR * 0.5)]
    y = nr.reduce_noise(
        y=y,
        sr=SR,
        y_noise=noise_sample,
        prop_decrease=0.8,
    )

    # 3. Amplify weak signals
    y = y * 3

    # 4. Normalize
    y = y / (np.max(np.abs(y)) + 1e-10)

    return y


# -----------------------------
# DEEP FEATURES (RESNET)
# -----------------------------
def extract_deep_features(y):
    mel = librosa.feature.melspectrogram(y=y, sr=SR, n_mels=128)
    mel_db = librosa.power_to_db(mel, ref=np.max)

    mel_db = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8)

    img = tf.image.resize(mel_db[..., np.newaxis], (IMG, IMG)).numpy()
    img = np.repeat(img, 3, axis=-1)[np.newaxis]

    return extractor.predict(img, verbose=0).flatten()


# -----------------------------
# HANDCRAFTED FEATURES
# -----------------------------
def extract_hand_features(y):
    mfcc = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=40)

    return np.concatenate(
        [
            mfcc.mean(axis=1),
            mfcc.std(axis=1),
            [librosa.feature.spectral_centroid(y=y, sr=SR).mean()],
            [librosa.feature.spectral_bandwidth(y=y, sr=SR).mean()],
            [librosa.feature.spectral_rolloff(y=y, sr=SR).mean()],
            [librosa.feature.zero_crossing_rate(y).mean()],
            [librosa.feature.rms(y=y).mean()],
        ]
    )


# -----------------------------
# SEVERITY + RISK
# -----------------------------
def get_severity(conf):
    if conf < 70:
        return "Mild"
    elif conf < 88:
        return "Moderate"
    return "Severe"


def get_risk_score(pred_class, confidence, severity, snr):
    if pred_class == 0:
        return max(0, 30 - int(confidence * 0.3))

    base = {"Mild": 20, "Moderate": 50, "Severe": 80}[severity]
    conf_bonus = (confidence - 50) * 0.4
    snr_penalty = max(0, (15 - snr) * 0.5)

    return max(0, min(100, int(base + conf_bonus + snr_penalty)))


def get_risk_band(score):
    if score <= 30:
        return "Low"
    elif score <= 60:
        return "Moderate"
    elif score <= 80:
        return "High"
    return "Critical"


# -----------------------------
# GRAPH DATA EXTRACTION
# -----------------------------
def get_graph_data(y):
    # 1. Downsample PCG to 200 points to keep frontend lightning fast
    num_points = 200
    chunk_size = max(1, len(y) // num_points)
    
    pcg_data = []
    for i in range(num_points):
        chunk = y[i * chunk_size : (i + 1) * chunk_size]
        if len(chunk) > 0:
            pcg_data.append(float(np.max(chunk)) if i % 2 == 0 else float(np.min(chunk)))
        else:
            pcg_data.append(0.0)

    # 2. Extract Frequency Spectrum (50 bins, ~20Hz to ~800Hz)
    # FFT resolution = SR / N. We want up to 800Hz.
    fft_vals = np.abs(np.fft.rfft(y))
    fft_freqs = np.fft.rfftfreq(len(y), 1.0 / SR)
    
    spectrum_data = []
    # Create 50 linearly spaced bins from 20 to 800 Hz
    bin_edges = np.linspace(20, 800, 51)
    
    for i in range(50):
        low, high = bin_edges[i], bin_edges[i+1]
        
        # indices in fft_freqs
        idx = np.where((fft_freqs >= low) & (fft_freqs < high))[0]
        
        if len(idx) > 0:
            val = float(np.mean(fft_vals[idx]))
        else:
            val = 0.0
        spectrum_data.append(val)
        
    # Normalize spectrum data so the highest peak is ~1.0 for charting
    max_spec = max(spectrum_data) if len(spectrum_data) > 0 else 1.0
    if max_spec > 0:
        spectrum_data = [x / max_spec for x in spectrum_data]

    return pcg_data, spectrum_data

# -----------------------------
# MAIN PREDICTION FUNCTION
# -----------------------------
def predict_audio(file_path):
    try:
        y, _ = librosa.load(file_path, sr=SR, mono=True)

        ok, snr = check_quality(y)
        if not ok:
            return {"error": snr}

        y = preprocess(y)

        deep_feat = extract_deep_features(y)

        features = deep_feat.reshape(1, -1)

        # Binary
        _ = binary_model.predict(features)[0]

        # Multi-class
        probs = multi_model.predict_proba(features)[0]
        pred_class = int(np.argmax(probs))
        confidence = float(np.max(probs) * 100)

        disease = classes[pred_class]

        severity = get_severity(confidence)
        risk_score = get_risk_score(pred_class, confidence, severity, snr)
        risk_level = get_risk_band(risk_score)

        pcg_data, spectrum_data = get_graph_data(y)

        return {
            "disease": disease,
            "confidence": round(confidence, 2),
            "severity": severity,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "pcg_data": pcg_data,
            "spectrum_data": spectrum_data,
        }

    except Exception as e:
        return {"error": str(e)}
