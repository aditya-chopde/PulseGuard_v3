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
    dosageForm: {
        type: String,
    },
    ingredients: {
        type: [String],
        default: []
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
