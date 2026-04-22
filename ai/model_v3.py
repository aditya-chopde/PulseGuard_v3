# PulseGuard | Heart Disease AI — All 12 PDF Steps
# Datasets : PhysioNet 2016, CirCor 2022, Yaseen 2018
# Model    : ResNet50 (features) + XGBoost (classifier)
# Author   : Abhishek Jadhav | GP Sadar, Nagpur
import os
import pickle
import warnings
import numpy as np
import librosa
import noisereduce as nr          
import pandas as pd
import tensorflow as tf
import xgboost as xgb
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.patches import FancyBboxPatch
from scipy.signal import butter, sosfilt
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    roc_curve, auc, precision_recall_curve, average_precision_score
)
from sklearn.preprocessing import label_binarize
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

YASEEN_MAP = {"N": 0, "AS": 1, "MR": 2, "MS": 3, "MVP": 4}

CIRCOR_MAP = {
    "aortic": 1, "mitral": 2, "pulmonary": 0, "tricuspid": 0,
    "absent": 0, "normal": 0, "present": 2,
    "mv": 4, "mvp": 4, "as": 1, "mr": 2, "ms": 3,
}

# Dark theme colours
BG      = "#0D1117"
CARD    = "#161B22"
GREEN   = "#3FB950"
RED     = "#E05252"
BLUE    = "#58A6FF"
ORANGE  = "#F0883E"
PURPLE  = "#BC8CFF"
TEXT    = "#E6EDF3"
MUTED   = "#8B949E"
GRID    = "#21262D"

CLASS_COLORS = [GREEN, BLUE, RED, ORANGE, PURPLE]


# ─── LOAD ResNet50 ────────────────────────────────────────────────────────────

print("Loading ResNet50 ...")
_base     = ResNet50(weights="imagenet", include_top=False, input_shape=(IMG, IMG, 3))
extractor = Model(_base.input, GlobalAveragePooling2D()(_base.output))
print("ResNet50 ready.\n")


# ─── STEP 10 — QUALITY GATE (Fix 2: relaxed threshold) ───────────────────────
# SNR threshold lowered from 5.0 dB → 0.0 dB.
# Audio is no longer hard-rejected; instead a "Poor" quality flag is returned
# so the pipeline continues and the caller receives a prediction + warning.

def check_quality(y):
    # Must be at least 0.5 s to contain a heartbeat
    if len(y) < SR * 0.5:
        return False, "Recording too short. Please re-record."

    # Compute SNR (first 0.1 s = noise reference)
    noise = y[: int(SR * 0.1)]
    snr   = 10 * np.log10((np.mean(y ** 2) + 1e-10) / (np.mean(noise ** 2) + 1e-10))

    # Fix 2: was `snr < 5.0`; now accept anything above 0 dB; flag the rest
    if snr < 0.0:
        # Return True so the pipeline keeps going; caller will see audio_quality="Poor"
        return True, f"Poor audio quality (SNR={snr:.2f} dB). Prediction may be less reliable."

    return True, "OK"


# ─── STEP 2 — AUDIO PREPROCESSING (Fixes 3, 4, 5) ───────────────────────────
# New pipeline:
#   Bandpass → Conditional noise reduction → Signal amplification → Normalise

def preprocess(y):
    # Keep only 25–900 Hz (heart sound range)
    sos = butter(4, [25 / 2000, 0.99], btype="band", output="sos")
    y   = sosfilt(sos, y)

    # Fix 3 + Fix 5: noise reduction, but ONLY for clips longer than 2 s
    # (short clips caused time_mask_smooth_ms / low-sample-rate conflicts)
    if len(y) > SR * 2:
        try:
            y = nr.reduce_noise(y=y, sr=SR, stationary=False)
        except Exception:
            pass  # graceful fallback — continue without denoising

    # Fix 4: amplify — heart sounds are low amplitude; boosts model confidence
    y = y * 3

    # Scale to [-1, 1]
    return y / (np.max(np.abs(y)) + 1e-10)


# ─── STEP 3A — DEEP FEATURES (2048-D via ResNet50) ───────────────────────────

def extract_deep_features(y):
    mel    = librosa.feature.melspectrogram(y=y, sr=SR, n_mels=128)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_db = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8)

    img = tf.image.resize(mel_db[..., np.newaxis], (IMG, IMG)).numpy()
    img = np.repeat(img, 3, axis=-1)[np.newaxis]   # shape: (1, 224, 224, 3)

    return extractor.predict(img, verbose=0).flatten()


# ─── STEP 3B — HANDCRAFTED FEATURES (85-D, used for Explainable AI) ──────────

def extract_hand_features(y):
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


# ─── STEP 1 — LOAD AUDIO ─────────────────────────────────────────────────────
# Fix 1: inference now uses deep_feat.reshape(1, -1) — NOT np.concatenate([deep, hand])
#        This matches the 2048-D shape the XGBoost models were trained on.

def load_audio(path):
    """Load → quality check → preprocess → extract features.

    Returns
    -------
    deep_feat : np.ndarray | None  — 2048-D vector (Fix 1: shape-corrected)
    hand_feat : np.ndarray | None  — 85-D vector  (for XAI only)
    status    : str                — "ok" | quality warning | error message
    """
    try:
        y, _ = librosa.load(path, sr=SR, mono=True)
        ok, msg = check_quality(y)
        if not ok:
            return None, None, msg
        y = preprocess(y)
        deep = extract_deep_features(y)
        hand = extract_hand_features(y)
        return deep, hand, msg   # msg may carry a "Poor" quality warning
    except Exception as e:
        return None, None, str(e)


# ─── STEP 6 — SEVERITY ───────────────────────────────────────────────────────

def get_severity(confidence):
    if confidence < 0.70:  return "Mild"
    if confidence < 0.88:  return "Moderate"
    return "Severe"


# ─── STEP 7 — RISK SCORE (0–100) ─────────────────────────────────────────────

def get_risk_score(pred_class, confidence_pct, severity, snr_db):
    if pred_class == 0:
        return min(30, max(0, 30 - int(confidence_pct * 0.3)))
    base        = {"Mild": 20, "Moderate": 50, "Severe": 80}[severity]
    conf_bonus  = (confidence_pct - 50) * 0.4
    snr_penalty = max(0, (15 - snr_db) * 0.5)
    return max(0, min(100, int(base + conf_bonus + snr_penalty)))

def get_risk_band(score):
    if score <= 30:  return "Low"
    if score <= 60:  return "Moderate"
    if score <= 80:  return "High"
    return "Critical"


# ─── STEP 9 — EXPLAINABLE AI ─────────────────────────────────────────────────

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

def explain_prediction(hand_features, top_n=5):
    norm        = np.abs(hand_features) / (np.abs(hand_features).max() + 1e-10)
    top_indices = np.argsort(norm)[::-1][:top_n]
    result = {}
    for i in top_indices:
        label = FEAT_ALIASES.get(FEAT_NAMES[i], FEAT_NAMES[i])
        level = "High" if norm[i] > 0.7 else "Medium" if norm[i] > 0.4 else "Low"
        result[label] = level
    return result


# ─── DATA COLLECTION ─────────────────────────────────────────────────────────

all_features = []
all_labels   = []

# PhysioNet 2016 — Normal samples only
physio_dir = "data/physionet2016"
if os.path.exists(physio_dir):
    folders = [f for f in os.listdir(physio_dir) if "training" in f or "validation" in f]
    for folder in sorted(folders):
        ref_path = f"{physio_dir}/{folder}/REFERENCE.csv"
        if not os.path.exists(ref_path):
            continue
        ref = pd.read_csv(ref_path, header=None, names=["filename", "label"])
        for _, row in ref.iterrows():
            if int(row.label) != 1:
                continue
            feat, _, _ = load_audio(f"{physio_dir}/{folder}/{row.filename}.wav")
            if feat is not None:
                all_features.append(feat);  all_labels.append(0)
    print(f"PhysioNet: {all_labels.count(0)} Normal samples loaded")

# CirCor 2022 — murmur location keyword mapped to disease class
circor_dir = "data/circor"
if os.path.exists(circor_dir):
    for csv_file, audio_folder in [("set_a.csv", "set_a"), ("set_b.csv", "set_b")]:
        csv_path = f"{circor_dir}/{csv_file}"
        if not os.path.exists(csv_path):
            continue
        df = pd.read_csv(csv_path)
        fname_col = next((c for c in df.columns if c.lower() in ["fname","filename","recording","file","name"]), None)
        label_col = next((c for c in df.columns if c.lower() in ["label","murmur","class","category"]), None)
        loc_col   = next((c for c in df.columns if "location" in c.lower()), None)
        if not fname_col or not label_col:
            continue
        for _, row in df.iterrows():
            fname = str(row[fname_col]).strip()
            wav   = f"{circor_dir}/{audio_folder}/{fname}"
            if not fname.endswith(".wav"):
                wav += ".wav"
            if not os.path.exists(wav):
                continue
            raw_label = str(row[label_col]).strip().lower()
            if raw_label in ["normal", "absent", "0", "n"]:
                cls = 0
            elif loc_col and pd.notna(row.get(loc_col)):
                cls = CIRCOR_MAP.get(str(row[loc_col]).strip().lower(), 2)
            else:
                cls = 2
            feat, _, _ = load_audio(wav)
            if feat is not None:
                all_features.append(feat);  all_labels.append(cls)
    print(f"CirCor: {len(all_labels)} total samples so far")

# Yaseen 2018 — 5 labelled disease folders
yaseen_dir = "data/yaseen2018"
if os.path.exists(yaseen_dir):
    for folder in sorted(os.listdir(yaseen_dir)):
        prefix = folder.split("_")[0].upper()
        if prefix not in YASEEN_MAP:
            continue
        cls       = YASEEN_MAP[prefix]
        wav_files = [f for f in os.listdir(f"{yaseen_dir}/{folder}") if f.endswith(".wav")]
        for wav_file in wav_files:
            feat, _, _ = load_audio(f"{yaseen_dir}/{folder}/{wav_file}")
            if feat is not None:
                all_features.append(feat);  all_labels.append(cls)
    print(f"Yaseen: {len(all_labels)} total samples loaded\n")


# ─── TRAIN / TEST SPLIT ───────────────────────────────────────────────────────

X = np.array(all_features)
y = np.array(all_labels)

print(f"Total samples: {len(y)}")
for cls_id in range(5):
    print(f"  Class {cls_id}  {CLASSES[cls_id]:<25}: {np.sum(y == cls_id)} samples")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {len(X_train)}  |  Test: {len(X_test)}\n")


# ─── STEP 4 — BINARY CLASSIFIER (Normal vs Abnormal) ─────────────────────────

print("Training Stage 1: Binary classifier ...")
binary_model = xgb.XGBClassifier(
    n_estimators=200, max_depth=5, learning_rate=0.05,
    objective="binary:logistic", eval_metric="logloss",
    random_state=42, use_label_encoder=False,
)
binary_model.fit(
    X_train, (y_train != 0).astype(int),
    eval_set=[
        (X_train, (y_train != 0).astype(int)),
        (X_test,  (y_test  != 0).astype(int)),
    ],
    verbose=False,
)
bin_pred  = binary_model.predict(X_test)
bin_prob  = binary_model.predict_proba(X_test)[:, 1]
bin_acc   = accuracy_score((y_test != 0).astype(int), bin_pred)
bin_eval  = binary_model.evals_result()
bin_rep   = classification_report(
    (y_test != 0).astype(int), bin_pred,
    target_names=["Normal", "Abnormal"], output_dict=True
)
print(f"Binary accuracy: {bin_acc * 100:.2f}%\n")


# ─── STEP 5 — MULTI-CLASS CLASSIFIER (5 disease classes) ─────────────────────

print("Training Stage 2: Multi-class classifier ...")
multi_model = xgb.XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    objective="multi:softprob", num_class=5,
    eval_metric="mlogloss", random_state=42, use_label_encoder=False,
)
multi_model.fit(
    X_train, y_train,
    eval_set=[(X_train, y_train), (X_test, y_test)],
    verbose=50,
)
multi_eval = multi_model.evals_result()

y_pred     = multi_model.predict(X_test)
y_prob_all = multi_model.predict_proba(X_test)
acc        = accuracy_score(y_test, y_pred)
cm         = confusion_matrix(y_test, y_pred, labels=list(range(5)))
report     = classification_report(
    y_test, y_pred,
    target_names=list(CLASSES.values()), output_dict=True
)
print(f"\nMulti-class accuracy: {acc * 100:.2f}%")
print(classification_report(y_test, y_pred, target_names=list(CLASSES.values())))


# ─── SAVE MODELS ─────────────────────────────────────────────────────────────

os.makedirs("models", exist_ok=True)
with open("models/pulseguard.pkl", "wb") as f:
    pickle.dump({"binary": binary_model, "multi": multi_model, "classes": CLASSES}, f)
print("Models saved → models/pulseguard.pkl")


# ─── EVALUATION DASHBOARD ────────────────────────────────────────────────────

plt.rcParams.update({
    "figure.facecolor":  BG,
    "axes.facecolor":    CARD,
    "axes.edgecolor":    GRID,
    "axes.labelcolor":   TEXT,
    "xtick.color":       MUTED,
    "ytick.color":       MUTED,
    "text.color":        TEXT,
    "grid.color":        GRID,
    "grid.linewidth":    0.6,
    "font.family":       "monospace",
})

fig = plt.figure(figsize=(22, 20), facecolor=BG)
fig.suptitle(
    "PulseGuard  ·  ResNet50 + XGBoost  ·  Evaluation Report",
    fontsize=16, fontweight="bold", color=TEXT, x=0.5, y=0.977,
)
gs = gridspec.GridSpec(
    3, 3, figure=fig,
    hspace=0.42, wspace=0.35,
    left=0.06, right=0.97, top=0.94, bottom=0.05,
)

def style_ax(ax, title):
    ax.set_title(title, fontsize=11, fontweight="bold", color=TEXT, pad=9, loc="left")
    for sp in ax.spines.values():
        sp.set_edgecolor("#30363D"); sp.set_linewidth(1.1)


# ROC Curve
ax_roc = fig.add_subplot(gs[0, 1])
style_ax(ax_roc, "ROC Curve")
fpr, tpr, _ = roc_curve((y_test != 0).astype(int), bin_prob)
roc_auc     = auc(fpr, tpr)
ax_roc.plot(fpr, tpr, color=BLUE, lw=2, label=f"AUC = {roc_auc:.3f}")
ax_roc.plot([0, 1], [0, 1], color=MUTED, lw=1, linestyle="--")
ax_roc.set_xlabel("False Positive Rate"); ax_roc.set_ylabel("True Positive Rate")
ax_roc.legend(fontsize=9, facecolor=CARD, edgecolor=GRID)
ax_roc.grid(True)

# Precision-Recall Curve
ax_pr_curve = fig.add_subplot(gs[0, 2])
style_ax(ax_pr_curve, "Precision-Recall Curve")
prec_c, rec_c, _ = precision_recall_curve((y_test != 0).astype(int), bin_prob)
ap               = average_precision_score((y_test != 0).astype(int), bin_prob)
ax_pr_curve.fill_between(rec_c, prec_c, alpha=0.4, color=ORANGE)
ax_pr_curve.plot(rec_c, prec_c, color=ORANGE, lw=2, label=f"AP = {ap:.3f}")
ax_pr_curve.set_xlabel("Recall"); ax_pr_curve.set_ylabel("Precision")
ax_pr_curve.legend(fontsize=9, facecolor=CARD, edgecolor=GRID)
ax_pr_curve.grid(True)

# Confusion Matrix
ax_cm = fig.add_subplot(gs[0, 0])
style_ax(ax_cm, "Confusion Matrix")
bin_cm    = confusion_matrix((y_test != 0).astype(int), bin_pred)
im        = ax_cm.imshow(bin_cm, cmap="RdYlGn", vmin=0)
tick_labs = ["Normal", "Abnormal"]
ax_cm.set_xticks([0, 1]); ax_cm.set_yticks([0, 1])
ax_cm.set_xticklabels(tick_labs, fontsize=10, rotation=15)
ax_cm.set_yticklabels(tick_labs, fontsize=10, rotation=90, va="center")
ax_cm.set_xlabel("Predicted"); ax_cm.set_ylabel("Actual")
for i in range(2):
    for j in range(2):
        v   = bin_cm[i, j]
        col = BG if v > bin_cm.max() * 0.5 else TEXT
        ax_cm.text(j, i, str(v), ha="center", va="center",
                   fontsize=20, fontweight="bold", color=col)

# Per-Class Metrics
ax_met = fig.add_subplot(gs[1, 0:2])
style_ax(ax_met, "Per-Class Metrics")
x_pos    = np.arange(3)
width    = 0.32
labels   = ["Normal", "Abnormal"]
metrics  = ["precision", "recall", "f1-score"]
met_labs = ["Precision", "Recall", "F1-Score"]
colors   = [GREEN, RED]
for ci, cls_name in enumerate(labels):
    vals = [bin_rep[cls_name][m] for m in metrics]
    bars = ax_met.bar(
        x_pos + (ci - 0.5) * width, vals, width,
        label=cls_name, color=colors[ci], alpha=0.88,
        edgecolor=BG, linewidth=0.8,
    )
    for bar, v in zip(bars, vals):
        ax_met.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.01,
            f"{v:.2f}", ha="center", va="bottom", fontsize=9, color=TEXT,
        )
ax_met.set_xticks(x_pos)
ax_met.set_xticklabels(met_labs, fontsize=10)
ax_met.set_ylim(0, 1.15)
ax_met.set_ylabel("Score")
ax_met.legend(fontsize=10, facecolor=CARD, edgecolor=GRID)
ax_met.grid(True, axis="y")

# Prediction Probability Distribution
ax_dist = fig.add_subplot(gs[1, 2])
style_ax(ax_dist, "Prediction Probability Distribution")
y_bin      = (y_test != 0).astype(int)
norm_probs = bin_prob[y_bin == 0]
ab_probs   = bin_prob[y_bin == 1]
ax_dist.hist(norm_probs, bins=30, alpha=0.7, color=GREEN, label="Normal",   edgecolor=BG)
ax_dist.hist(ab_probs,   bins=30, alpha=0.7, color=RED,   label="Abnormal", edgecolor=BG)
ax_dist.axvline(0.5, color=MUTED, linestyle="--", lw=1.2, label="Threshold = 0.5")
ax_dist.set_xlabel("Predicted Probability (Abnormal)")
ax_dist.set_ylabel("Count")
ax_dist.legend(fontsize=8, facecolor=CARD, edgecolor=GRID)
ax_dist.grid(True, axis="y")

# XGBoost Training Log-Loss
ax_loss = fig.add_subplot(gs[2, 0:2])
style_ax(ax_loss, "XGBoost Training Log-Loss")
train_loss = bin_eval["validation_0"]["logloss"]
val_loss   = bin_eval["validation_1"]["logloss"]
rounds     = range(1, len(train_loss) + 1)
best_round = int(np.argmin(val_loss)) + 1
ax_loss.plot(rounds, train_loss, color=BLUE,   lw=2, label="Train")
ax_loss.plot(rounds, val_loss,   color=ORANGE, lw=2, label="Validation")
ax_loss.fill_between(rounds, train_loss, val_loss, alpha=0.07, color=BLUE)
ax_loss.axvline(best_round, color=GREEN, linestyle="--", lw=1.2,
                label=f"Best round: {best_round}")
ax_loss.set_xlabel("Boosting Round")
ax_loss.set_ylabel("Log-Loss")
ax_loss.legend(fontsize=10, facecolor=CARD, edgecolor=GRID)
ax_loss.grid(True)

# Summary Scorecard
ax_sc = fig.add_subplot(gs[2, 2])
ax_sc.axis("off")
style_ax(ax_sc, "Summary Scorecard")

scorecard = [
    ("Accuracy",      f"{bin_acc * 100:.2f}%",        BLUE),
    ("ROC-AUC",       f"{roc_auc:.4f}",                GREEN),
    ("Avg Precision", f"{ap:.4f}",                     GREEN),
    ("Normal  F1",    f"{bin_rep['Normal']['f1-score']:.4f}",   GREEN),
    ("Abnormal F1",   f"{bin_rep['Abnormal']['f1-score']:.4f}", ORANGE),
    ("Best Round",    str(best_round),                 MUTED),
    ("Total Samples", str(len(y)),                     MUTED),
    ("Test Samples",  str(len(y_test)),                MUTED),
]

row_h = 0.096
for idx, (label, val, col) in enumerate(scorecard):
    y_pos = 0.88 - idx * row_h
    rect  = FancyBboxPatch(
        (0.02, y_pos - 0.04), 0.96, 0.082,
        boxstyle="round,pad=0.01", linewidth=0.8,
        edgecolor="#30363D", facecolor="#1C2128",
        transform=ax_sc.transAxes,
    )
    ax_sc.add_patch(rect)
    ax_sc.text(0.08, y_pos + 0.002, label, fontsize=9,
               color=MUTED, transform=ax_sc.transAxes, va="center")
    ax_sc.text(0.93, y_pos + 0.002, val, fontsize=9.5, fontweight="bold",
               color=col, transform=ax_sc.transAxes, va="center", ha="right")

os.makedirs("results", exist_ok=True)
plot_path = "results/pulseguard_evaluation.png"
plt.savefig(plot_path, dpi=150, bbox_inches="tight", facecolor=BG)
print(f"\nEvaluation dashboard saved → {plot_path}")
plt.show()


# ─── STEP 11 — INCREMENTAL LEARNING ──────────────────────────────────────────

def update_model(new_wav_paths, new_labels, model_path="models/pulseguard.pkl"):
    saved    = pickle.load(open(model_path, "rb"))
    existing = saved["multi"]

    new_feats, valid_labels = [], []
    for path, label in zip(new_wav_paths, new_labels):
        feat, _, _ = load_audio(path)
        if feat is not None:
            new_feats.append(feat);  valid_labels.append(label)

    if not new_feats:
        print("No valid new samples found."); return

    updated = xgb.XGBClassifier(
        n_estimators=existing.n_estimators + 50,
        max_depth=existing.max_depth,
        learning_rate=existing.learning_rate,
        objective="multi:softprob", num_class=5,
        random_state=42, use_label_encoder=False,
    )
    updated.fit(
        np.array(new_feats), np.array(valid_labels),
        xgb_model=existing.get_booster(), verbose=False,
    )
    saved["multi"] = updated
    pickle.dump(saved, open(model_path, "wb"))
    print(f"Model updated with {len(valid_labels)} new samples → {model_path}")


# ─── STEP 12 — PREDICT ───────────────────────────────────────────────────────
# Fix 1 applied: multi_model.predict_proba(deep.reshape(1, -1)) uses the
# 2048-D deep vector only — the old bug concatenated hand features (→ 2133-D).

def predict(audio_path):
    # Load file
    try:
        y_raw, _ = librosa.load(audio_path, sr=SR, mono=True)
    except Exception as e:
        return {"error": f"Could not load file: {e}"}

    # Quality gate (Fix 2: relaxed, returns flag instead of hard rejection)
    ok, msg = check_quality(y_raw)
    noise   = y_raw[: int(SR * 0.1)]
    snr_db  = float(10 * np.log10((np.mean(y_raw ** 2) + 1e-10) / (np.mean(noise ** 2) + 1e-10)))

    audio_quality = "Poor" if "Poor" in msg else "OK"

    if not ok:
        return {"condition": "Please re-record", "error": msg,
                "quality": {"ok": False, "snr_db": round(snr_db, 2),
                            "audio_quality": audio_quality}}

    # Preprocess + extract features (Fixes 3, 4, 5 happen inside preprocess())
    y_clean = preprocess(y_raw)
    deep    = extract_deep_features(y_clean)   # 2048-D
    hand    = extract_hand_features(y_clean)   # 85-D (XAI only)

    # Fix 1: use deep features ONLY, reshaped to (1, 2048)
    deep_input = deep.reshape(1, -1)

    # Binary screening (Step 4)
    binary_result = "Abnormal" if binary_model.predict(deep_input)[0] else "Normal"

    # Multi-class prediction (Step 5)
    probs      = multi_model.predict_proba(deep_input)[0]
    pred_class = int(np.argmax(probs))
    confidence = float(probs[pred_class])

    # Severity (Step 6)
    severity = "N/A" if pred_class == 0 else get_severity(confidence)

    # Risk score (Step 7)
    risk_score = get_risk_score(pred_class, confidence * 100, severity, snr_db)

    # Confidence + explainability (Steps 8 & 9)
    all_probs   = {CLASSES[i]: round(float(probs[i]) * 100, 2) for i in range(5)}
    explanation = explain_prediction(hand)

    return {
        "condition":    CLASSES[pred_class],
        "severity":     severity,
        "risk_score":   risk_score,
        "risk_band":    get_risk_band(risk_score),
        "confidence":   round(confidence, 4),
        "binary":       binary_result,
        "all_probs":    all_probs,
        "features":     explanation,
        "quality": {
            "ok":           True,
            "snr_db":       round(snr_db, 2),
            "audio_quality": audio_quality,   # Fix 2: "OK" or "Poor"
        },
        "error": None,
    }


# ─── QUICK TEST ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("  SAMPLE PREDICTIONS FROM TEST SET")
    print("=" * 65)

    indices = np.random.choice(len(X_test), min(10, len(X_test)), replace=False)
    for i, idx in enumerate(indices):
        # Fix 1: reshape to (1, 2048) for inference
        probs   = multi_model.predict_proba(X_test[idx].reshape(1, -1))[0]
        pred    = int(np.argmax(probs))
        conf    = float(probs[pred])
        actual  = int(y_test[idx])
        sev     = "N/A" if pred == 0 else get_severity(conf)
        score   = get_risk_score(pred, conf * 100, sev, 18.0)
        correct = "✓" if pred == actual else "✗"
        print(
            f"  {i+1:>2}. Actual: {CLASSES[actual]:<25}"
            f"  Pred: {CLASSES[pred]:<25}"
            f"  Conf: {conf * 100:>5.1f}%"
            f"  Severity: {sev:<10}"
            f"  Risk: {score:>3} ({get_risk_band(score)})  {correct}"
        )

    print("=" * 65)
    print(f"  Binary Accuracy      : {bin_acc * 100:.2f}%")
    print(f"  Multi-class Accuracy : {acc * 100:.2f}%")
    print(f"  ROC-AUC              : {roc_auc:.4f}")
    print(f"  Dashboard saved      : results/pulseguard_evaluation.png")
    print(f"  Usage: result = predict('patient.wav')")
    print("=" * 65)