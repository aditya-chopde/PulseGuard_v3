import mongoose from 'mongoose';

const activityItemSchema = new mongoose.Schema({
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ActivityPlan',
        required: true
    },
    time: {
        type: String, // E.g., "08:00 AM" or Time string
        required: true
    },
    activity: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['exercise', 'breathing', 'diet', 'rest', 'medication'],
        required: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const ActivityItem = mongoose.model('ActivityItem', activityItemSchema);
export default ActivityItem;
