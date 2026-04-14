import ActivityPlan from '../models/ActivityPlan.js';
import ActivityItem from '../models/ActivityItem.js';
import DoctorPatient from '../models/DoctorPatient.js';

// @desc    Get activity plan and items for a patient
// @route   GET /activity-plans/:patientId
// @access  Private
export const getActivityPlan = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        // Security check
        if (req.user.role === 'doctor') {
            const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId });
             if (!map) return res.status(403).json({ success: false, error: 'Not authorized' });
        } else if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
             return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const plan = await ActivityPlan.findOne({ patientId });
        if(!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found for this patient' });
        }

        const items = await ActivityItem.find({ planId: plan._id }).sort('sortOrder');

        res.status(200).json({ success: true, data: { plan, items } });
    } catch (error) {
        next(error);
    }
}

// @desc    Create or update activity plan core info (upsert)
// @route   PUT /activity-plans/:patientId
// @access  Private (Doctor)
export const upsertActivityPlan = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { notes } = req.body;

        // Security check
        const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId });
        if (!map) return res.status(403).json({ success: false, error: 'Not authorized' });

        let plan = await ActivityPlan.findOne({ patientId });
        if(plan) {
            plan.notes = notes !== undefined ? notes : plan.notes;
            await plan.save();
        } else {
            plan = await ActivityPlan.create({
                patientId,
                doctorId: req.user._id,
                notes
            });
        }

        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
}

// @desc    Add an item to the activity plan
// @route   POST /activity-plans/:patientId/items
// @access  Private (Doctor)
export const addActivityItem = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { time, activity, category, sortOrder } = req.body;

        // Verify patient access
        const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId });
        if (!map) return res.status(403).json({ success: false, error: 'Not authorized' });

        let plan = await ActivityPlan.findOne({ patientId });
        if(!plan) {
            return res.status(404).json({ success: false, error: 'Activity Plan does not exist. Create the plan first.'});
        }

        const item = await ActivityItem.create({
            planId: plan._id,
            time,
            activity,
            category,
            sortOrder: sortOrder || 0
        });

        res.status(201).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
}

// @desc    Delete an activity item
// @route   DELETE /activity-plans/:patientId/items/:itemId
// @access  Private (Doctor)
export const deleteActivityItem = async (req, res, next) => {
    try {
        const { patientId, itemId } = req.params;

        const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId });
        if (!map) return res.status(403).json({ success: false, error: 'Not authorized' });

        const item = await ActivityItem.findById(itemId);
        if(!item) {
             return res.status(404).json({ success: false, error: 'Item not found' });
        }

        await item.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
}
