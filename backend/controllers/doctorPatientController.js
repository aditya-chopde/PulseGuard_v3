import DoctorPatient from '../models/DoctorPatient.js';
import User from '../models/User.js';

// @desc    Assign an existing patient to the logged-in doctor
// @route   POST /doctor-patients
// @access  Private (Doctor)
export const assignPatient = async (req, res, next) => {
    try {
        const { patientId } = req.body;
        const doctorId = req.user._id;

        // Verify patient exists and is actually a patient
        const patient = await User.findById(patientId);
        if (!patient || patient.role !== 'patient') {
            return res.status(404).json({ success: false, error: 'Patient user not found' });
        }

        // Check if mapping already exists
        const existingMap = await DoctorPatient.findOne({ doctorId, patientId });
        if (existingMap) {
            return res.status(400).json({ success: false, error: 'Patient already assigned to this doctor' });
        }

        const mapping = await DoctorPatient.create({
            doctorId,
            patientId,
            requestedBy: doctorId
        });

        res.status(201).json({ success: true, data: mapping });
    } catch (error) {
         // Handle duplicate key error 11000 gracefully if race condition occurs
         if(error.code === 11000){
             return res.status(400).json({ success: false, error: 'Patient already assigned' });
         }
        next(error);
    }
};

// @desc    Unassign a patient from the doctor
// @route   DELETE /doctor-patients/:id
// @access  Private (Doctor)
export const unassignPatient = async (req, res, next) => {
    try {
        const mappingId = req.params.id; // Assuming passing the mapping ID, or could pass patient ID
        
        const mapping = await DoctorPatient.findById(mappingId);
        if (!mapping) {
            return res.status(404).json({ success: false, error: 'Mapping not found' });
        }

        if (mapping.doctorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this mapping' });
        }

        await mapping.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Patient sends request to doctor
// @route   POST /doctor-patients/request
// @access  Private (Patient)
export const sendRequest = async (req, res, next) => {
    try {
        console.log("USER:", req.user);
        
        if (req.user.role !== 'patient') {
            return res.status(403).json({ success: false, error: 'Only patients can send requests' });
        }

        const { doctorId } = req.body;
        const patientId = req.user._id;

        // Verify doctor exists and is doctor
        const doctor = await User.findById(doctorId).select('name role specialization clinicName phone');
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        // Check existing requests for THIS patient
        const existing = await DoctorPatient.findOne({
            patientId: req.user._id,
            status: { $in: ["pending", "accepted"] }
        });

        if (existing) {
            return res.status(400).json({ success: false, error: 'Already have active request' });
        }

        // Create new request
        const request = await DoctorPatient.create({
            doctorId,
            patientId: req.user._id,
            requestedBy: req.user._id,
            status: 'pending'
        });
        
        console.log("REQUEST DATA:", request);

        res.status(201).json({ success: true, data: request });
    } catch (error) {
        next(error);
    }
};

// @desc    Doctor responds to request
// @route   PATCH /doctor-patients/:id/respond
// @access  Private (Doctor)
export const respondRequest = async (req, res, next) => {
    try {
        const mappingId = req.params.id;
        const { action } = req.body; // 'accept' or 'decline'
        const doctorId = req.user._id;

        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({ success: false, error: 'Action must be accept or decline' });
        }

        const mapping = await DoctorPatient.findById(mappingId);
        if (!mapping) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        if (mapping.doctorId.toString() !== doctorId.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (mapping.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Request is already processed' });
        }

        if (action === 'accept') {
            mapping.status = 'accepted';
        } else if (action === 'decline') {
            mapping.status = 'declined';
        }
        
        await mapping.save();

        res.status(200).json({ success: true, data: mapping });
    } catch (error) {
        next(error);
    }
};

// @desc    Get doctor's pending requests OR patient's request status/history
// @route   GET /doctor-patients/requests
// @access  Private
export const getRequests = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;

        let requests;

        if (role === 'doctor') {
            // Doctor sees incoming requests
            requests = await DoctorPatient.find({ 
                doctorId: userId, 
                status: 'pending' 
            }).populate('patientId', 'name email phone').sort('-createdAt');
        } else {
            // Patient sees ALL their request statuses
            requests = await DoctorPatient.find({ 
                patientId: userId
            }).populate('doctorId', 'name specialization clinicName phone').sort('-assignedAt');
        }

        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        next(error);
    }
};

