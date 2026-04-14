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
with open("pulseguard_model.pkl", "rb") as f:
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

        return {
            "disease": disease,
            "confidence": round(confidence, 2),
            "severity": severity,
            "risk_score": risk_score,
            "risk_level": risk_level,
        }

    except Exception as e:
        return {"error": str(e)}
