import express from 'express';
import { getDashboardStats, getDoctors } from '../controllers/doctorController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Public route for patients to get doctors
router.get('/doctors', getDoctors);

// Protected doctor routes
router.use(protect);
router.use(restrictTo('doctor'));

router.get('/dashboard', getDashboardStats);
// TODO: Implement remaining doctor endpoints
// router.get('/patients', getDoctorPatients);
// router.get('/reports', getDoctorReports);
// router.get('/alerts', getDoctorAlerts);

export default router;
