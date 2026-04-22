import mongoose from 'mongoose';

const screeningSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // Could be patient themselves or doctor
    },
    audioUrl: {
        type: String,
        required: true,
    },
    inputMethod: {
        type: String,
        enum: ['record', 'upload'],
        required: true,
    },
    condition: {
        type: String, // E.g., 'Murmur', 'Normal', 'Aortic Stenosis'
        required: true,
    },
    severity: {
        type: String,
        enum: ['None', 'Mild', 'Moderate', 'Severe', 'N/A'],
        default: 'N/A',
        required: true,
    },
    riskScore: {
        type: Number, // 0-100
        required: true,
    },
    confidence: {
        type: Number, // 0-100 mapped from 'probability'
        required: true,
    },
    pcgData: {
        type: [Number],
        default: []
    },
    spectrumData: {
        type: [Number],
        default: []
    },
    features: [{
        name: String,
        contribution: Number,
    }],
    reviewed: {
        type: Boolean,
        default: false,
    },
    doctorRemarks: {
        type: String,
    }
}, { timestamps: true });

const Screening = mongoose.model('Screening', screeningSchema);
export default Screening;
