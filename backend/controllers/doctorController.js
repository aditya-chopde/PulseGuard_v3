import User from '../models/User.js';
import DoctorPatient from '../models/DoctorPatient.js';
import Screening from '../models/Screening.js';

// @desc    Get all doctors (public for signup)
export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('_id name specialization clinicName phone')
      .sort('name');

    // Null or empty check
    if (!doctors || doctors.length === 0) {
      console.log("Null or empty doctors array");
    }

    console.log(doctors);
    
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated stats for Doctor Dashboard
// @route   GET /doctor/dashboard
// @access  Private (Doctor)
export const getDashboardStats = async (req, res, next) => {
    try {
        const doctorId = req.user._id;

        // Find assigned mappings
        const mappings = await DoctorPatient.find({ doctorId });
        const patientIds = mappings.map(m => m.patientId);

        const totalPatients = mappings.length;
        const totalScreenings = await Screening.countDocuments({ patientId: { $in: patientIds } });

        // High alert patients (Risk score > 60)
         const highRiskScreenings = await Screening.find({ 
            patientId: { $in: patientIds },
            riskScore: { $gt: 60 } 
        }).populate('patientId', 'name email');

        // Extract unique patients prioritizing highest score
        const map = new Map();
        highRiskScreenings.forEach(screening => {
            const pid = screening.patientId._id.toString();
            if(!map.has(pid)){
                map.set(pid, {
                    patient: screening.patientId,
                    latestRiskScore: screening.riskScore,
                    condition: screening.condition,
                    screeningId: screening._id
                });
            } else {
                 if (screening.riskScore > map.get(pid).latestRiskScore) {
                     map.get(pid).latestRiskScore = screening.riskScore;
                     map.get(pid).condition = screening.condition;
                     map.get(pid).screeningId = screening._id;
                 }
            }
        });

        const highAlertPatients = Array.from(map.values());

        res.status(200).json({
            success: true,
            data: {
                totalPatients,
                totalScreenings,
                highAlertsCount: highAlertPatients.length,
                highAlertPatients
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all patients for doctor (alias logic from patientController for consistency, or simply return map info)

