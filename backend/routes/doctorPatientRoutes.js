import express from 'express';
import { assignPatient, unassignPatient, sendRequest, respondRequest, getRequests } from '../controllers/doctorPatientController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import { patientOnly } from '../middlewares/patientOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

// Patient-only request endpoint
router.post('/request', patientOnly, sendRequest);

// Doctor-only respond endpoint
router.patch('/:id/respond', restrictTo('doctor'), respondRequest);

// Role-based requests list
router.get('/requests', getRequests);

// Legacy doctor assign/unassign
router.post('/', restrictTo('doctor'), assignPatient);
router.delete('/:id', restrictTo('doctor'), unassignPatient);

export default router;
