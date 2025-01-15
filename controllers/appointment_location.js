const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const model = require("../models/appointment_location");
const adminUserModel = require("../models/admin_users");
const { getPageNo, getPageSize } = require('../utils/helper');

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

exports.getTodayAppointments = async (req, res, next) => {
	try {
		const userId = req.params.user_id;
		const apLocation = req.params.location_id;
		const apDate = req.query.ap_date;

		console.log(`Fetching appointments for userId: ${userId}, apLocation: ${apLocation}, apDate: ${apDate}`);

		if (!apDate) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "Appointment date (ap_date) is required." });
		}

		const data = await model.getAppointmentsByDate(userId, apDate, apLocation);

		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send(data);
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for the specified date." });
		}
	} catch (e) {
		console.log(`Error in getTodayAppointments`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};


exports.getAppointmentLocation = async (req, res, next) => {
	try {
		const { user_id } = req.params; // Extract user_id from the route parameter

		// Call the model method to get admin user data
		const adminUser = await adminUserModel.findOne(user_id);
		// console.log("Inbox Controller",adminUser);
		// console.log("location access",data[0].show_appts_of);

		let locData = [];
		if (adminUser[0].show_appts_of == 'All') {
			locData = [{ id: "", location_name: adminUser[0].show_appts_of }];
		} else {
			const locArr = adminUser[0].show_appts_of.split(",");
			// console.log("locArr",locArr);
			// SELECT * FROM `appointment_location` WHERE status='1' AND id IN (2,4,9,10,11,12,13,16,17,18,19,20,21,14) ORDER BY location_name;
			locData = await model.getFilteredLocations(locArr);
			// console.log("data",locData);
		}

		// console.log("locData",locData);

		if (!_.isEmpty(locData)) {
			res.status(StatusCodes.OK).send(locData);
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for the specified location." });
		}
	} catch (e) {
		console.log(`Error in getAppointmentsByLocation`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};
exports.getActiveLocations = async (req, res, next) => {
	try {
		const data = await model.getActiveLocations();
		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send({
				message: "data retrived successfully",
				code: 200,
				success: true,
				count: data.length,
				data: data
			});
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No active locations found." });
		}
	} catch (e) {
		console.log(`Error in getActiveLocations`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};