import mongoose from 'mongoose';

const doctorPatientSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending','accepted','declined'],
      default: 'pending'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
});

// Unique index removed so a patient can have multiple requests over time if previous ones are declined.

const DoctorPatient = mongoose.model('DoctorPatient', doctorPatientSchema);
export default DoctorPatient;
