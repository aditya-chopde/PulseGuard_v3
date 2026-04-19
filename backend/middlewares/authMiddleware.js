import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided. Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }
};
