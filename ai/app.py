from fastapi import FastAPI, UploadFile, File
import shutil
import os
from model_utils import predict_audio

app = FastAPI(title="PulseGuard AI Service")

UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "PulseGuard AI Service Running 🚀"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = predict_audio(file_path)

        os.remove(file_path)

        return result

    except Exception as e:
        return {"error": str(e)}