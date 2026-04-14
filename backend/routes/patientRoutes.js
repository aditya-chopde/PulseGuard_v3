import express from 'express';
import { getAssignedPatients, createAndAssignPatient, getPatientProfile } from '../controllers/patientController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import { patientOnly } from '../middlewares/patientOnlyMiddleware.js';
import { patientHasAcceptedDoctor } from '../middlewares/patientHasAcceptedDoctor.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(restrictTo('doctor'), getAssignedPatients)
    .post(restrictTo('doctor'), createAndAssignPatient);

router.route('/:id')
    .get(getPatientProfile);

export default router;
