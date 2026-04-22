# PulseGuard | main.py
# FastAPI service — accepts a .wav upload and returns AI prediction results.
# Author  : Abhishek Jadhav | GP Sadar, Nagpur
# Run     : uvicorn main:app --host 0.0.0.0 --port 8000 --reload

import os
import shutil
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from model_utils import predict_audio, PulseGuardModel


# ─── LIFESPAN — warm up the model once at startup ────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load ResNet50 + XGBoost before the first request arrives."""
    print("Warming up PulseGuard model ...")
    PulseGuardModel.get_instance()          # loads and caches the singleton
    print("Model ready. Server is live.\n")
    yield
    print("Shutting down PulseGuard service.")


# ─── APP ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PulseGuard AI Service",
    description=(
        "Heart-sound classification using ResNet50 (features) + XGBoost (classifier). "
        "Upload a .wav file and receive a structured cardiac risk report."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".wav", ".WAV"}
MAX_FILE_SIZE_MB   = 20


# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def home():
    """Health-check endpoint."""
    return {"message": "PulseGuard V3 AI Service Running 🚀", "status": "ok"}


@app.get("/health", tags=["Health"])
def health():
    """Detailed service health status."""
    model = PulseGuardModel.get_instance()
    return {
        "status":        "healthy",
        "model_loaded":  model is not None,
        "classes":       model.classes,
    }


@app.post("/predict", tags=["Prediction"])
async def predict(file: UploadFile = File(...)):
    """
    Upload a heart-sound WAV file and receive a full cardiac risk report.

    **Returns:**
    - `condition`   – Predicted diagnosis (e.g. "Aortic Stenosis")
    - `binary`      – Stage-1 screen: "Normal" or "Abnormal"
    - `severity`    – "Mild" / "Moderate" / "Severe" / "N/A"
    - `risk_score`  – Composite risk score (0–100)
    - `risk_band`   – "Low" / "Moderate" / "High" / "Critical"
    - `confidence`  – Model confidence (0.0–1.0)
    - `all_probs`   – Per-class probabilities (%)
    - `features`    – Top-5 explainability features
    - `quality`     – Audio SNR and quality flag
    - `error`       – null on success, message on failure
    """
    # ── Validate file extension ───────────────────────────────────────────────
    _, ext = os.path.splitext(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Please upload a .wav file.",
        )

    # ── Validate file size ────────────────────────────────────────────────────
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB} MB limit.",
        )

    # ── Save to temp dir with a unique name (avoids filename collisions) ──────
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path   = os.path.join(UPLOAD_DIR, unique_name)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        # ── Run inference ─────────────────────────────────────────────────────
        result = predict_audio(file_path)

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Inference failed: {str(e)}"},
        )

    finally:
        # Always clean up the temp file, even if inference raised
        if os.path.exists(file_path):
            os.remove(file_path)

    # ── Surface model-level errors as 422 ────────────────────────────────────
    if result.get("error"):
        return JSONResponse(
            status_code=422,
            content=result,
        )

    return result