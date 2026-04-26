import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    slug: {
        type: String,
        index: true
    },
    brandName: {
        type: String,
        index: true
    },
    genericName: {
        type: String,
        index: true
    },
    drugClass: {
        type: String,
        index: true
    },
    uses: {
        type: [String],
        default: [],
        index: true
    },
    dosage: {
        type: String,
    },
    dosageForm: {
        type: String,
        index: true
    },
    dosageStrength: {
        type: String,
    },
    dosageFrequency: {
        type: String,
    },
    routeOfAdministration: {
        type: String,
        index: true
    },
    ingredients: {
        type: [String],
        default: [],
        index: true
    },
    ingredient_percentages: {
        type: Map,
        of: String
    },
    sideEffects: {
        type: [String],
        default: []
    },
    precautions: {
        type: [String],
        default: []
    },
    searchKeywords: {
        type: [String],
        default: [],
        index: true
    },
    isAvailableOTC: {
        type: Boolean,
        default: false
    },
    requiresPrescription: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

medicineSchema.index({ name: 'text', brandName: 'text', genericName: 'text', searchKeywords: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
