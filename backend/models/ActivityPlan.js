import mongoose from 'mongoose';

const activityPlanSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Assuming one plan active per patient for simplicity
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String
    }
}, { timestamps: true });

const ActivityPlan = mongoose.model('ActivityPlan', activityPlanSchema);
export default ActivityPlan;
