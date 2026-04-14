import express from 'express';
import { createScreening, getPatientScreenings, getScreeningById, reviewScreening } from '../controllers/screeningController.js';
import { generateReport } from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('audio'), createScreening);
router.get('/detail/:id', getScreeningById);
router.get('/:id/report', generateReport);
router.get('/:patientId', getPatientScreenings);
router.patch('/:id', restrictTo('doctor'), reviewScreening);

export default router;
