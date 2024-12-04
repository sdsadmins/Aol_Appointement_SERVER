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
        const userId = req.body.user_id; // Extract user_id from the request body
        const forAp = req.body.for_ap; // Extract for_ap from the request body

        const data = await model.getLastSecretary(userId, forAp); // Call the model method
        if (data) {
            res.status(StatusCodes.OK).send(data);
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No secretary found." });
        }
    } catch (e) {
        console.log(`Error in getLastSecretary`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};


