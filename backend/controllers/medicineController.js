import Medicine from '../models/Medicine.js';

// @desc    Get all medicines
// @route   GET /medicines
// @access  Private (Doctor)
export const getMedicines = async (req, res, next) => {
    try {
        const medicines = await Medicine.find().sort('name');
        res.status(200).json({ success: true, count: medicines.length, data: medicines });
    } catch (error) {
        next(error);
    }
};

// @desc    Search medicines
// @route   GET /medicines/search?q=
// @access  Private (Doctor)
export const searchMedicines = async (req, res, next) => {
    try {
        const query = req.query.q;
        if (!query) {
             return res.status(400).json({ success: false, error: 'Search query required' });
        }

        // Case-insensitive regex search
        const medicines = await Medicine.find({ 
            name: { $regex: query, $options: 'i' } 
        }).limit(20).sort('name');

        res.status(200).json({ success: true, count: medicines.length, data: medicines });
    } catch (error) {
        next(error);
    }
};
