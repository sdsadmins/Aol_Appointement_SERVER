const _ = require('lodash');
const {StatusCodes} = require('http-status-codes');
const model = require("../models/admin_users");
const {getPageNo, getPageSize} = require('../utils/helper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
			res.status(StatusCodes.NOT_FOUND).send({message : "No record found"});
		}
	} catch (e) {
		console.log(`Error in getAll`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message : e.message});
	}
};

exports.getOne = async (req, res, next) => {
	try {
		const id = req.params.id;

		const data = await model.findOne(id);
		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send(data[0]);
		} else {
			res.status(StatusCodes.NOT_FOUND).send({message : "No record found"});
		}
	} catch (e) {
		console.log(`Error in getById`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message : e.message});
	}
};

exports.create = async (req, res, next) => {
	try {
		const data = await model.insert(req.body);
		if (data) {
			res.status(StatusCodes.CREATED).send({message:'Record created', data:data});
		} else {
			res.status(StatusCodes.BAD_REQUEST).send({message : "Bad Request!"});
		}
	} catch (e) {
		console.log(`Error in create`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message : e.message});
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
			res.status(StatusCodes.BAD_REQUEST).send({message : "Bad request."});
		}
	} catch (e) {
		console.log(`Error in update`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message : e.message});
	}
};

exports.remove = async (req, res, next) => {
	try {
		const id = req.params.id;

		//const id = req.params.id;
		const data = await model.remove(id);
		if (data) {
			res.status(StatusCodes.OK).send({message : "Resource deleted"});
		} else {
			res.status(StatusCodes.BAD_REQUEST).send({message : "Bad request."});
		}
	} catch (e) {
		console.log(`Error in remove`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message : e.message});
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
			res.status(StatusCodes.NOT_FOUND).send({message : "No record found"});
		}
	} catch (e) {
		console.log(`Error in search`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message : e.message});
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
            expiresIn: '1h'
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

