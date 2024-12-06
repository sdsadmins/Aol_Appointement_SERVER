const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const model = require("../models/appointment_request");
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

exports.submitGuestAppointment = async (req, res, next) => {
	try {
		const userId = req.params.user_id; // Extract user_id from the route parameter
		const appointmentData = {
			user_id: userId,
			ap_location: req.body.ap_location,
			full_name: req.body.full_name,
			email_id: req.body.email_id,
			country_code: req.body.country_code,
			mobile_no: req.body.mobile_no,
			designation: req.body.designation,
			// company: req.body.company,
			country: req.body.country,
			state: req.body.state,
			city: req.body.city,
			meet_purpose: req.body.meet_purpose,
			no_people: req.body.no_people,
			from_date: req.body.from_other_date,
			to_date: req.body.to_other_date,
			picture: req.body.picture,
			attachment: req.body.attachment,
			toa: req.body.toa || 'offline', // Default to 'offline' if not provided
			curr_loc: req.body.curr_loc || '', // Pass blank value if not provided
			currently_doing: req.body.currently_doing,
			dop: req.body.dop,
			selCountry: req.body.selCountry || '', // Pass blank value if not provided
			selState: req.body.selState || '', // Pass blank value if not provided
			selCity: req.body.selCity || '', // Pass blank value if not provided
			no_people_names: req.body.no_people_name,
			no_people_numbers: req.body.no_people_number,
			no_people_eleven_details: req.body.no_people_eleven_details,
			ref_email_id: req.body.ref_email_id_other,
			ref_country_code: req.body.ref_ccode_other,
			ref_mobile_no: req.body.ref_mobile_no_other,
		};

		const data = await model.insert(appointmentData); // Call the model's insert method
		if (data) {
			res.status(StatusCodes.CREATED).send({ message: 'Guest appointment created', data: data });
		} else {
			res.status(StatusCodes.BAD_REQUEST).send({ message: "Bad Request!" });
		}
	} catch (e) {
		console.log(`Error in submitGuestAppointment`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getUserHistory = async (req, res, next) => {
	try {
		const userId = req.params.user_id;
		const emailId = req.params.email_id;

		const data = await model.getUserHistory(userId, emailId); // Call the model method
		const totalCount = data.length;
		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send({
				message: "User history retrieved successfully", // Success message
				totalCount, // Include total count in the response
				data
			});
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointment history found for this user." });
		}
	} catch (e) {
		console.log(`Error in getUserHistory`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getAppointmentsByDate = async (req, res, next) => {
	try {
		const userId = req.params.user_id;
		const dateString = req.params.datestring;

		// Assuming you have a method in your model to get appointments by date
		const data = await model.getAppointmentsByDate(userId, dateString);

		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send(data);
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for this date." });
		}
	} catch (e) {
		console.log(`Error in getAppointmentsByDate`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getAppointmentDetails = async (req, res, next) => {
	try {
		const apId = req.params.ap_id; // Extract ap_id from the route parameter

		// Update the query to search by ap_id instead of id
		const data = await model.findOneByApId(apId); // Call the model method to get appointment details by ap_id
		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send({ message: "Appointment details retrieved successfully", data: data[0] }); // Send the appointment details with a success message
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointment found with this ap_id." });
		}
	} catch (e) {
		console.log(`Error in getAppointmentDetails`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.changeCheckInStatus = async (req, res, next) => {
	try {
		const { appid, status } = req.body; // Extract appid and status from the request body

		// Ensure appid and status are provided
		if (!appid || !status) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID and status are required" });
		}

		const data = await model.updateCheckInStatus(appid, status); // Call the model method
		if (data) {
			res.status(StatusCodes.OK).send({ message: "Check-in status updated successfully" });
		} else {
			res.status(StatusCodes.BAD_REQUEST).send({ message: "Failed to update check-in status" });
		}
	} catch (e) {
		console.log(`Error in changeCheckInStatus`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.updateAppointment = async (req, res, next) => {
	try {
		const { appid, secretary_note, gurudev_remark, app_frm } = req.body; // Extract parameters from the request body

		// Ensure appid is provided
		if (!appid) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID is required" });
		}

		// Ensure app_frm is provided
		if (!app_frm) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "Form identifier is required" });
		}

		const data = await model.updateCheckInStatus(appid, { secretary_note, gurudev_remark }); // Call the model method
		if (data) {
			res.status(StatusCodes.OK).send({ message: "Appointment updated successfully" });
		} else {
			res.status(StatusCodes.BAD_REQUEST).send({ message: "Failed to update appointment" });
		}
	} catch (e) {
		console.log(`Error in updateAppointment`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.moreInfoAppointment = async (req, res, next) => {
	try {
		const { appid, radioreason } = req.body;
		const userId = req.params.user_id;

		if (!appid) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "Please pass a valid appointment ID!" });
		}

		// First, get the appointment record to get its ID
		const appointment = await model.findOneByApId(appid);
		
		if (!appointment || appointment.length === 0) {
			return res.status(StatusCodes.NOT_FOUND).send({ message: "Appointment not found!" });
		}

		const data = {
			more_info: '1',
			ap_status: 'more info',
			radioreason: radioreason
		};

		// Use the actual ID from the found appointment for the update
		const result = await model.update(appointment[0].id, data);
		
		if (result && !_.isEmpty(result)) {
			res.status(StatusCodes.OK).send({ message: 'Request for more info has been made successfully!' });
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Failed to update appointment status!' });
		}
	} catch (e) {
		console.log(`Error in moreInfoAppointment`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.makeAppointmentDone = async (req, res, next) => {
	try {
		const { appid } = req.body; // Extract appid from the request body

		// Ensure appid is provided
		if (!appid) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID is required" });
		}

		// Assuming you have a method in your model to update the appointment status
		const data = await model.updateAppointmentStatus(appid, 'done'); // Update the status to 'done'
		
		if (data) {
			res.status(StatusCodes.OK).send({ message: "Appointment marked as done successfully" });
		} else {
			res.status(StatusCodes.BAD_REQUEST).send({ message: "Failed to mark appointment as done" });
		}
	} catch (e) {
		console.log(`Error in makeAppointmentDone`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.makeAppointmentUndone = async (req, res, next) => {
	try {
		const { appid, last_status } = req.body; // Extract appid and last_status from the request body

		// Ensure appid and last_status are provided
		if (!appid || !last_status) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID and last status are required" });
		}

		// Assuming you have a method in your model to update the appointment status
		const data = await model.updateAppointmentStatus(appid, last_status); // Revert the status to last_status
		
		if (data) {
			res.status(StatusCodes.OK).send({ message: "Appointment status reverted successfully" });
		} else {
			res.status(StatusCodes.BAD_REQUEST).send({ message: "Failed to revert appointment status" });
		}
	} catch (e) {
		console.log(`Error in makeAppointmentUndone`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getTodayAppointments = async (req, res, next) => {
	try {
		const today = new Date();
		const dateString = today.toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format

		const data = await model.getAppointmentsByDate(null, dateString); // Fetch data

		console.log('Data received from model:', data); // Log the data

		if (data && data.length > 0) {
			const classifiedAppointments = data.map(appointment => {
				const date = new Date(appointment.ap_time * 1000); // Convert Unix timestamp to Date
				const hours = date.getUTCHours().toString().padStart(2, '0');
				const minutes = date.getUTCMinutes().toString().padStart(2, '0');
				const seconds = date.getUTCSeconds().toString().padStart(2, '0');
				const timeString = `${hours}:${minutes}:${seconds}`; // Format as hh:mm:ss

				let timePeriod;
				if (date.getUTCHours() < 16) {
					timePeriod = 'Morning';
				} else if (date.getUTCHours() >= 16 && date.getUTCHours() < 19) {
					timePeriod = 'Evening';
				} else {
					timePeriod = 'Night';
				}

				return {
					...appointment,
					timePeriod, // Add the classification
					formattedTime: timeString // Add the formatted time
				};
			});

			res.status(StatusCodes.OK).send(classifiedAppointments);
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for today." });
		}
	} catch (e) {
		console.log(`Error in getTodayAppointments`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getTomorrowsAppointments = async (req, res, next) => {
	try {
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1); // Increment the date by 1 to get tomorrow's date
		const dateString = tomorrow.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

		const data = await model.getAppointmentsByDate(null, dateString); // Fetch data for tomorrow

		console.log('Data received from model:', data); // Log the data

		if (data && data.length > 0) {
			res.status(StatusCodes.OK).send(data);
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for tomorrow." });
		}
	} catch (e) {
		console.log(`Error in getTomorrowsAppointments`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.restoreAppointment = async (req, res, next) => {
	try {
		const appid = req.params.ap_id; // Extract appid from the route parameter

		const data = await model.restore(appid); // Call the model method to restore the appointment
		if (data) {
			res.status(StatusCodes.OK).send({ message: "Appointment restored successfully", data: data });
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "Appointment not found or already restored." });
		}
	} catch (e) {
		console.log(`Error in restoreAppointment`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.deleteAppointment = async (req, res, next) => {
	try {
		const { appid } = req.body; // Extract appid from the request body
		const { sendEmail, radioreason, page } = req.body; // Extract additional parameters from the request body

		// Ensure appid is provided
		if (!appid) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID is required" });
		}

		// Change the status to 1 instead of deleting the appointment
		const data = await model.updateAppointmentStatus(appid, '1'); // Update status to 1
		const updateDeletedApp = await model.updateDeletedApp(appid, '1'); // Set deleted_app to '1'
		// Ensure the update was successful
		if (updateDeletedApp) {
			res.status(StatusCodes.OK).send({ message: "Appointment status updated to 1 successfully", sendEmail, radioreason, page }); // Include additional parameters in the response
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "Appointment not found" });
		}
	} catch (e) {
		console.log(`Error in deleteAppointment`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getUpcomingAppointments = async (req, res, next) => {
	try {
		const userId = req.params.user_id; // Extract user_id from the route parameter
		const today = new Date();
		const dayAfterTomorrow = new Date(today);
		dayAfterTomorrow.setDate(today.getDate() + 2); // Increment the date by 2 to get the day after tomorrow
		const dateString = dayAfterTomorrow.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

		const data = await model.getAppointmentsFromDate(userId, dateString); // Fetch data starting from the day after tomorrow

		console.log('Data received from model:', data); // Log the data

		if (data && data.length > 0) {
			res.status(StatusCodes.OK).send(data);
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No upcoming appointments found." });
		}
	} catch (e) {
		console.log(`Error in getUpcomingAppointments`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};




