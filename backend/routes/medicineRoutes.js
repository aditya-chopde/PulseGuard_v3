import express from 'express';
import { getMedicines, searchMedicines } from '../controllers/medicineController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchMedicines); 
router.get('/', getMedicines);

export default router;
