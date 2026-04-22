# PulseGuard | model_utils.py
# Utility module for loading the saved PulseGuard model and running inference.
# Author  : Abhishek Jadhav | GP Sadar, Nagpur
# Depends : librosa, noisereduce, numpy, scipy, tensorflow, xgboost, pickle

import os
import pickle
import warnings
import numpy as np
import librosa
import noisereduce as nr
import tensorflow as tf
from scipy.signal import butter, sosfilt
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.models import Model
from tensorflow.keras.layers import GlobalAveragePooling2D

os.environ["TF_CPP_MIN_LOG_LEVEL"]  = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
warnings.filterwarnings("ignore")


# ─── CONFIG ───────────────────────────────────────────────────────────────────

SR  = 4000   # heart sounds only need 4 kHz
IMG = 224    # ResNet50 input size

CLASSES = {
    0: "Normal",
    1: "Aortic Stenosis",
    2: "Mitral Regurgitation",
    3: "Mitral Stenosis",
    4: "Mitral Valve Prolapse",
}

FEAT_NAMES = (
      [f"MFCC_{i}_mean" for i in range(40)]
    + [f"MFCC_{i}_std"  for i in range(40)]
    + ["SpectralCentroid", "SpectralBandwidth", "SpectralRolloff",
       "ZeroCrossingRate", "RMS_Energy"]
)

FEAT_ALIASES = {
    "RMS_Energy":        "Murmur Intensity",
    "SpectralBandwidth": "Frequency Spread",
    "ZeroCrossingRate":  "Signal Irregularity",
    "SpectralCentroid":  "Frequency Center",
    "SpectralRolloff":   "High-Freq Energy",
}

DEFAULT_MODEL_PATH = "models/pulseguard_v3.pkl"


# ─── MODEL LOADER ─────────────────────────────────────────────────────────────

class PulseGuardModel:
    """
    Loads and caches the ResNet50 feature extractor and XGBoost classifiers.
    Use `PulseGuardModel.get_instance()` to get the singleton.
    """

    _instance = None

    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        print("Loading ResNet50 feature extractor ...")
        base      = ResNet50(weights="imagenet", include_top=False,
                             input_shape=(IMG, IMG, 3))
        self.extractor = Model(base.input, GlobalAveragePooling2D()(base.output))
        print("ResNet50 ready.")

        print(f"Loading XGBoost classifiers from '{model_path}' ...")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model file not found: '{model_path}'. "
                "Train the model first using model_v3.py."
            )
        saved = pickle.load(open(model_path, "rb"))
        self.binary_model = saved["binary"]
        self.multi_model  = saved["multi"]
        # Override CLASSES dict in case the pickle carries its own copy
        self.classes      = saved.get("classes", CLASSES)
        print("Models loaded successfully.\n")

    @classmethod
    def get_instance(cls, model_path: str = DEFAULT_MODEL_PATH) -> "PulseGuardModel":
        """Return a cached singleton — avoids reloading ResNet50 on every call."""
        if cls._instance is None:
            cls._instance = cls(model_path)
        return cls._instance


# ─── AUDIO HELPERS ────────────────────────────────────────────────────────────

def _check_quality(y: np.ndarray):
    """
    Returns (ok: bool, message: str).
    ok=False  → recording is too short and MUST be rejected.
    ok=True   → recording is usable; message may carry a 'Poor' SNR warning.
    """
    if len(y) < SR * 0.5:
        return False, "Recording too short. Please re-record (needs ≥ 0.5 s)."

    noise = y[: int(SR * 0.1)]
    snr   = 10 * np.log10((np.mean(y ** 2) + 1e-10) / (np.mean(noise ** 2) + 1e-10))

    if snr < 0.0:
        return True, f"Poor audio quality (SNR={snr:.2f} dB). Prediction may be less reliable."

    return True, "OK"


def _preprocess(y: np.ndarray) -> np.ndarray:
    """Bandpass → conditional noise reduction → amplify → normalise."""
    # Keep only 25–900 Hz (heart sound range)
    sos = butter(4, [25 / 2000, 0.99], btype="band", output="sos")
    y   = sosfilt(sos, y)

    # Noise reduction only for clips longer than 2 s (avoids librosa/nr conflict
    # on short clips at 4 kHz)
    if len(y) > SR * 2:
        try:
            y = nr.reduce_noise(y=y, sr=SR, stationary=False)
        except Exception:
            pass  # graceful fallback

    y = y * 3                                        # amplify low-amplitude signal
    return y / (np.max(np.abs(y)) + 1e-10)          # scale to [-1, 1]


def _extract_deep_features(y: np.ndarray, extractor: Model) -> np.ndarray:
    """Return 2048-D ResNet50 feature vector from a mel-spectrogram."""
    mel    = librosa.feature.melspectrogram(y=y, sr=SR, n_mels=128)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_db = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8)

    img = tf.image.resize(mel_db[..., np.newaxis], (IMG, IMG)).numpy()
    img = np.repeat(img, 3, axis=-1)[np.newaxis]    # shape: (1, 224, 224, 3)

    return extractor.predict(img, verbose=0).flatten()


def _extract_hand_features(y: np.ndarray) -> np.ndarray:
    """Return 85-D handcrafted feature vector (used for explainability)."""
    mfcc = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=40)
    return np.concatenate([
        mfcc.mean(axis=1),
        mfcc.std(axis=1),
        [librosa.feature.spectral_centroid(y=y, sr=SR).mean()],
        [librosa.feature.spectral_bandwidth(y=y, sr=SR).mean()],
        [librosa.feature.spectral_rolloff(y=y, sr=SR).mean()],
        [librosa.feature.zero_crossing_rate(y).mean()],
        [librosa.feature.rms(y=y).mean()],
    ])


# ─── SCORING HELPERS ──────────────────────────────────────────────────────────

def _get_severity(confidence: float) -> str:
    if confidence < 0.70:  return "Mild"
    if confidence < 0.88:  return "Moderate"
    return "Severe"


def _get_risk_score(pred_class: int, confidence_pct: float,
                    severity: str, snr_db: float) -> int:
    if pred_class == 0:
        return min(30, max(0, 30 - int(confidence_pct * 0.3)))
    base        = {"Mild": 20, "Moderate": 50, "Severe": 80}[severity]
    conf_bonus  = (confidence_pct - 50) * 0.4
    snr_penalty = max(0, (15 - snr_db) * 0.5)
    return max(0, min(100, int(base + conf_bonus + snr_penalty)))


def _get_risk_band(score: int) -> str:
    if score <= 30:  return "Low"
    if score <= 60:  return "Moderate"
    if score <= 80:  return "High"
    return "Critical"


def _explain_prediction(hand_features: np.ndarray, top_n: int = 5) -> dict:
    """Map top-N hand-crafted features to human-readable importance levels."""
    norm        = np.abs(hand_features) / (np.abs(hand_features).max() + 1e-10)
    top_indices = np.argsort(norm)[::-1][:top_n]
    result = {}
    for i in top_indices:
        label = FEAT_ALIASES.get(FEAT_NAMES[i], FEAT_NAMES[i])
        level = "High" if norm[i] > 0.7 else "Medium" if norm[i] > 0.4 else "Low"
        result[label] = level
    return result


# ─── PUBLIC API ───────────────────────────────────────────────────────────────

def predict_audio(audio_path: str,
                  model_path: str = DEFAULT_MODEL_PATH) -> dict:
    """
    Run the full PulseGuard inference pipeline on a WAV file.

    Parameters
    ----------
    audio_path : str
        Path to the input .wav file (any sample rate; resampled to 4 kHz
        internally).
    model_path : str, optional
        Path to the saved ``pulseguard.pkl`` file produced by model_v3.py.
        Defaults to ``"models/pulseguard.pkl"``.

    Returns
    -------
    dict with keys:
        condition   (str)   – Predicted class name, e.g. "Aortic Stenosis"
        severity    (str)   – "N/A" | "Mild" | "Moderate" | "Severe"
        risk_score  (int)   – 0–100 composite risk score
        risk_band   (str)   – "Low" | "Moderate" | "High" | "Critical"
        confidence  (float) – Softmax probability of the predicted class (0–1)
        binary      (str)   – "Normal" | "Abnormal" (Stage-1 binary screen)
        all_probs   (dict)  – {class_name: probability_%} for all 5 classes
        features    (dict)  – Top-5 explainability features and importance level
        quality     (dict)  – {ok, snr_db, audio_quality}
        error       (str|None) – Error message or None on success
    """
    model = PulseGuardModel.get_instance(model_path)

    # ── 1. Load audio ──────────────────────────────────────────────────────────
    try:
        y_raw, _ = librosa.load(audio_path, sr=SR, mono=True)
    except Exception as e:
        return {
            "condition": None, "severity": None, "risk_score": None,
            "risk_band": None, "confidence": None, "binary": None,
            "all_probs": None, "features": None,
            "quality": {"ok": False, "snr_db": None, "audio_quality": "Unknown"},
            "error": f"Could not load audio file: {e}",
        }

    # ── 2. Quality gate ────────────────────────────────────────────────────────
    ok, msg = _check_quality(y_raw)

    noise  = y_raw[: int(SR * 0.1)]
    snr_db = float(
        10 * np.log10((np.mean(y_raw ** 2) + 1e-10)
                      / (np.mean(noise ** 2) + 1e-10))
    )
    audio_quality = "Poor" if "Poor" in msg else "OK"

    if not ok:
        return {
            "condition": "Please re-record", "severity": None,
            "risk_score": None, "risk_band": None, "confidence": None,
            "binary": None, "all_probs": None, "features": None,
            "quality": {"ok": False, "snr_db": round(snr_db, 2),
                        "audio_quality": audio_quality},
            "error": msg,
        }

    # ── 3. Preprocess + feature extraction ────────────────────────────────────
    y_clean   = _preprocess(y_raw)
    deep_feat = _extract_deep_features(y_clean, model.extractor)   # 2048-D
    hand_feat = _extract_hand_features(y_clean)                     # 85-D (XAI)
    deep_input = deep_feat.reshape(1, -1)                           # (1, 2048)

    # ── 4. Stage 1 — binary screen (Normal vs Abnormal) ──────────────────────
    binary_result = (
        "Abnormal" if model.binary_model.predict(deep_input)[0] else "Normal"
    )

    # ── 5. Stage 2 — multi-class prediction ───────────────────────────────────
    probs      = model.multi_model.predict_proba(deep_input)[0]
    pred_class = int(np.argmax(probs))
    confidence = float(probs[pred_class])

    # ── 6. Severity, risk score, explainability ────────────────────────────────
    severity   = "N/A" if pred_class == 0 else _get_severity(confidence)
    risk_score = _get_risk_score(pred_class, confidence * 100, severity, snr_db)
    all_probs  = {
        model.classes[i]: round(float(probs[i]) * 100, 2) for i in range(5)
    }
    explanation = _explain_prediction(hand_feat)

    return {
        "condition":  model.classes[pred_class],
        "severity":   severity,
        "risk_score": risk_score,
        "risk_band":  _get_risk_band(risk_score),
        "confidence": round(confidence, 4),
        "binary":     binary_result,
        "all_probs":  all_probs,
        "features":   explanation,
        "quality": {
            "ok":           True,
            "snr_db":       round(snr_db, 2),
            "audio_quality": audio_quality,
        },
        "error": None,
    }


# ─── CLI QUICK-TEST ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    wav = sys.argv[1] if len(sys.argv) > 1 else "sample.wav"

    if not os.path.exists(wav):
        print(f"[ERROR] File not found: '{wav}'")
        print("Usage: python model_utils.py path/to/audio.wav")
        sys.exit(1)

    print(f"\nRunning predict_audio on: {wav}\n")
    result = predict_audio(wav)

    if result["error"]:
        print(f"[ERROR] {result['error']}")
    else:
        print(f"  Condition   : {result['condition']}")
        print(f"  Binary      : {result['binary']}")
        print(f"  Severity    : {result['severity']}")
        print(f"  Confidence  : {result['confidence'] * 100:.1f}%")
        print(f"  Risk Score  : {result['risk_score']} / 100  ({result['risk_band']})")
        print(f"  SNR         : {result['quality']['snr_db']} dB  "
              f"({result['quality']['audio_quality']})")
        print(f"\n  Class Probabilities:")
        for cls, prob in result["all_probs"].items():
            bar = "█" * int(prob / 5)
            print(f"    {cls:<25} {prob:>6.2f}%  {bar}")
        print(f"\n  Top Explainability Features:")
        for feat, level in result["features"].items():
            print(f"    {feat:<25} {level}")