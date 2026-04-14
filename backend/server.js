import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';

// Route files
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorPatientRoutes from './routes/doctorPatientRoutes.js';
import screeningRoutes from './routes/screeningRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js'; // Optional if frontend expects it, though covered mostly by new endpoints

// Config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Rate Limiting
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });
// app.use(limiter); // Optionally uncomment in production if needed

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Static Folder for Uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctor-patients', doctorPatientRoutes); // Task 6
app.use('/api/v1/screenings', screeningRoutes); // Task 8 (Combines Predict + Uploads + Reports)
app.use('/api/v1/activity-plans', activityRoutes); // Task 9
app.use('/api/v1/medicines', medicineRoutes); // Task 10
app.use('/api/v1/doctor', doctorRoutes); 

app.get("/", (req, res) => {
    return res.json({ success: true, message: "PulseGuard Backend API v2 is Running..." });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
});