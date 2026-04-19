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
// @access  Private
export const searchMedicines = async (req, res, next) => {
    try {
        const raw = req.query.q;
        if (!raw || raw.trim().length === 0) {
             return res.status(400).json({ success: false, error: 'Search query required' });
        }

        const query = raw.trim();
        const regex = { $regex: query, $options: 'i' };

        // Search across name, drugClass AND uses for broader matches
        const medicines = await Medicine.find({
            $or: [
                { name: regex },
                { drugClass: regex },
                { uses: regex },
            ]
        }).limit(20).sort('name');

        res.status(200).json({ success: true, count: medicines.length, data: medicines });
    } catch (error) {
        next(error);
    }
};
