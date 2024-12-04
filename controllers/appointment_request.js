const _ = require('lodash');
const {StatusCodes} = require('http-status-codes');
const model = require("../models/appointment_request");
const {getPageNo, getPageSize} = require('../utils/helper');

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

exports.getUserAppointments = async (req, res, next) => {
    try {
        const userId = req.params.user_id;  // Extract user_id from the route parameter
        const offset = 0; // Set your offset for pagination
        const pageSize = 50; // Set your page size for pagination

        const data = await model.find(userId, offset, pageSize);  // Pass userId to the find function

        if (!_.isEmpty(data)) {
            res.status(StatusCodes.OK).send(data);
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for this user." });
        }
    } catch (e) {
        console.log(`Error in getUserAppointments`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.getLastSecretary = async (req, res, next) => {
    try {
        const { user_id, for_ap } = req.body; // Extract only user_id and for_ap from the request body

        const data = await model.getLastSecretary(user_id, for_ap); // Call the model method
        if (data) {
            res.status(StatusCodes.OK).send({ assign_to_fill: data.assign_to_fill });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ assign_to_fill: "None" });
        }
    } catch (e) {
        console.log(`Error in getLastSecretary`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.submitSelfAppointment = async (req, res, next) => {
    try {
        const userId = req.params.user_id; // Extract user_id from the route parameter
        const appointmentData = {
            user_id: userId,
            full_name: req.body.user_full_name,
            email_id: req.body.user_email,
            mobile_no: req.body.user_phone,
            ap_location: req.body.ap_location,
            designation: req.body.designation,
            meet_subject: req.body.meet_subject || '', // Pass blank value if not provided
            meet_purpose: req.body.meet_purpose,
            no_people: req.body.no_people,
            from_date: req.body.from_date,
            to_date: req.body.to_date,
            attachment: req.body.attachment,
            currently_doing: req.body.currently_doing,
            dop: req.body.dop,
            toa: req.body.toa || 'offline', // Default to 'offline' if not provided
            curr_loc: req.body.curr_loc || '', // Pass blank value if not provided
            selCountry: req.body.selCountry || '', // Pass blank value if not provided
            selState: req.body.selState || '', // Pass blank value if not provided
            selCity: req.body.selCity || '', // Pass blank value if not provided
            // Add any other fields as necessary
        };

        const data = await model.insert(appointmentData); // Call the model's insert method
        if (data) {
            res.status(StatusCodes.CREATED).send({ message: 'Appointment created', data: data });
        } else {
            res.status(StatusCodes.BAD_REQUEST).send({ message: "Bad Request!" });
        }
    } catch (e) {
        console.log(`Error in submitSelfAppointment`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};


