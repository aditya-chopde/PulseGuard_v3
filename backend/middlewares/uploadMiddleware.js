import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir); 
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname) || '.wav'}`
        );
    },
});

// Check file type - accept wav, webm, ogg, mp3, m4a for browser recording compat
const checkFileType = (file, cb) => {
    const allowedExtensions = /wav|webm|ogg|mp3|m4a/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const allowedMimes = [
        'audio/wav', 'audio/x-wav', 'audio/wave',
        'audio/webm', 'audio/ogg', 'audio/mpeg',
        'audio/mp4', 'audio/m4a', 'audio/mp3',
        'application/octet-stream' // For blob uploads from MediaRecorder
    ];
    const mimetype = allowedMimes.includes(file.mimetype) || allowedExtensions.test(file.mimetype);

    if (mimetype || extname) {
        return cb(null, true);
    } else {
        cb(new Error('Audio files only (.wav, .webm, .ogg, .mp3, .m4a)'));
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});
