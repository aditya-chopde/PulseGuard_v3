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
        const { q, drugClass, dosageForm, uses, ingredients, dosageStrength, routeOfAdministration, isAvailableOTC, requiresPrescription } = req.query;
        let p = {};
        
        if (q && q.trim().length > 0) {
            const terms = q.trim().split(' ').filter(Boolean);
            p.$and = terms.map(term => {
                const regex = { $regex: term, $options: 'i' };
                return {
                    $or: [
                        { name: regex },
                        { brandName: regex },
                        { genericName: regex },
                        { drugClass: regex },
                        { uses: regex },
                        { ingredients: regex },
                        { searchKeywords: regex }
                    ]
                };
            });
        }

        if (drugClass) p.drugClass = { $regex: drugClass, $options: 'i' };
        if (dosageForm) p.dosageForm = { $regex: dosageForm, $options: 'i' };
        if (uses) p.uses = { $regex: uses, $options: 'i' };
        if (ingredients) p.ingredients = { $regex: ingredients, $options: 'i' };
        if (dosageStrength) p.dosageStrength = { $regex: dosageStrength, $options: 'i' };
        if (routeOfAdministration) p.routeOfAdministration = { $regex: routeOfAdministration, $options: 'i' };
        if (isAvailableOTC !== undefined) p.isAvailableOTC = isAvailableOTC === 'true';
        if (requiresPrescription !== undefined) p.requiresPrescription = requiresPrescription === 'true';

        // Return max 50 items for performance
        const medicines = await Medicine.find(p).limit(50).sort('name');

        res.status(200).json({ success: true, count: medicines.length, data: medicines });
    } catch (error) {
        next(error);
    }
};
