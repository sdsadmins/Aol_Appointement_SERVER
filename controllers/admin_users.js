const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const model = require("../models/admin_users");
const { getPageNo, getPageSize } = require('../utils/helper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendMailer } = require('../services/emailService');

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


exports.decryptAndUpdateSingleAdmin = async (req, res) => {
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

exports.adminLogin = async (req, res, next) => {
    console.log('Admin Login function triggered');
    console.log('Request body:', req.body);  // Log the incoming request body for debugging

    try {
        const { email_id, password } = req.body;

        // Validate request data
        if (!email_id || !password) {
            return res.status(400).send({ message: 'Email and password are required' });
        }

        // Check if the admin user exists
        const user = await model.findOneByEmail(email_id);  // Ensure this method exists in your model
        if (!user || !user[0]) {
            return res.status(404).send({ message: 'Admin user not found' });
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

        const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
            algorithm: 'HS256',
            expiresIn: '24h'
        });

        // Send the response with the JWT
        res.status(200).send({
            message: 'Login successful',
            user: user[0],
            token: token  // Include the token in the response
        });
    } catch (e) {
        console.log(`Error in admin login:`, e);  // Log the error for debugging
        res.status(500).send({ message: e.message });  // 500 Internal Server Error
    }
};

exports.adminUserChangePassword = async (req, res, next) => {
    const userId = req.params.user_id; // Get user ID from request parameters
    const { old_password, new_password, confirm_password } = req.body; // Get passwords from request body

    // Validate request parameters
    if (!old_password || !new_password || !confirm_password) {
        return res.status(400).send({ message: 'All fields are required' });
    }

    if (new_password !== confirm_password) {
        return res.status(400).send({ message: 'New password and confirm password do not match' });
    }

    try {
        const user = await model.findOneAdminUser(userId); // Fetch user from admin_users table
        if (!user || !user[0]) {
            return res.status(404).send({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(old_password, user[0].password); // Compare old password
        if (!isMatch) {
            return res.status(401).send({ message: 'Old password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10); // Hash the new password
        const result = await model.updateAdminUserPassword(user[0].email_id, hashedPassword); // Update password in admin_users table
        if (result) {
            return res.status(200).send({ message: 'Password updated successfully' });
        } else {
            return res.status(500).send({ message: 'Failed to update password' });
        }
    } catch (error) {
        console.error('Error in adminUserChangePassword:', error);
        return res.status(500).send({ message: 'Internal server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email_id } = req.body;
    const lowerEmail = email_id.toLowerCase();

    try {
        const user = await model.findOneByEmail(lowerEmail);

        if (!user || !user[0]) {
            return res.status(404).json({
                error: 'This email id is not registered with us. please create a account.'
            });
        }

        const tempPassword = Math.random().toString(36).slice(-8);

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const updated = await model.updatePasswordByEmail(email_id, hashedPassword);

        if (!updated) {
            return res.status(500).send({
                message: "Failed to update password"
            });
        }
        const emailContent = `
        <p>Dear ${user[0].full_name},</p>
        <p>This is your new password: <b>${tempPassword}</b></p>
        <p>You can change this password after logging in</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards, <br>Your Application Team</br></p>
        `;

        await sendMailer(
            lowerEmail,
            'Password Recovery',
            emailContent
        )

        return res.status(StatusCodes.OK).json({
            message: 'Please check your email for your password.'
        });

    } catch (err) {
        console.error('Error in forgot password process:', err);
        return res.status(500).json({
            error: 'An error occourred while processing your request.'
        });
    }
};