const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');

const model = require("../models/appointment_request");
const adminUserModel = require("../models/admin_users");
const emailModel = require("../models/email_template");
const emailFooterModel = require("../models/email_footer");
const smsModel = require("../models/sms_templates");
const locModel = require("../models/offiline_locations");
const userModel = require("../models/users_reg");

const { getPageNo, getPageSize } = require('../utils/helper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/emailService');
const { country_code, from_date, to_date } = require('../dto/appointment_request.dto');


// Add multer storage configuration at the top of the file
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadDir = path.join(__dirname, '../uploads/appointments');
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const fileName = `${Date.now()}-${file.originalname}`;
		cb(null, fileName);
	}
});

// Configure multer with file filtering
const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
		const ext = path.extname(file.originalname).toLowerCase();
		if (!allowedTypes.includes(ext)) {
			cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'));
		} else {
			cb(null, true);
		}
	},
	limits: {
		fileSize: 5 * 1024 * 1024 // 5MB limit
	}
}).fields([{ name: 'attachment', maxCount: 1 }, { name: 'picture', maxCount: 1 }]);

// Add multer storage configuration at the top of the file
const uploadAdmin = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx']; // Add allowed file types
		const extension = path.extname(file.originalname);
		if (!allowedExtensions.includes(extension)) {
			cb(new Error("Only JPG, JPEG, PNG, PDF, DOC, and DOCX files are allowed"));
		} else {
			cb(null, true);
		}
	},
	limits: {
		fileSize: 5 * 1024 * 1024 // 5 MB limit for file size
	}
}).single("photo"); // Ensure this matches the field name in your form data

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
	upload(req, res, async (err) => {
		if (err) {
			console.log("Error during file upload:", err);
			return res.status(StatusCodes.BAD_REQUEST).send({
				message: err.message
			});
		}

		try {
			const userId = req.params.user_id;
			const appointmentData = {
				ap_id: Math.floor(100000 + Math.random() * 900000), // Generate a random 6-digit number
				user_id: userId,
				full_name: req.body.user_full_name,
				email_id: req.body.user_email,
				mobile_no: req.body.user_phone,
				ap_location: req.body.ap_location,
				designation: req.body.designation,
				meet_subject: req.body.meet_subject || '',
				meet_purpose: req.body.meet_purpose,
				no_people: req.body.no_people,
				no_people_names: req.body.no_people_names,
				no_people_numbers: req.body.no_people_numbers,
				from_date: req.body.from_date,
				to_date: req.body.to_date,
				attachment: req.file ? req.file.filename : '', // Store the filename
				// attachment_url: req.file ? `http://localhost:${process.env.PORT}/uploads/appointments/${req.file.filename}` : '', // Construct the URL
				currently_doing: req.body.currently_doing,
				dop: req.body.dop,
				toa: req.body.toa || 'offline',
				curr_loc: req.body.curr_loc || '',
				selCountry: req.body.selCountry || '',
				selState: req.body.selState || '',
				selCity: req.body.selCity || '',
				for_ap: "me",
				ap_status: "pending"
			};

			const data = await model.insert(appointmentData);
			if (data) {
				res.status(StatusCodes.CREATED).send({
					message: 'Appointment created',
					data: data
				});
			} else {
				res.status(StatusCodes.BAD_REQUEST).send({
					message: "Bad Request!"
				});
			}
		} catch (e) {
			console.log(`Error in submitSelfAppointment`, e);
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
				message: e.message
			});
		}
	});
};

exports.submitGuestAppointment = async (req, res, next) => {
	// Ensure upload logic is working correctly
	upload(req, res, async (err) => {
		if (err) {
			console.log("Error during file upload:", err);
			return res.status(StatusCodes.BAD_REQUEST).send({
				message: err.message
			});
		}

		try {
			const userId = req.params.user_id;

			// Ensure files are captured correctly
			const attachments = req.files['attachment'] ? req.files['attachment'].map(file => file.filename) : [];
			const pictures = req.files['picture'] ? req.files['picture'].map(file => file.filename) : [];

			const appointmentData = {
				ap_id: Math.floor(100000 + Math.random() * 900000), // Generate a random 6-digit number
				user_id: userId,
				ap_location: req.body.ap_location,
				full_name: req.body.full_name,
				email_id: req.body.email_id,
				country_code: req.body.country_code,
				mobile_no: req.body.mobile_no,
				designation: req.body.designation,
				country: req.body.country,
				state: req.body.state,
				city: req.body.city,
				meet_purpose: req.body.meet_purpose,
				no_people: req.body.no_people,
				from_date: req.body.from_other_date,
				to_date: req.body.to_other_date,
				picture: pictures.length > 0 ? pictures[0] : '', // Ensure only one file for 'picture'
				attachment: attachments.length > 0 ? attachments[0] : '', // Ensure only one file for 'attachment'
				toa: req.body.toa || 'offline',
				curr_loc: req.body.curr_loc || '',
				currently_doing: req.body.currently_doing,
				dop: req.body.dop,
				selCountry: req.body.selCountry || '',
				selState: req.body.selState || '',
				selCity: req.body.selCity || '',
				no_people_names: req.body.no_people_names,
				no_people_numbers: req.body.no_people_numbers,
				no_people_eleven_details: req.body.no_people_eleven_details,
				ref_email_id: req.body.ref_email_id,
				ref_country_code: req.body.ref_country_code,
				ref_mobile_no: req.body.ref_mobile_no,
				for_ap: "other",
				ap_status: "pending"
			};

			const data = await model.insert(appointmentData);
			if (data) {
				res.status(StatusCodes.CREATED).send({
					message: 'Guest appointment created',
					data: data
				});
			} else {
				res.status(StatusCodes.BAD_REQUEST).send({
					message: "Bad Request!"
				});
			}
		} catch (e) {
			console.log(`Error in submitGuestAppointment`, e);
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
				message: e.message
			});
		}
	});
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

exports.getSingleAppointmentDetails = async (req, res, next) => {
	try {
		const { id } = req.params; // Extract id from the route parameter

		// Call the model method to get appointment details by ID
		const data = await model.findOne(id);

		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send(data[0]); // Send the first result
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointment found with this ID." });
		}
	} catch (e) {
		console.log(`Error in getSingleAppointmentDetails`, e);
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

		const allowedStatuses = ['Scheduled', 'TB R/S', 'Done', 'SB', 'GK'];
		const data = await model.getAppointmentsByDate(null, dateString, allowedStatuses); // Pass allowed statuses to the model method

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

		console.log('Fetching appointments for date:', dateString); // Log the date being fetched

		const location = req.params.location; // Extract location from URL parameters
		const userId = req.params.user_id; // Extract user ID from URL parameters

		console.log('Fetching appointments for date:', dateString, 'for user:', userId, 'at location:', location); // Debugging line

		const allowedStatuses = ['Scheduled', 'TB R/S', 'Done', 'SB', 'GK']; // Define allowed statuses
		const data = await model.getAppointmentsByDate(userId, dateString, allowedStatuses); // Pass user ID, date, and allowed statuses to the model

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

// exports.getUpcomingAppointments = async (req, res, next) => {
// 	try {
// 		const userId = req.params.user_id; // Ensure user_id is extracted from the request parameters
// 		const today = new Date();
// 		const dayAfterTomorrow = new Date(today);
// 		dayAfterTomorrow.setDate(today.getDate() + 2); // Increment the date by 2 to get the day after tomorrow
// 		const dateString = dayAfterTomorrow.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

// 		console.log('Fetching appointments for date:', dateString); // Log the date being fetched

// 		const data = await model.getAppointmentsFromDate(userId, dateString); // Pass userId to the model method

// 		console.log('Data received from model:', data); // Log the data received

// 		if (data && data.length > 0) {
// 			res.status(StatusCodes.OK).send(data);
// 		} else {
// 			res.status(StatusCodes.NOT_FOUND).send({ message: "No upcoming appointments found." });
// 		}
// 	} catch (e) {
// 		console.log(`Error in getUpcomingAppointments`, e);
// 		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
// 	}
// };

exports.getUpcomingAppointmentsByDate = async (req, res, next) => {
	try {
		const dateString = req.params.date; // Extract date from the route parameter

		// Validate date format
		const inputDate = new Date(dateString);
		if (isNaN(inputDate.getTime())) {
			return res.status(StatusCodes.BAD_REQUEST).send({
				message: "Invalid date format. Please use YYYY-MM-DD format."
			});
		}

		// Get today's date for comparison
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Reset time to start of day

		// Check if the input date is in the past
		// if (inputDate < today) {
		// 	return res.status(StatusCodes.BAD_REQUEST).send({ 
		// 		message: "Date must be today or in the future." 
		// 	});
		// }

		const data = await model.getUpcomingAppointmentsByDate(dateString);

		if (data && data.length > 0) {
			res.status(StatusCodes.OK).send({
				message: "Upcoming appointment dates retrieved successfully",
				totalCount: data.length,
				dates: data.map(item => item.appointment_date)
			});
		} else {
			res.status(StatusCodes.NOT_FOUND).send({
				message: "No upcoming appointment dates found.",
				totalCount: 0,
				data: []
			});
		}
	} catch (e) {
		console.error(`Error in getUpcomingAppointmentsByDate`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			message: e.message
		});
	}
};

exports.getRightNavCount = async (req, res, next) => {
	try {
		const userId = req.params.user_id; // Extract user ID from the route parameter
		const apDate = req.body.ap_date; // Extract appointment date from the request body

		// Call the model method to get the count of appointments for the given date and user
		const count = await model.getAppointmentCountByDate(userId, apDate);

		res.status(StatusCodes.OK).send({ count });
	} catch (e) {
		console.log(`Error in getRightNavCount`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getAppointmentsByLocation = async (req, res, next) => {
	try {
		const { location_id } = req.params; // Extract location_id from the route parameter

		// Call the model method to get appointments by location
		const data = await model.getAppointmentsByLocation(location_id);

		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send(data);
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for the specified location." });
		}
	} catch (e) {
		console.log(`Error in getAppointmentsByLocation`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getAppointmentById = async (req, res, next) => {
	try {
		const { id } = req.params; // Extract id from the route parameter

		// Call the model method to get appointment details by ID
		const data = await model.findOne(id);

		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send(data[0]); // Send the first result
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointment found with this ID." });
		}
	} catch (e) {
		console.log(`Error in getAppointmentById`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.sendMoreInfoEmail = async (req, res, next) => {
	try {
		const { appid, radioreason, email, fullName } = req.body;

		if (!appid || !email || !fullName) {
			return res.status(StatusCodes.BAD_REQUEST).send({
				message: "Please provide appointment ID, email and full name!"
			});
		}

		// Prepare email content based on the selected reason only
		let emailSubject = 'Additional Information Required for Your Appointment Request';
		let emailBody;

		// Set email body based on the selected radio reason
		switch (radioreason) {
			case '1':
				emailBody = `
					Dear ${fullName},
					
					We hope this email finds you well. Regarding your appointment request (ID: ${appointmentDetails.ap_id}), 
					we need some additional information about your designation and contact details.
					
					Please provide:
					- Complete designation details
					- Updated contact information
					
					You can update this information by logging into your account and editing your appointment request.
					
					Best regards,
					Office of Gurudev Sri Sri Ravi Shankar
				`;
				break;

			case '2':
				emailBody = `
					Dear ${fullName},
					
					We hope this email finds you well. Regarding your appointment request (ID: ${appid}), 
					we need more clarity about the purpose of your appointment.
					
					Please provide:
					- Detailed purpose of the meeting
					- Expected outcomes
					- Any specific topics you would like to discuss
					
					You can update this information by logging into your account and editing your appointment request.
					
					Best regards,
					Office of Gurudev Sri Sri Ravi Shankar
				`;
				break;

			default:
				return res.status(StatusCodes.BAD_REQUEST).send({
					message: "Invalid reason selected"
				});
		}

		// Send email with the selected message
		await emailService.sendMailer(
			email,  // Using email from request body
			emailSubject,
			emailBody
		);

		res.status(StatusCodes.OK).send({
			message: 'More information request email sent successfully!'
		});

	} catch (e) {
		console.log(`Error in sendMoreInfoEmail`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getStarredAppointmentDetails = async (req, res, next) => {
	try {
		console.log('hhhhhhhhhhhhhhhhh');

		const data = await model.getStarredAppointments();
		console.log('Data received in controller:', data);
		console.log('Data type:', typeof data);
		console.log('Is array?', Array.isArray(data));
		console.log('Data length:', data ? data.length : 0);

		// Try both checks
		const isEmptyLodash = _.isEmpty(data);
		const isEmptyLength = !data || data.length === 0;

		console.log('isEmpty (lodash):', isEmptyLodash);
		console.log('isEmpty (length check):', isEmptyLength);

		if (data && data.length > 0) {
			console.log('Sending success response');
			res.status(StatusCodes.OK).send({
				message: "Starred appointments retrieved successfully",
				totalCount: data.length,
				data
			});
		} else {
			console.log('Sending not found response');
			res.status(StatusCodes.NOT_FOUND).send({
				message: "No starred appointments found",
				debug: {
					dataReceived: data,
					dataType: typeof data,
					isArray: Array.isArray(data),
					dataLength: data ? data.length : 0,
					isEmptyLodash,
					isEmptyLength
				}
			});
		}
	} catch (e) {
		console.error('Error in getStarredAppointments controller:', e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			message: e.message,
			stack: e.stack
		});
	}
};

exports.filterAppointmentsByAssignedStatus = async (req, res, next) => {
	try {
		// Extract parameters from request body
		const { assignToFill = 'all' } = req.body;
		const pageNo = req.body.pageNo ? parseInt(req.body.pageNo) : 1;
		const pageSize = req.body.pageSize ? parseInt(req.body.pageSize) : 10;
		const offset = (pageNo - 1) * pageSize;

		console.log('Filtering Appointments Request:', {
			assignToFill,
			pageNo,
			pageSize,
			offset
		});

		// Validate assignToFill parameter
		const validAssignToFillValues = ['all', 'assigned', 'unassigned'];

		// If a specific value is passed that is not in the predefined list
		if (!validAssignToFillValues.includes(assignToFill)) {
			// Additional validation for specific values
			if (!assignToFill) {
				return res.status(StatusCodes.BAD_REQUEST).send({
					message: "assignToFill value cannot be empty"
				});
			}
		}

		// Call model method
		const result = await model.filterAppointmentsByAssignedStatus(assignToFill, offset, pageSize);

		// More detailed response handling
		if (result.data && result.data.length > 0) {
			res.status(StatusCodes.OK).send({
				pageNo: pageNo,
				pageSize: pageSize,
				totalCount: result.totalCount,
				totalPages: result.totalPages,
				currentPage: result.currentPage,
				data: result.data
			});
		} else {
			console.warn('No appointments found for filter:', assignToFill);
			res.status(StatusCodes.NOT_FOUND).send({
				message: `No appointments found for assignToFill: ${assignToFill}`,
				totalCount: 0,
				totalPages: 0,
				currentPage: 1,
				data: []
			});
		}
	} catch (e) {
		console.error(`Detailed Error in filterAppointmentsByAssignedStatus`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			message: e.message,
			stack: e.stack
		});
	}
};

exports.addNewAppointmentAdmin = async (req, res, next) => {
	uploadAdmin(req, res, async (err) => { // Use multer middleware
		if (err) {
			console.log("Error during file upload:", err);
			return res.status(400).send({
				message: err.message
			});
		}

		try {
			// Generate a random 6-digit appointment ID
			const appointmentId = Math.floor(100000 + Math.random() * 900000);

			// Convert 12-hour time format to 24-hour
			const timeComponents = req.body.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
			let hours = parseInt(timeComponents[1]);
			const minutes = timeComponents[2];
			const period = timeComponents[3].toUpperCase();

			if (period === 'PM' && hours < 12) hours += 12;
			if (period === 'AM' && hours === 12) hours = 0;

			const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;

			// Prepare appointment data
			const appointmentData = {
				ap_id: appointmentId,
				full_name: req.body.name,
				designation: req.body.designation,
				// ref_name: req.body.referenceName,
				no_people: req.body.noOfPeople,
				mobile_no: req.body.mobileNo,
				email_id: req.body.email,
				// ref_mobile_no: req.body.refPhone,
				// ref_email_id: req.body.refEmail,
				venue: req.body.venue,
				meet_purpose: req.body.purpose,
				secretary_note: req.body.remarks || '',
				ap_date: req.body.date,
				ap_time: formattedTime,
				// from_date: req.body.from_date,
				// to_date: req.body.to_date,
				picture: req.body.photo || '',
				ap_status: 'pending',
				email_status: req.body.dontSendEmailSms ? '0' : '1',
				entry_date: new Date().toISOString().split('T')[0],
				entry_date_time: new Date().toISOString(),
				

				deleted_app: '0',
				more_info: '0',
				star_rate: '0',
				check_in_status: 'pending',
				darshan_line: '0',

				backstage_status: '0',
				position_order: '0',
				darshan_line_email: '0',
				for_ap: 'other',
				country_code: req.body.country_code,
				state: 0,
				meet_subject: req.body.purpose,
				mtype: req.body.tbsReq ? 'TBS' : 'Regular',
				attachment: req.file ? req.file.filename : '', // Store the filename
			};

			// Insert appointment into database
			const data = await model.insert(appointmentData);

			if (data) {
				// Send email notification if enabled
				if (!req.body.dontSendEmailSms) {
					try {
						await emailService.sendMailer(
							appointmentData.email_id,
							'Appointment Request Confirmation',
							`Dear ${appointmentData.full_name},\n\nYour appointment request has been received.\nAppointment ID: ${appointmentData.ap_id}\nDate: ${appointmentData.ap_date}\nTime: ${req.body.time}\n\nBest regards,\nAppointment Team`
						);
					} catch (emailError) {
						console.log('Error sending email:', emailError);
						// Continue even if email fails
					}
				}

				res.status(StatusCodes.CREATED).send({
					message: 'Appointment created successfully',
					data: data
				});
			} else {
				res.status(StatusCodes.BAD_REQUEST).send({
					message: "Failed to create appointment"
				});
			}
		} catch (e) {
			console.log(`Error in addNewAppointmentAdmin`, e);
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
				message: e.message
			});
		}
	});
};

exports.markAppointmentAsDeleted = async (req, res, next) => {
	try {
		const { appid } = req.body; // Extract appid from the request body

		// Ensure appid is provided
		if (!appid) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID is required" });
		}

		// Call the model method to mark the appointment as deleted
		const data = await model.markAppointmentAsDeleted(appid);

		if (data) {
			res.status(StatusCodes.OK).send({
				message: "Appointment marked as deleted successfully",
				data: data[0] // Send the updated appointment details
			});
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "Appointment not found" });
		}
	} catch (e) {
		console.log(`Error in markAppointmentAsDeleted`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.changeAppointmentStatus = async (req, res, next) => {
	try {
		const ap_id = req.params.ap_id;
		const { status } = req.body;

		if (!ap_id) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID is required" });
		}

		const currentAppointment = await model.findOneByApId(ap_id);
		if (!currentAppointment || currentAppointment.length === 0) {
			return res.status(StatusCodes.NOT_FOUND).send({ message: "Appointment not found" });
		}

		const currentStatus = currentAppointment[0].ap_status;

		const newStatus = currentStatus === "Scheduled" ? "Done" : "Scheduled";

		const data = await model.updateAppointmentStatus(ap_id, newStatus);
		if (data) {
			res.status(StatusCodes.OK).send({ message: `Appointment status updated to ${newStatus}`, data });
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "Failed to update appointment status" });
		}
	} catch (e) {
		console.log(`Error in changeAppointmentStatus`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getDoneAppointments = async (req, res, next) => {
	try {
		const pageNo = parseInt(req.body.pageNo) || 1;
		const pageSize = parseInt(req.body.pageSize) || 10;
		const offset = (pageNo - 1) * pageSize;

		const { totalCount, data } = await model.getDoneAppointments(offset, pageSize);
		res.status(StatusCodes.OK).send({
			pageNo,
			pageSize,
			totalCount,
			data
		});
	} catch (e) {
		console.log(`Error in getDoneAppointments`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.getDeletedAppointments = async (req, res, next) => {
	try {
		const pageNo = parseInt(req.body.pageNo) || 1;
		const pageSize = parseInt(req.body.pageSize) || 10;
		const offset = (pageNo - 1) * pageSize;

		const data = await model.getDeletedAppointments(offset, pageSize);
		const totalCount = await model.countDeletedAppointments();

		if (!_.isEmpty(data)) {
			res.status(StatusCodes.OK).send({
				pageNo,
				pageSize,
				totalCount,
				data
			});
		} else {
			res.status(StatusCodes.NOT_FOUND).send({ message: "No deleted appointments found." });
		}
	} catch (e) {
		console.log(`Error in getDeletedAppointments`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.markMultipleAsDeleted = async (req, res, next) => {
	const { appointmentIds } = req.body; // Expecting an array of appointment IDs

	if (!Array.isArray(appointmentIds) || appointmentIds.length === 0) {
		return res.status(StatusCodes.BAD_REQUEST).send({ message: "Appointment IDs are required." });
	}

	try {
		const results = await Promise.all(appointmentIds.map(id => model.updateDeletedApp(id, '1'))); // Update each appointment
		res.status(StatusCodes.OK).send({ message: "Appointments marked as deleted successfully.", results });
	} catch (e) {
		console.log(`Error in markMultipleAsDeleted`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

// Divya --added on 11 Dec 2024
exports.schedule_appointment = async (req, res, next) => {
	// console.log("schedule_appointment controller");
	// console.log(req.body);

	const { appid, admin_user_id, ap_date, ap_time, meet_type, venue, to_be_opt, stopsendemailmessage, send_vds, stay_avail } = req.body;

	// Generate QR Code - HOLD
	

	// Get Appointment Data By ID
	const app_data = await model.findOneById(appid);
	// console.log("appointment",app_data); 

	// Get Logged in User data
	const sec_data = await adminUserModel.findOne(admin_user_id);
	// console.log("sec_data",sec_data);
	let secretary_user_location = sec_data[0].user_location;
	let secretary_user_name = sec_data[0].full_name;
	let extra_sign = sec_data[0].extra_sign;

	let ap_status = app_data[0].ap_status;
	let ap_location = app_data[0].ap_location;
	const EURloc = [22, 23, 24, 25, 26, 27, 28, 30, 31];

	// Get User Data By ID
	const user_data = await userModel.findOne(app_data[0].user_id);
	// console.log("user_data",user_data);

	let full_name, email_id, mobile_no;
	// Get User Details
	if(app_data[0].for_ap == "me"){
		full_name = user_data[0].full_name;
		email_id = user_data[0].email_id;
		mobile_no = user_data[0].phone_no;
	} else {
		full_name = app_data[0]['full_name'];
		email_id = app_data[0]['email_id'];
		mobile_no = app_data[0]['mobile_no'];
	}

	// let app_status = "";
	let logaptStatus = ap_status;
	let approve_status = "";
	let rescheduled_app = "";

	if(ap_status == "Scheduled"){
		rescheduled_app = "Rescheduled";
	}else if(ap_status == "Pending"){
		rescheduled_app = "Scheduled";
	}else if(ap_status=="TB R/S"){
		rescheduled_app = "Rescheduled";
	}else if(ap_status == "SB"){
		rescheduled_app = "Rescheduled";
	} else if(ap_status == "GK"){
		rescheduled_app = "Rescheduled";
	} else if(ap_status == "PB"){
		rescheduled_app = "Rescheduled";
	} else{
		rescheduled_app = null;
	}

	if(ap_date && ap_time){
		approve_status = "Scheduled";
		logaptStatus = "Scheduled";
	}

	if(ap_date && ap_time && ap_status == "SB"){
		approve_status = "SB";
		logaptStatus = "Rescheduled";
	}

	if(ap_date && ap_time && ap_status == "GK"){
		approve_status = "GK";
		logaptStatus = "Rescheduled";
	}

	if(ap_date && ap_time && ap_status == "PB"){
		approve_status = "PB";
		logaptStatus = "Rescheduled";
	}

	if(to_be_opt){
		approve_status = "TB R/S";
		logaptStatus = "Rescheduled";
	}

	if(rescheduled_app == "Rescheduled"){
		logaptStatus = "Rescheduled";
	}
	
	// if(venue == "Satsang Backstage"){
	// 	approve_status = "SB";
	// }
	// if(venue == "Gurukul"){
	// 	approve_status = "GK";
	// }
	// if(venue == "Puja Backstage"){
	// 	approve_status = "PB";
	// }

	let date_time = '';
	if (ap_date && ap_time) {
		date_time = `${ap_date} ${ap_time}`;
	}

	// if($post['app_location'] !='' && $post['app_location'] != 'undefined'){
	// 	if($post['venue'] == 'undefined'){
	// 		$post['venue'] = $post['app_location'];
	// 		$_POST['venue'] = $post['app_location'];
	// 	}
	// }
	
	const data = {
		ap_status: approve_status || null, // Using `|| null` for undefined fallback
		ap_date: ap_date,
		app_visit: venue, 
		mtype: meet_type,
		deleted_app: '0',
		slotted_by: admin_user_id
	};

	// if (isset($post['send_arrival']) && $post['send_arrival']=="Yes") {
	// 	$data['arrival_time'] = $post['arrival_time'];
	// }else{
	// 	$data['arrival_time'] = NULL;
	// }

	// if (isset($post['send_schedule']) && $post['send_schedule']=="Yes") {
	// 	$data['schedule_date'] = $post['schedule_date'];
	// 	$data['schedule_time'] = $post['schedule_time'];
	// 	$data['send_schedule'] = $post['send_schedule'];
	// }else{
	// 	$data['schedule_date'] = NULL;
	// 	$data['schedule_time'] = NULL;
	// 	$data['send_schedule'] = 'No';
	// 	$post['send_schedule'] = "No";
	// }

	if(stay_avail){
		data.stay_avail = "Yes";
	} else {
		data.stay_avail = "";
	}

	if (ap_time !== '') {
		data.ap_time = new Date(date_time).getTime() / 1000; // Convert to UNIX timestamp (in seconds)
	}

	if(rescheduled_app == "Rescheduled"){
		data.admit_status = "";
		data.admitted_by = "0";
	}

	const result = await model.update(app_data[0].id, data);
	// console.log("result",result);
	// console.log("update data",data);

	if (result && !_.isEmpty(result)) {
		// console.log("Appointment updated !!");
		// Re-scheduled Logs --added on 22 Aug 2024
		const apt_his_data = {
			ap_id: "",
			ap_date: ap_date,
			mtype: meet_type,
			app_visit: venue, 
			ap_status: logaptStatus, 
			slotted_by: admin_user_id
		};
		if (ap_time !== '') {
			apt_his_data.ap_time = new Date(date_time).getTime() / 1000; // Convert to UNIX timestamp (in seconds)
		}
		// $apthisqry = $this->db->insert('appt_req_history', $apt_his_data);
		// End Re-scheduled Logs

		// Update Assign to
		// console.log("admin role",sec_data[0].role);
		if(sec_data[0].role == "secretary"){
			if(approve_status == 'Scheduled' || approve_status == 'TB R/S'){
				if(app_data[0].assign_to == ""){
					const assigntodata = {
						assign_to: admin_user_id
					}
					const assigntoresult = await model.update(app_data[0].id, assigntodata);
				}
			}
		} else {
			console.log("no assign to update");
		}

		// Send Email and SMS
		if(!stopsendemailmessage){
			if (ap_time !== '') {
				const aptime = new Date(`1970-01-01T${ap_time}`).toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: true
				});
				// post.ap_time = time;
				// console.log("ap_time",aptime);
			}
			// if($post['send_arrival'] == 'Yes'){
			// 	$post['ap_time'] = date('h:i A',strtotime($post['arrival_time']));
			// }

			let get_temp_data, getSmsData;

			if (rescheduled_app == "Rescheduled") {
				if (EURloc.includes(ap_location)) {
					// Europe location found
					get_temp_data = await emailModel.findOne(41);
					// console.log("Europe",getTempData);
				} else {
					get_temp_data = await emailModel.findOne(2);
					getSmsData = await smsModel.findOne(3);
					// console.log("non Europe",getTempData, getSmsData);
				}
			}

			if (ap_date && ap_time && rescheduled_app != "Rescheduled") {
				if (EURloc.includes(ap_location)) {
					// Europe location found
					get_temp_data = await emailModel.findOne(40);
				} else {
					get_temp_data = await emailModel.findOne(1);
					getSmsData = await smsModel.findOne(2);
				}
			}

			if (approve_status == 'TB R/S') {
				if(app_data[0].ap_status == "TB R/S"){ 
					if (EURloc.includes(ap_location)) {
						// Europe location found
						get_temp_data = await emailModel.findOne(41);
					} else {
						get_temp_data = await emailModel.findOne(39);
						getSmsData = await smsModel.findOne(5);
					}
				}else{
					if (EURloc.includes(ap_location)) {
						// Europe location found
						get_temp_data = await emailModel.findOne(40);
					} else {
						if(venue == "Special Enclosure - Shiva Temple, next to Yoga school, Art of Living International Center, Bangalore."){
							get_temp_data = await emailModel.findOne(38);
						} else {
							get_temp_data = await emailModel.findOne(9);
						}
						getSmsData = await smsModel.findOne(5);
					}
				}
			}

			if (approve_status == 'SB') {
				get_temp_data = await emailModel.findOne(42);
			}
			
			if (approve_status == 'GK') {
				get_temp_data = await emailModel.findOne(43);
			}

			// console.log(get_temp_data,getSmsData);
			const email_template_subject = {};
			const email_template_data = {};
			if (rescheduled_app == 'Rescheduled' || approve_status == 'Scheduled' || approve_status == 'TB R/S' || approve_status == 'SB' || approve_status == 'GK' || approve_status == 'PB') {
				// Extract the email template subject and body
				email_template_subject.body = get_temp_data[0].template_subject;
				email_template_data.body = get_temp_data[0].template_data;

				// Replace '{$SUB}' in the email body if it exists
				if (email_template_data.body.includes('{$SUB}')) {
					email_template_data.body = email_template_data.body.replace('{$SUB}', app_data[0].meet_subject);
				}

				// Get Appointment Data By ID
				const capp_data = await model.findOneById(appid);
				const zoom_pw = `<br>use password: ${capp_data[0].password}`;

				if(capp_data[0].app_visit != 'undefined' || capp_data[0].app_visit != '')
				{
					const aplocation = capp_data[0].ap_location;
					let ji = "";
					let app_visit = capp_data[0].app_visit;
					
					if(aplocation !== '1' && aplocation !== '3' && aplocation !== '15'){
						ji = '';
					}else{
						ji = 'Ji';
					}

					if(capp_data[0].app_visit == 'Online Zoom Meeting' && capp_data[0].join_url != '')
					{
						app_visit = app_visit+'<br><a href='+capp_data[0].join_url+'> Click Here For Zoom Link</a>'+$zoom_pw;
					}
					if (email_template_data.body.includes('{$app_location}')) {
						email_template_data.body = email_template_data.body.replace(
							'{$app_location}',
							app_visit
						);
					}

					if (capp_data[0].app_visit === 'Online Zoom Meeting' && capp_data[0].join_url === '') {
						return true;
					}

					let email_note = '';
					if (capp_data[0].app_visit === 'Online Zoom Meeting') {
						email_note = '<b>Note:</b> Please make sure to join the Zoom Meeting 5-10 minutes before the given time.';
					} else {
						if (ap_location !== "1") {
							email_note = "<p><strong>NOTE:</strong> Please come to the above location 15 minutes prior to your scheduled time.</p>";
						} else {
							email_note = "<p><strong>NOTE:</strong> Please come to the above location 15 minutes prior to your scheduled time. Kindly do not bring any flowers to the appointment / darshan venue.";
						}
					}

					if (stay_avail) {
						email_note = email_note;
					} else {
						if (ap_location === "1") {
							email_note = email_note + "This appointment is not a confirmation for your stay at the Ashram. You are requested to check with Ashram Housing for availability of accommodation.<br>";
						}
					}
					
					if(approve_status == "GK" || approve_status == "PB"){
						email_note = email_note + "Women in their monthly cycle are requested to refrain from going to Gurukul or Puja backstage. Please let us know if you are on your monthly cycle and we will arrange an alternate venue for the darshan.";
					}

					if (ap_location === "1") {
						email_note =  email_note + "<br/>Please note that our official photographer will be taking your pictures with Gurudev which can be accessed by logging onto https://divineapp.findmypik.com. Alternatively you may write to darshanline@yahoo.com for assistance with pictures.";
					}

					email_note = email_note + "</p>";

					const subject_variables = { '{$AID}': app_data[0].ap_id };
					let subject = email_template_subject.body;

					for (const [key, value] of Object.entries(subject_variables)) {
						subject = subject.replace(new RegExp(key, 'g'), value);
					}

					const getOffLoc = await locModel.findOneByAddress(venue);
					// console.log("getOffLoc",getOffLoc);

					let sms_ji = '';
					let sms_app_location = capp_data[0].app_visit;

					if (aplocation !== '1' && aplocation !== '3' && aplocation !== '15') {
						sms_ji = '';
					} else {
						sms_ji = 'Ji';
						if (approve_status === 'TB R/S') {
							if (aplocation === '1') {
								sms_app_location = getOffLoc[0].short_name + "  15 minutes";
							} else {
								sms_app_location = capp_data[0].app_visit;
							}
						} else {
							if (aplocation === '1') {
								sms_app_location = getOffLoc[0].short_name;
							} else {
								sms_app_location = capp_data[0].app_visit;
							}
						}
					}

					// const rsvp_url = `${base_url}rsvp/update/r/${appid}`;

					let post_people = app_data[0].no_people;
					let no_people = "";
					if(post_people != "1"){
						no_people = post_people+" people";
					} else {
						no_people = post_people+" person"; 
					}

					// Define template variables
					const templateVariables = {
						'{$AID}': app_data[0].ap_id,
						'{$full_name}': full_name,
						'{$ji}': ji,
						//'{$rsvp_link}': rsvp_url,
						'{$date}': new Date(ap_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), // Format date as d-M-Y
						'{$time}': ap_time || '', // Default to empty string if ap_time is not set
						'{$no_people}': no_people,
						'{$secretary_user_name}': secretary_user_name,
						'{$extra_sign}': extra_sign,
						'{$app_location}': app_visit,
						'{$email_note}': email_note,
						'{$meet_subject}': app_data[0].meet_subject,
						//'{$site_url}': 'http://localhost:3000', // Assuming you hardcode the base URL for now
					};

					// Replace template variables in the email body
					let templateData = email_template_data.body;
					for (let key in templateVariables) {
						const value = templateVariables[key];
						templateData = templateData.replace(new RegExp(key, 'g'), value); // Global replace for all occurrences
					}

					const email_footer_data = await emailFooterModel.findOne(secretary_user_location);
					// console.log("email_footer_data",email_footer_data);
					const email_footer_template = {};
					email_footer_template.body = email_footer_data[0].footer_content;

					
					// Variables to replace in the template
					const footer_variables = {
						'{$secretary_user_name}': secretary_user_name,
						'{$extra_sign}': extra_sign
					};

					// Email footer body template
					let footer = email_footer_template.body;

					// Replace variables in the template
					Object.keys(footer_variables).forEach((key) => {
						footer = footer.replace(new RegExp(key, 'g'), footer_variables[key]);
					});

					// console.log('Footer:', footer);

					if (EURloc.includes(ap_location)) {
						// Do Nothing
					} else {
						templateData += footer;
					}
					// console.log("email template data",templateData);
					
					// Send Email
					// from email, from name, to, subject, mailtype = html, message = templateData

					// Send SMS [HOLD]


				}
				
			}

		}


		// Send VDS Email [HOLD]

		// return response
		res.status(StatusCodes.OK).send({ message: 'Appointment scheduled successfully.' });
	} else {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Failed to schedule appointment !' });
	}


	// res.send('Appointment scheduled');

};

exports.updateAssignToFill = async (req, res, next) => {
    try {
        const ap_id = req.params.ap_id;
        const { name } = req.body;

        console.log("Request Parameters:", { ap_id, name });

        if (!name) {
            return res.status(StatusCodes.BAD_REQUEST).send({ message: "Name is required" });
        }

        const updateResult = await model.updateAssignToFill(ap_id, name);
        
        console.log("Update Result:", updateResult);

        const updatedAppointment = await model.findOneByApId(ap_id);

        if (updatedAppointment) {
            res.status(StatusCodes.OK).send({ 
                message: "Assign to fill updated successfully", 
                data: updatedAppointment[0] // Send the updated appointment details
            });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "Appointment not found" });
        }
    } catch (e) {
        console.log(`Error in updateAssignToFill`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.updateAppointmentAdmin = async (req, res, next) => {
    uploadAdmin(req, res, async (err) => { // Use multer middleware for file upload
        if (err) {
            console.log("Error during file upload:", err);
            return res.status(400).send({
                message: err.message
            });
        }

        try {
            const { ap_id } = req.params; // Extract appointment ID from the route parameter

            // Convert 12-hour time format to 24-hour
            const timeComponents = req.body.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
            let hours = parseInt(timeComponents[1]);
            const minutes = timeComponents[2];
            const period = timeComponents[3].toUpperCase();

            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;

            // Prepare appointment data
            const appointmentData = {
                full_name: req.body.name,
                email_id: req.body.email,
                country_code: req.body.country_code,
                mobile_no: req.body.mobileNo,
                picture: req.body.photo || '', // Ensure to handle the uploaded file
                venue: req.body.venue,
                country: req.body.country,
                designation: req.body.designation,
                from_date: req.body.from_date,
                to_date: req.body.to_date,
                no_people: req.body.noOfPeople,
                meet_purpose: req.body.purpose,
                secretary_note: req.body.remarks || '',
                ap_date: req.body.date,
                ap_time: formattedTime,
                ap_status: req.body.status || 'pending',
                email_status: req.body.dontSendEmailSms ? '0' : '1',
                // attachment: req.files ? req.files.map(file => file.filename).join(',') : '', // Store multiple filenames
            };

            // Update appointment in the database
            const data = await model.updateByApId(ap_id, appointmentData);

            if (data) {
                res.status(StatusCodes.OK).send({
                    message: 'Appointment updated successfully',
                    data: data
                });
            } else {
                res.status(StatusCodes.BAD_REQUEST).send({
                    message: "Failed to update appointment"
                });
            }
        } catch (e) {
            console.log(`Error in updateAppointmentAdmin`, e);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message: e.message
            });
        }
    });
};

exports.changeAppointmentStar = async (req, res, next) => {
	try {
		const { ap_id } = req.body; // Extract apid from the request body

		// Ensure apid is provided
		if (!ap_id) {
			return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID is required" });
		}

		// Fetch the current star_rate
		const appointment = await model.findOneByApId(ap_id);
		if (!appointment || appointment.length === 0) {
			return res.status(StatusCodes.NOT_FOUND).send({ message: "Appointment not found" });
		}

		const currentStarRate = appointment[0].star_rate;
		const newStarRate = currentStarRate === '1' ? '0' : '1'; // Toggle star_rate

		// Update the star_rate in the database
		const data = await model.updateAppointmentStar(ap_id, newStarRate); // Update only star_rate

		if (data) {
			res.status(StatusCodes.OK).send({ message: `${newStarRate}` });
		} else {
			res.status(StatusCodes.BAD_REQUEST).send({ message: "Failed to update appointment star status" });
		}
	} catch (e) {
		console.log(`Error in changeAppointmentStar`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};