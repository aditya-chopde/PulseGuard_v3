import express from 'express';
import { getActivityPlan, upsertActivityPlan, addActivityItem, deleteActivityItem } from '../controllers/activityController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/:patientId', getActivityPlan);
router.put('/:patientId', restrictTo('doctor'), upsertActivityPlan);
router.post('/:patientId/items', restrictTo('doctor'), addActivityItem);
router.delete('/:patientId/items/:itemId', restrictTo('doctor'), deleteActivityItem);

export default router;
