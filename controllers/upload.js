const multer = require('multer');
const path = require('path');
const { StatusCodes } = require('http-status-codes');

// Set up storage engine for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Specify the upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Use timestamp for unique filename
    }
});

// Initialize multer
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed. Please upload a valid image.'), false);
        }
    }
});

// Export a function to handle file upload
exports.uploadFile = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).send({ message: err.message });
        }
        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).send({ message: 'No file uploaded' });
        }
        // Successful file upload
        return next(); // Continue to the next middleware or function
    });
};

// Export multer configuration if needed elsewhere
exports.upload = upload;

