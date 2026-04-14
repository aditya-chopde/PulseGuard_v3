import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    drugClass: {
        type: String,
    },
    uses: {
        type: [String],
        default: []
    },
    dosage: {
        type: String,
    },
    sideEffects: {
        type: [String],
        default: []
    },
    precautions: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
