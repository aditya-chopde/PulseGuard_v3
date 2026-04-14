import DoctorPatient from '../models/DoctorPatient.js';

export const patientHasAcceptedDoctor = async (req, res, next) => {
  try {
    const patientId = req.user._id;

    const mapping = await DoctorPatient.findOne({ 
      patientId, 
      status: 'accepted' 
    }).populate('doctorId', 'name specialization clinicName phone');

    if (!mapping) {
      return res.status(403).json({
        success: false,
        error: 'Doctor assignment required. Please wait for doctor approval or re-request.'
      });
    }

    // Attach doctor to req for use in controllers
    req.assignedDoctor = mapping.doctorId;
    
    next();
  } catch (error) {
    next(error);
  }
};

