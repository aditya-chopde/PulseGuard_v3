import Medicine from '../models/Medicine.js';

// @desc    Get all medicines
// @route   GET /medicines
// @access  Private (Doctor)
export const getMedicines = async (req, res, next) => {
    try {
        // Limited to 50 to prevent frontend crash
        const medicines = await Medicine.find().limit(50).sort('name');
        res.status(200).json({ success: true, count: medicines.length, data: medicines });
    } catch (error) {
        next(error);
    }
};

// @desc    Search medicines
// @route   GET /medicines/search
// @access  Private
export const searchMedicines = async (req, res, next) => {
    try {
        const { q, drugClass, dosageForm, uses, ingredients } = req.query;
        let p = {};
        
        let orConditions = [];

        if (q && q.trim().length > 0) {
            const terms = q.trim().split(' ').filter(Boolean);
            terms.forEach(term => {
                const regex = { $regex: term, $options: 'i' };
                orConditions.push({ name: regex });
                orConditions.push({ drugClass: regex });
                orConditions.push({ uses: regex });
                orConditions.push({ ingredients: regex });
            });
        }
        
        if (orConditions.length > 0) {
            p.$or = orConditions;
        }

        if (drugClass) p.drugClass = { $regex: drugClass, $options: 'i' };
        if (dosageForm) p.dosageForm = { $regex: dosageForm, $options: 'i' };
        if (uses) p.uses = { $regex: uses, $options: 'i' };
        if (ingredients) p.ingredients = { $regex: ingredients, $options: 'i' };

        // Return max 50 items
        const medicines = await Medicine.find(p).limit(50).sort('name');

        res.status(200).json({ success: true, count: medicines.length, data: medicines });
    } catch (error) {
        next(error);
    }
};
