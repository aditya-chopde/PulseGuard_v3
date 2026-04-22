import Screening from '../models/Screening.js';
import DoctorPatient from '../models/DoctorPatient.js';
import { analyzeAudio } from '../services/aiService.js';
import { convertToWav } from '../services/audioConverter.js';
import fs from 'fs';

// @desc    Upload audio, predict with AI, and create screening record
// @route   POST /screenings
// @access  Private (Doctor or Patient)
export const createScreening = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload an audio file' });
        }

        let { patientId, inputMethod = 'upload', patientFactors } = req.body;
        
        // If current user is a patient, enforce that the screening goes to their own profile
        if (req.user.role === 'patient') {
            patientId = req.user._id;
        }

        if (!patientId) {
            if (req.file) try { fs.unlinkSync(req.file.path); } catch(e) {}
            return res.status(400).json({ success: false, error: 'Patient ID is required' });
        }

        // Validate access
        if (req.user.role === 'doctor') {
            const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId });
            if (!map) {
                fs.unlinkSync(req.file.path);
                return res.status(403).json({ success: false, error: 'Not authorized for this patient' });
            }
        }

        // 1. Convert to WAV 16kHz mono only if not already a WAV file
        let processedPath;
        const isWav = req.file.originalname?.toLowerCase().endsWith('.wav')
                   || req.file.mimetype === 'audio/wav'
                   || req.file.mimetype === 'audio/x-wav';

        if (isWav) {
            processedPath = req.file.path;
        } else {
            try {
                processedPath = await convertToWav(req.file.path);
            } catch (convErr) {
                console.warn('Audio conversion failed, using original:', convErr.message);
                processedPath = req.file.path;
            }
        }

        const optimizedPath = processedPath.replace(/\\/g, '/');
        const filename = optimizedPath.split('/').pop();
        const audioUrl = `/uploads/${filename}`;

        // 2. Transmit to Python AI Pipeline
        const aiResult = await analyzeAudio(optimizedPath);
        console.log("AI Result: ", aiResult);

        // Fallback checks
        if (aiResult && aiResult.error) {
            console.log("AI service returned an error:", aiResult.error);
            return res.status(500).json({ success: false, error: aiResult.error });
        }

        if (!aiResult || !aiResult.condition) {
            console.log("Invalid response from AI service");
            return res.status(500).json({ success: false, error: 'Invalid response from AI service' });
        }

        // Normalise severity — AI returns 'N/A' for Normal hearts, null on failures
        const VALID_SEVERITIES = ['None', 'Mild', 'Moderate', 'Severe', 'N/A'];
        const severity = VALID_SEVERITIES.includes(aiResult.severity) ? aiResult.severity : 'N/A';

        // 3. Compute Risk Metrics
        const riskScore = aiResult.risk_score !== undefined ? aiResult.risk_score : 50;
        const confidence = aiResult.confidence !== undefined ? aiResult.confidence : 80;
        const features = [];

        // 4. Save to DB
        const screening = await Screening.create({
            patientId,
            initiatedBy: req.user._id,
            audioUrl,
            inputMethod,
            condition: aiResult.condition,
            severity: severity,
            riskScore: riskScore,
            confidence: confidence,
            pcgData: aiResult.pcg_data || [],
            spectrumData: aiResult.spectrum_data || [],
            features
        });

        res.status(201).json({ success: true, data: screening });
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch(e) {}
        }
        next(error);
    }
};

// @desc    Get screenings for a patient
// @route   GET /screenings/:patientId
// @access  Private
export const getPatientScreenings = async (req, res, next) => {
    try {
        const patientId = req.params.patientId;

        if (req.user.role === 'doctor') {
            const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId });
             if (!map) return res.status(403).json({ success: false, error: 'Not authorized' });
        } else if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
             return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const screenings = await Screening.find({ patientId }).populate('initiatedBy', 'name role').sort('-createdAt');
        
        res.status(200).json({ success: true, count: screenings.length, data: screenings });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single screening by ID for report generation
// @route   GET /screenings/detail/:id
// @access  Private
export const getScreeningById = async (req, res, next) => {
    try {
        const screening = await Screening.findById(req.params.id)
            .populate('patientId', 'name email phone')
            .populate('initiatedBy', 'name role');
        
        if (!screening) {
            return res.status(404).json({ success: false, error: 'Screening not found' });
        }

        // Auth check
        if (req.user.role === 'patient' && screening.patientId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        if (req.user.role === 'doctor') {
            const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId: screening.patientId._id });
            if (!map) return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        res.status(200).json({ success: true, data: screening });
    } catch (error) {
        next(error);
    }
};

// @desc    Doctor review / updating remarks on a screening
// @route   PATCH /screenings/:id
// @access  Private (Doctor)
export const reviewScreening = async (req, res, next) => {
     try {
         const screeningId = req.params.id;
         const { doctorRemarks, reviewed } = req.body;

         const screening = await Screening.findById(screeningId);
         if(!screening){
              return res.status(404).json({ success: false, error: 'Screening not found' });
         }

         // check auth
         const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId: screening.patientId });
         if (!map) return res.status(403).json({ success: false, error: 'Not authorized' });

         if(doctorRemarks !== undefined) screening.doctorRemarks = doctorRemarks;
         if(reviewed !== undefined) screening.reviewed = reviewed;

         await screening.save();

         res.status(200).json({ success: true, data: screening });
     } catch(e) {
         next(e);
     }
}

