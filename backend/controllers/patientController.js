import User from '../models/User.js';
import PatientDetail from '../models/PatientDetail.js';
import DoctorPatient from '../models/DoctorPatient.js';
import bcrypt from 'bcryptjs';

// @desc    Get all patients assigned to the doctor
// @route   GET /patients
// @access  Private (Doctor)
export const getAssignedPatients = async (req, res, next) => {
    try {
        const doctorId = req.user._id;

        // Find only accepted mappings for this doctor
        const mappings = await DoctorPatient.find({ doctorId, status: 'accepted' });
        const patientIds = mappings.map(m => m.patientId);

        // Fetch User and PatientDetail simultaneously via aggregation or separate queries
        const patients = await User.aggregate([
            { $match: { _id: { $in: patientIds } } },
            {
                $lookup: {
                    from: 'patientdetails',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'details'
                }
            },
            { $unwind: { path: '$details', preserveNullAndEmptyArrays: true } },
            { $project: { password: 0 } } // Exclude password
        ]);

        res.status(200).json({ success: true, count: patients.length, data: patients });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a patient AND assign to doctor in one workflow
// @route   POST /patients
// @access  Private (Doctor)
export const createAndAssignPatient = async (req, res, next) => {
    try {
        const { name, email, password, age, gender, height, weight, bloodGroup, address, smokingStatus, medicalHistory, allergies, emergencyContact } = req.body;
        
        // Let's defer to /auth/signup logic or handle a subset here? The instructions say "doctor creates patient". 
        // We will create the user and assign them. (Assuming standard password generation if missing)

        const rawPassword = password || 'pulseguard123'; // Default password for doctor-created patients

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'patient',
            phone: req.body.phone,  // Add if provided
        });

        const patientData = {
            userId: newUser._id,
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
        const details = await PatientDetail.create(patientData);

        const mapping = await DoctorPatient.create({
            doctorId: req.user._id,
            patientId: newUser._id,
            status: 'accepted',
            requestedBy: req.user._id
        });

        res.status(201).json({ 
            success: true, 
            data: { user: newUser, details, mapping } 
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get specific patient full profile
// @route   GET /patients/:id
// @access  Private
export const getPatientProfile = async (req, res, next) => {
    try {
        const patientId = req.params.id;

        // Verify if doctor owns mapping (any status for viewing)
        if (req.user.role === 'doctor') {
             const mapping = await DoctorPatient.findOne({ doctorId: req.user._id, patientId });
             if(!mapping){
                 return res.status(403).json({ success: false, error: 'Not authorized to access this patient' });
             }
        } else if (req.user.role === 'patient') {
            if(req.user._id.toString() !== patientId) {
                return res.status(403).json({ success: false, error: 'You can only access your own profile' });
            }
        }

        const user = await User.findById(patientId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'Patient not found' });
        }

        const details = await PatientDetail.findOne({ userId: patientId });

        res.status(200).json({ success: true, data: { user, details } });
    } catch (error) {
        next(error);
    }
};
