import mongoose from 'mongoose';

const patientDetailSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    height: {
        type: Number, // Assuming cm or whatever unit
    },
    weight: {
        type: Number, // Assuming kg
    },
    bloodGroup: {
        type: String,
    },
    address: {
        type: String,
    },
    emergencyContact: {
      name: { type: String },
      phone: {
        type: String,
        match: /^[0-9]{10}$/
      }
    },
    medicalHistory: {
      type: [String],
      default: []
    },
    allergies: {
      type: [String],
      default: []
    },
    smokingStatus: {
      type: Boolean,
      default: false
    }
}, { timestamps: true });

const PatientDetail = mongoose.model('PatientDetail', patientDetailSchema);
export default PatientDetail;
