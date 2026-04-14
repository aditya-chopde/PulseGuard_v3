import User from '../models/User.js';
import PatientDetail from '../models/PatientDetail.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// @desc    Register a user
// @route   POST /auth/signup
export const signup = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, age, gender, height, weight, bloodGroup, address, smokingStatus, medicalHistory, allergies, emergencyContact, specialization, licenseNumber, clinicName } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Step 1: Create the User entry
        const userData = {
            name,
            email,
            password: hashedPassword,
            role: role || 'patient',
            phone,
        };
        if (userData.role === 'doctor') {
            userData.specialization = specialization;
            userData.licenseNumber = licenseNumber;
            userData.clinicName = clinicName;
        }
        const user = await User.create(userData);

        // Step 2: If patient, create PatientDetails
        if (user.role === 'patient') {
            // Need some validation for patient specific fields if required
            if(!age || !gender){
                await User.findByIdAndDelete(user._id);
                return res.status(400).json({ success: false, error: 'Age and gender are required for patients' });
            }

            const patientData = {
                userId: user._id,
                age,
                gender,
                height,
                weight,
                bloodGroup,
                address,
                smokingStatus: smokingStatus !== undefined ? smokingStatus : false,
                medicalHistory: Array.isArray(medicalHistory) ? medicalHistory.map(s => s.trim()).filter(Boolean) : typeof medicalHistory === 'string' ? medicalHistory.split(',').map(s => s.trim()).filter(Boolean) : [],
                allergies: Array.isArray(allergies) ? allergies.map(s => s.trim()).filter(Boolean) : typeof allergies === 'string' ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
                emergencyContact: emergencyContact || {},
            };
            
            try {
                await PatientDetail.create(patientData);
            } catch (err) {
                // Manual rollback if Patient details failed to ensure atomic creation without replicate sets
                await User.findByIdAndDelete(user._id);
                return next(err);
            }
        }

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /auth/login
export const login = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Please provide email, password and role' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        if (user.role !== role) {
            return res.status(403).json({ success: false, error: 'Role mismatch. Please select correct role.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        next(error);
    }
};
