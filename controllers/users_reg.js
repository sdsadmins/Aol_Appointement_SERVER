require('dotenv').config();
const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const model = require("../models/users_reg");
const { getPageNo, getPageSize } = require('../utils/helper');
const bcrypt = require('bcrypt');
const validationDto = require('../dto/users_reg.dto');
const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = process.env.JWT_SECRET;
const uuid = require('uuid');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Specify the upload directory
    },
    filename: (req, file, cb) => {
        // Generate a unique filename using a timestamp and random string
        const uniqueSuffix = crypto.randomBytes(6).toString('hex'); // Adds random string for uniqueness
        cb(null, Date.now() + '-' + uniqueSuffix + '-' + file.originalname); // Safe, unique filename
    }
});

// Initialize multer
const upload = multer({
    storage: storage,
   
});

exports.getAll = async (req, res, next) => {
    try {
        const pageNo = await getPageNo(req);
        const pageSize = await getPageSize(req);
        const offset = (pageNo - 1) * pageSize;
        const totalCount = await model.count();
        const data = await model.find(offset, pageSize);
        if (!_.isEmpty(data)) {
            const result = {
                pageNo: pageNo,
                pageSize: pageSize,
                totalCount: totalCount,
                data: data,
            };
            res.status(StatusCodes.OK).send(result);
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No record found" });
        }
    } catch (e) {
        console.log(`Error in getAll`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.getOne = async (req, res, next) => {
    try {
        const id = req.params.id;

        const data = await model.findOne(id);
        if (!_.isEmpty(data)) {
            res.status(StatusCodes.OK).send(data[0]);
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No record found" });
        }
    } catch (e) {
        console.log(`Error in getById`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.create = async (req, res, next) => {
    try {
        const data = await model.insert(req.body);
        if (data) {
            res.status(StatusCodes.CREATED).send({ message: 'Record created', data: data });
        } else {
            res.status(StatusCodes.BAD_REQUEST).send({ message: "Bad Request!" });
        }
    } catch (e) {
        console.log(`Error in create`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;

        //const id = req.params.id;
        const data = await model.update(id, req.body);
        if (!_.isEmpty(data)) {
            res.status(StatusCodes.OK).send(data[0]);
        } else {
            res.status(StatusCodes.BAD_REQUEST).send({ message: "Bad request." });
        }
    } catch (e) {
        console.log(`Error in update`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.remove = async (req, res, next) => {
    try {
        const id = req.params.id;

        //const id = req.params.id;
        const data = await model.remove(id);
        if (data) {
            res.status(StatusCodes.OK).send({ message: "Resource deleted" });
        } else {
            res.status(StatusCodes.BAD_REQUEST).send({ message: "Bad request." });
        }
    } catch (e) {
        console.log(`Error in remove`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.search = async (req, res, next) => {
    try {
        const pageNo = await getPageNo(req);
        const pageSize = await getPageSize(req);
        const offset = (pageNo - 1) * pageSize;
        const searchKey = req.params.searchKey;
        const totalCount = await model.searchCount(searchKey.toLowerCase());
        const data = await model.search(offset, pageSize, searchKey.toLowerCase());
        if (!_.isEmpty(data)) {
            const result = {
                pageNo: pageNo,
                pageSize: pageSize,
                totalCount: totalCount,
                records: data,
            };
            res.status(StatusCodes.OK).send(result);
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No record found" });
        }
    } catch (e) {
        console.log(`Error in search`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.register = async (req, res) => {
    console.log("Middleware triggered"); // Check if the function is triggered

    // Use multer's file upload middleware
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err.message);
            return res.status(400).send({ message: err.message });
        }

        console.log("Request Body:", req.body); // Log the request body to check for sent data
        console.log("Request File:", req.file); // Log the uploaded file data

        try {
            // Ensure that a file has been uploaded
            if (!req.file) {
                return res.status(400).send({ message: 'Photo is required' });
            }

            // Proceed with registration logic
            const userData = req.body;
            const saltRounds = 10;

            // Hash the password before saving to the database
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            // Prepare user data to save, including the file (photo) path
            const userDataToSave = {
                ...userData,
                password: hashedPassword,
                photo: req.file.filename  // Store the filename of the uploaded photo
            };

            // Insert the user data into the database
            const data = await model.insert(userDataToSave);

            if (data) {
                return res.status(201).send({
                    message: 'User registered successfully',
                    data: data
                });
            } else {
                return res.status(400).send({ message: "Registration failed" });
            }
        } catch (error) {
            console.error('Error in register:', error);
            return res.status(500).send({ message: error.message });
        }
    });
};



// New login function added
// exports.register = async (req, res, next) => {
//     console.log('Register function triggered');  // Check if the function is triggered
//     console.log('Request body:', req.body);  // Log the incoming request body for debugging
//     try {
//         const userData = req.body;
//         // Validate user data against the DTO
//         // for (const key in validationDto) {
//         //     if (validationDto[key].required && !userData[key]) {
//         //         console.log(`${key} is required`);  // Log which key is missing
//         //         return res.status(400).send({ message: `${key} is required` });  // 400 Bad Request
//         //     }
//         //     // Check type of each field in userData
//         //     if (typeof userData[key] !== validationDto[key].type) {
//         //         console.log(`${key} must be of type ${validationDto[key].type}, received: ${typeof userData[key]}`);
//         //         return res.status(400).send({ message: `${key} must be of type ${validationDto[key].type}` });
//         //     }
//         // }
//         // Check if 'company' field exists and is a string, if required
//         // if (userData.company && typeof userData.company !== 'string') {
//         //     console.log(`company must be of type string, received: ${typeof userData.company}`);
//         //     return res.status(400).send({ message: 'company must be of type string' });
//         // }
//         // Log the incoming password to check if it's being received correctly
//         console.log("Password received:", userData.password);
//         // Hash the password
//         const saltRounds = 10;
//         const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
//         // Log the hashed password for debugging
//         console.log("Hashed password:", hashedPassword);
//         const sd = { ...userData, password: hashedPassword };
//         console.log("Data saved:", sd);
//         // Insert the user data with the hashed password
//         const data = await model.insert(sd);
//         console.log("Data saved:", data);  // Log the data returned by insert
//         if (data) {
//             res.status(201).send({ message: 'User registered successfully', data: data });
//         } else {
//             res.status(400).send({ message: "Bad Request!" });
//         }
//     } catch (e) {
//         console.log(`Error in register:`, e);  // Log the error for debugging
//         res.status(500).send({ message: e.message });  // 500 Internal Server Error
//     }
// };

exports.login = async (req, res, next) => {
    console.log('Login function triggered');
    console.log('Request body:', req.body);  // Log the incoming request body for debugging

    try {
        const { email_id, password } = req.body;

        // Validate request data
        if (!email_id || !password) {
            return res.status(400).send({ message: 'Email and password are required' });
        }

        // Check if the user exists
        const user = await model.findOneByEmail(email_id);  // Ensure this method exists in your model
        if (!user || !user[0]) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Verify the password
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(401).send({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const payload = {
            userId: user[0].id,
            email: user[0].email_id
        };

        // const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' });  // Set expiration time as needed (e.g., 1 hour)
        const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
            algorithm: 'HS256',
            expiresIn: '1h'
        })
        // Send the response with the JWT
        res.status(200).send({
            message: 'Login successful',
            user: user[0],
            token: token  // Include the token in the response
        });
    } catch (e) {
        console.log(`Error in login:`, e);  // Log the error for debugging
        res.status(500).send({ message: e.message });  // 500 Internal Server Error
    }
};

exports.updatePasswordByEmail = async (req, res) => {
    const { email, password } = req.body;  // Get email and password from the request body

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // The '10' is the salt rounds

        // Prepare the SQL query
        const query = `UPDATE users_reg SET password = ? WHERE email_id = ?`;

        // Execute the query
        const result = await updateRow(query, [hashedPassword, email]);

        // Check if the update was successful
        if (result) {
            return res.status(200).json({ message: 'Password updated successfully' });
        } else {
            return res.status(404).json({ message: 'User not found or password update failed' });
        }
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: 'An error occurred while updating the password' });
    }
};

exports.changePassword = async (req, res, next) => {
    const userId = req.params.user_id;
    const { old_password, new_password, confirm_password } = req.body;

    // Validate request parameters
    if (!old_password || !new_password || !confirm_password) {
        return res.status(400).send({ message: 'All fields are required' });
    }

    if (new_password !== confirm_password) {
        return res.status(400).send({ message: 'New password and confirm password do not match' });
    }

    try {
        const user = await model.findOne(userId);
        if (!user || !user[0]) {
            return res.status(404).send({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(old_password, user[0].password);
        if (!isMatch) {
            return res.status(401).send({ message: 'Old password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        const result = await model.updatePasswordByEmail(user[0].email_id, hashedPassword);
        if (result) {
            return res.status(200).send({ message: 'Password updated successfully' });
        } else {
            return res.status(500).send({ message: 'Failed to update password' });
        }
    } catch (error) {
        console.error('Error in changePassword:', error);
        return res.status(500).send({ message: 'Internal server error' });
    }
};

exports.getUserData = async (req, res, next) => {
    try {
        const userId = req.params.user_id; // Get user_id from request parameters
        const data = await model.findOne(userId); // Fetch user data using the model

        if (!_.isEmpty(data)) {
            res.status(StatusCodes.OK).send(data[0]); // Send the user data
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "User not found" });
        }
    } catch (e) {
        console.log(`Error in getUserData`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.decryptAndUpdateSingleUser = async (req, res) => {
    try {
        const email = req.body.email;
        const originalPassword = req.body.password;
        
        // Find the user by email
        const user = await model.findOneByEmail(email);
        
        if (!user || !user[0]) {
            return res.status(404).send({
                message: "User not found"
            });
        }

        try {
            // Hash the original password for updating
            const hashedPassword = await bcrypt.hash(originalPassword, 10);
            
            // Update the user's password
            const result = await model.updatePasswordByEmail(email, hashedPassword);
            
            if (result) {
                res.status(200).send({
                    message: "Password updated successfully",
                    email: email
                });
            } else {
                res.status(400).send({
                    message: "Failed to update password"
                });
            }
        } catch (error) {
            console.error('Error processing user:', error);
            res.status(500).send({
                message: 'Error processing password',
                error: error.message
            });
        }
    } catch (error) {
        console.error('Error in decryptAndUpdateSingleUser:', error);
        res.status(500).send({
            message: 'An error occurred',
            error: error.message
        });
    }
}

// exports.decryptAndUpdateSingleUser = decryptAndUpdateSingleUser;