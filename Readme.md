# ❤️ PulseGuard

### AI-Powered Cardiac Pre-Screening & Heart Sound Analysis System

---

## 📌 Overview

**PulseGuard** is an AI-powered cardiac pre-screening system designed to analyze heart sound recordings and detect potential abnormalities at an early stage.

It combines **Machine Learning + Deep Learning** to:

* Detect abnormal heart sounds
* Classify cardiac conditions
* Predict severity
* Generate risk scores
* Assist doctors in clinical decision-making

👉 Built especially for **rural healthcare and primary clinics** where advanced diagnostic tools are limited.

---

## ❗ Problem Statement

* Shortage of cardiologists in rural areas
* High cost of diagnostic tools (ECG, Echo)
* Late detection of heart diseases
* Manual auscultation depends heavily on expertise
* Lack of affordable AI-based screening solutions

---

## 🎯 Objectives

* Develop a **low-cost AI-based screening system**
* Enable **early detection** of heart diseases
* Provide **risk scoring & severity classification**
* Assist doctors with **AI-driven insights**
* Support **telemedicine and rural healthcare**

---

## ⚙️ System Workflow

```
Heart Sound Input
        ↓
Audio Preprocessing
        ↓
Feature Extraction (MFCC)
        ↓
AI Model (XGBoost + CNN)
        ↓
Disease Classification
        ↓
Severity Prediction
        ↓
Risk Score Generation
        ↓
Reports & Recommendations
        ↓
Doctor Review
```

---

## 🛠️ Tech Stack

### 🤖 AI & Data Processing

* Python
* NumPy, Pandas
* Librosa
* Scikit-learn (XGBoost)
* TensorFlow / Keras (CNN)

### 🔙 Backend

* FastAPI
* REST APIs
* JSON

### 🎨 Frontend

* Next.js
* React + TypeScript
* Tailwind CSS
* ShadCN UI
* Recharts

### 🗄️ Database

* MongoDB / SQLite

---

## 📊 Dataset

### Sources

* PhysioNet Heart Sound Dataset
* CirCor DigiScope Dataset

### Data Type

* `.wav` audio files

### Labels

* Normal
* Murmur
* Abnormal

---

## 🧠 AI Model Pipeline

### 1. Audio Preprocessing

* Noise removal
* Filtering
* Segmentation (S1, S2 sounds)

### 2. Feature Extraction

* MFCC
* Spectral features
* Energy
* Frequency distribution

### 3. Models Used

#### 🔹 XGBoost

* Works on extracted features
* Handles structured data

#### 🔹 CNN

* Works on spectrogram images
* Learns patterns visually

### 4. Hybrid Model

```
MFCC → XGBoost
Spectrogram → CNN
        ↓
Combined Output
        ↓
Final Prediction
```

### 5. Outputs

* Disease classification
* Severity prediction
* Confidence score

---

## 📈 Risk Score System

```
Risk Score =
(Severity × 0.4) +
(Probability × 0.3) +
(Acoustic Index × 0.2) +
(Patient Factors × 0.1)
```

### Risk Levels

| Score Range | Level    |
| ----------- | -------- |
| 0 – 30      | Low      |
| 31 – 60     | Moderate |
| 61 – 80     | High     |
| 81 – 100    | Critical |

---

## 💻 Frontend Features

* Modern SaaS Landing Page
* Authentication (Login / Signup)
* Dashboard (Risk, Severity, Trends)
* Audio Recording & Upload
* Results with Recommendations
* Patient History & Reports
* Doctor Dashboard
* Medicine Dictionary
* Activity Planner

---

## 🔌 Backend API Structure

| Endpoint    | Description     |
| ----------- | --------------- |
| `/auth`     | Login / Signup  |
| `/upload`   | Upload audio    |
| `/predict`  | AI prediction   |
| `/reports`  | Patient history |
| `/patients` | Patient data    |

---

## 🔐 Security

* JWT Authentication
* Role-Based Access Control (RBAC)
* Data Encryption

---

## 🧪 Hardware Requirements

### 🟢 Student Prototype (~₹8,000)

* Acoustic Stethoscope
* Condenser Microphone
* USB Audio Interface
* Audio Cables
* Tripod / Stand

### 🔵 Semi-Professional Setup (~₹20k–₹30k)

* Digital Stethoscope
* Audio Interface
* External Storage

---

## 🌍 Applications

* Rural Healthcare
* Clinics
* Telemedicine
* Screening Camps
* Government Health Programs

---

## ✅ Advantages

* Low cost
* Non-invasive
* Early detection
* Scalable
* AI-assisted diagnosis

---

## ⚠️ Limitations

* Depends on audio quality
* Not a replacement for ECG/Echo
* Requires clinical validation

---

## 🚀 Future Scope

* ECG integration
* IoT-enabled stethoscope
* Mobile application
* Cloud AI deployment
* Clinical trials

---

## 🔗 Future Integration

* ABHA ID linking
* Consent-based data sharing
* Health record storage

---

## 📌 Conclusion

PulseGuard bridges the gap between **advanced diagnostics** and **affordable healthcare** by transforming simple heart sound recordings into intelligent cardiac insights.

---

## 👨‍💻 Author

**Shripad Joshi & Team**
Final Year Project – PulseGuard

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub and support **AI for healthcare accessibility** ❤️
