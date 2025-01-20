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
const { country_code, from_date, to_date, ap_status } = require('../dto/appointment_request.dto');
const QRCode = require('qrcode');
const uploadsDir = path.join(__dirname, '../uploads'); // Adjusted to point to the correct uploads directory

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true }); // Create the directory if it doesn't exist
    console.log('Uploads directory created:', uploadsDir);
}

// Add multer storage configuration at the top of the file
// const storage = multer.diskStorage({
// 	destination: function (req, file, cb) {
// 		const uploadDir = path.join(__dirname, '../uploads/appointments');
// 		if (!fs.existsSync(uploadDir)) {
// 			fs.mkdirSync(uploadDir, { recursive: true });
// 		}
// 		cb(null, uploadDir);
// 	},
// 	filename: function (req, file, cb) {
// 		const fileName = `${Date.now()}-${file.originalname}`;
// 		cb(null, fileName);
// 	}
// });
const storage = multer.memoryStorage(); 
// Configure multer with file filtering
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.avif'];
        const ext = path.extname(file.originalname).toLowerCase();
        console.log('File Extension:', ext);
        console.log('File MIME Type:', file.mimetype);

        // if (!allowedExtensions.includes(ext)) {
        //     return cb(new Error(`Only ${allowedExtensions.join(', ')} files are allowed`));
        // }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
}).fields([{ name: 'attachment', maxCount: 1 }, { name: 'picture', maxCount: 1 }]);
// Add multer storage configuration at the top of the file
const uploadAdmin = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.avif'];
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            return cb(new Error("Only JPG, JPEG, PNG, PDF, DOC, and DOCX files are allowed"));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
    }
}).single("photo");

// Add these imports at the top of your file
const AWS = require('aws-sdk');

// Configure AWS S3
AWS.config.update({
    accessKeyId: process.env.AWS_S3_ACCESSKEYID,
    secretAccessKey: process.env.AWS_S3_SECRETACCESSKEYID,
    region: process.env.REGION // Ensure you have the correct region
});

const s3 = new AWS.S3(); // Create S3 instance

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
        const assignToId = req.params.assign_to;  // Extract assign_to from the route parameter
        const offset = 0; // Set your offset for pagination
        const pageSize = 50; // Set your page size for pagination

        // Fetch appointments and count using assignToId
        const { appointments, totalCount } = await model.find(assignToId, offset, pageSize);  // Pass assignToId to the find function
        const appointmentCountByDate = await model.getUserAppointmentsCountByDate(assignToId); // Get count by ap_date using assignToId

        if (!_.isEmpty(appointments)) {
            res.status(StatusCodes.OK).send({
                totalCount: totalCount,
                appointments: appointments,
                appointmentCountByDate: appointmentCountByDate // Include the count in the response
            });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for this assignee." });
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

            // Prepare appointment data
            const appointmentData = {
                ap_id: Math.floor(100000 + Math.random() * 900000), // Generate a random 6-digit number
                user_id: userId,
                // full_name: req.body.user_full_name,
                // email_id: req.body.user_email,
                // mobile_no: req.body.user_phone,
                ap_location: req.body.ap_location,
                designation: req.body.designation,
                meet_subject: req.body.meet_subject || '',
                meet_purpose: req.body.meet_purpose,
                no_people: req.body.no_people,
                no_people_names: req.body.no_people_names,
                no_people_numbers: req.body.no_people_numbers,
                from_date: req.body.from_date,
                to_date: req.body.to_date,
                attachment: '', // Placeholder for S3 URL
                currently_doing: req.body.currently_doing,
                designationcomp: req.body.designationcomp,
                dop: req.body.dop,
                toa: req.body.toa || 'offline',
                curr_loc: req.body.curr_loc || '',
                // selCountry: req.body.selCountry || '',
                // selState: req.body.selState || '',
                // selCity: req.body.selCity || '',
                for_ap: "me",
                ap_status: "Pending",
                entry_date_time: new Date().toISOString(), // Added current date and time
            };

            // Check if a file is attached and upload it to S3
            if (req.files && req.files.attachment && req.files.attachment.length > 0) {
                const file = req.files.attachment[0];
				console.log("filefilefile",file)
                const uploadParams = {
                    Bucket: process.env.AWS_S3_BUCKETNAME,
                    Key: `attachments/${Date.now()}_${file.originalname}`, // Unique file name
                    Body: file.buffer,
                    ContentType: file.mimetype
                };
				console.log("uploadParamsuploadParams",uploadParams);
				
                try {
                    const uploadResult = await s3.upload(uploadParams).promise();
                    console.log('File uploaded successfully:', uploadResult.Location);
                    appointmentData.attachment = uploadResult.Location; // Assign S3 URL to the attachment field
                } catch (uploadError) {
                    console.error('Error uploading file to S3:', uploadError);
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                        message: 'File upload to S3 failed',
                        error: uploadError.message
                    });
                }
            }

            // Insert appointment data into the database
            const data = await model.insert(appointmentData);
            if (data) {
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
			const attachments = req.files['attachment'] ? req.files['attachment'] : [];
			const pictures = req.files['picture'] ? req.files['picture'] : [];

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
				picture: '', // Placeholder for S3 URL
				attachment: '', // Placeholder for S3 URL
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
				designationcomp: req.body.designationcomp,
				for_ap: "other",
				ap_status: "Pending",
                entry_date_time: new Date().toISOString(),
			};

			// Upload files to S3
			const uploadPromises = [];

			// Upload attachment if exists
			if (attachments.length > 0) {
				const attachmentFile = attachments[0];
				const uploadParamsAttachment = {
					Bucket: process.env.AWS_S3_BUCKETNAME,
					Key: `attachments/${Date.now()}_${attachmentFile.originalname}`, // Unique file name
					Body: attachmentFile.buffer,
					ContentType: attachmentFile.mimetype
				};
				uploadPromises.push(s3.upload(uploadParamsAttachment).promise().then(uploadResult => {
					appointmentData.attachment = uploadResult.Location; // Assign S3 URL to the attachment field
				}));
			}

			// Upload picture if exists
			if (pictures.length > 0) {
				const pictureFile = pictures[0];
				const uploadParamsPicture = {
					Bucket: process.env.AWS_S3_BUCKETNAME,
					Key: `pictures/${Date.now()}_${pictureFile.originalname}`, // Unique file name
					Body: pictureFile.buffer,
					ContentType: pictureFile.mimetype
				};
				uploadPromises.push(s3.upload(uploadParamsPicture).promise().then(uploadResult => {
					appointmentData.picture = uploadResult.Location; // Assign S3 URL to the picture field
				}));
			}

			// Wait for all uploads to complete
			await Promise.all(uploadPromises);

			// Insert appointment data into the database
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
        const page = parseInt(req.query.page) || 1;
		const perPage = parseInt(req.query.perPage) || 5;
	//	const emailId = req.params.email_id;

		const data = await model.getUserHistory(userId); // Call the model method
		const totalCount = data.length;
        
        const startIndex = (page - 1) * perPage;
		const paginatedData = data.slice(startIndex, startIndex + perPage);

		if (!_.isEmpty(paginatedData)) {
			res.status(StatusCodes.OK).send({
				message: "User history retrieved successfully", // Success message
				totalCount, // Include total count in the response
				page, // Current page
				perPage, // Items per page
				totalPages: Math.ceil(totalCount / perPage), // Total pages
				data: paginatedData // Paginated data
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
        const assignTo = req.params.assign_to === 'all' ? null : req.params.assign_to; // Handle "all" as a keyword
        const dateString = req.params.datestring;

        // Validate dateString (datestring is mandatory)
        if (!dateString) {
            return res.status(400).json({ message: "datestring is required." });
        }

        // Fetch appointments based on the date and assigned user
        const data = await model.getAppointmentsByDate(dateString, assignTo);

        if (data && data.length > 0) {
            // Initialize arrays for each status category
            const morningData = [];
            const eveningData = [];
            const nightData = [];
            const tbrsData = [];
            const doneData = [];
            const sbData = [];
            const gkData = [];
            const pbData = [];

            // Iterate over the fetched appointments and categorize them
            data.forEach(appointment => {
                const apTime = new Date(appointment.ap_time * 1000); // Convert timestamp to Date object
                const hour = apTime.getHours(); // Extract the hour in 24-hour format

                // Classify based on appointment status
                if (appointment.ap_status === "Scheduled") {
                    // Time-based classification for Scheduled appointments
                    if (hour < 16) {
                        morningData.push(appointment);
                    } else if (hour >= 16 && hour < 19) {
                        eveningData.push(appointment);
                    } else if (hour >= 19 && hour <= 23) {
                        nightData.push(appointment);
                    }
                } else if (appointment.ap_status === "TB R/S") {
                    tbrsData.push(appointment);
                } else if (appointment.ap_status === "Done") {
                    doneData.push(appointment);
                } else if (appointment.ap_status === "SB") {
                    sbData.push(appointment);
                } else if (appointment.ap_status === "GK") {
                    gkData.push(appointment);
                } else if (appointment.ap_status === "PB") {
                    pbData.push(appointment);
                }
            });

            // Prepare the response with categorized data
            const categorizedData = {
                morning_data: morningData,
                evening_data: eveningData,
                night_data: nightData,
                tbrs_data: tbrsData,
                done_data: doneData,
                sb_data: sbData,
                gk_data: gkData,
                pb_data: pbData
            };

            // Return the response
            return res.status(200).json({
                message: "Appointments fetched successfully.",
                data: categorizedData,
            });
        } else {
            return res.status(404).json({ message: "No appointments found for this date." });
        }
    } catch (e) {
        console.error(`Error in getAppointmentsByDate: ${e}`);
        res.status(500).json({ message: "An error occurred while fetching appointments.", error: e.message });
    }
};




exports.getSingleAppointmentDetails = async (req, res, next) => {
    try {
        const { id } = req.params; // Extract id from the route parameter

        // Call the model method to get appointment details by ID
        const appointmentData = await model.findOne(id);

        if (!_.isEmpty(appointmentData)) {
            const userId = appointmentData[0].user_id; // Get user_id from appointment data
            const userData = await userModel.findOne(userId); // Fetch user data using user_id

            res.status(StatusCodes.OK).send({
                message: "data retrived successfully",
                appointment: appointmentData[0], // Send the first result of appointment
                user: userData[0] // Send the user data
            });
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
		const assignTo = req.params.assign_to; // Extract assign_to from the route parameter
		const locationId = req.params.location_id; // Extract location_id from the route parameter
		const dateString = req.params.date; // Extract date from the route parameter

		// Call the model method with assignTo, dateString, and locationId
		const data = await model.getAppointmentsByDate(assignTo, dateString, locationId);

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

exports.getTomorrowsAppointmentsData = async (req, res, next) => {
	console.log("kkkkk")
    try {
        const assignTo = req.params.assign_to; // Extract assign_to from the route parameter
        const locationId = req.params.location_id; // Extract location_id from the route parameter

        // Calculate tomorrow's date
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Increment the date by 1 to get tomorrow's date
        const dateString = tomorrow.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

        // Call the model method with assignTo, dateString, and locationId
        const data = await model.getAppointmentsByDate(assignTo, dateString, locationId);

        if (!_.isEmpty(data)) {
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
        const ap_id = req.params.ap_id; // Extract id from the route parameter

        // Ensure id is provided
        if (!ap_id) {
            return res.status(StatusCodes.BAD_REQUEST).send({ message: "ID is required" });
        }

        // Check if the appointment exists before marking it as deleted
        const appointment = await model.findOne(ap_id); 

        // Call the model method to update the deleted_app field
        const data = await model.updateDeletedApp(ap_id, '1'); // Update deleted_app to 1

        if (data) {
            res.status(StatusCodes.OK).send({
                message: "Appointment marked as deleted successfully",
                data: { ap_id, deleted_app: 1 } // Send the ID and the updated status
            });
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

		// Fetch data from the model
		const data = await model.getUpcomingAppointmentsByDate(dateString);

		// If data is found, format and return the response
		if (data && data.length > 0) {
			res.status(StatusCodes.OK).send({
				message: "Upcoming appointment dates retrieved successfully",
				totalCount: data.length,
				data: data.map(item => ({
					appointment_date: item.appointment_date,
					app_count: item.app_count
				}))
			});
		} else {
			// No data found
			res.status(StatusCodes.NOT_FOUND).send({
				message: "No upcoming appointment dates found.",
				totalCount: 0,
				data: []
			});
		}
	} catch (e) {
		// Handle errors
		console.error(`Error in getUpcomingAppointmentsByDate`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			message: e.message
		});
	}
};


exports.getUpcomingAppointmentsByMonthYear = async (req, res, next) => {
    try {
        const { month, year, userId } = req.query;

        // Validate month and year
        if (!month || !year || isNaN(month) || isNaN(year)) {
            return res.status(StatusCodes.BAD_REQUEST).send({
                message: "Invalid month or year. Please provide valid numeric values."
            });
        }

        const inputMonth = parseInt(month, 10);
        const inputYear = parseInt(year, 10);
        const inputUserId = userId && !isNaN(userId) ? parseInt(userId, 10) : null;

        // Ensure the month is between 1 and 12
        if (inputMonth < 1 || inputMonth > 12) {
            return res.status(StatusCodes.BAD_REQUEST).send({
                message: "Invalid month. Please provide a value between 1 and 12."
            });
        }

        // Fetch data from the model
        const data = await model.getUpcomingAppointmentsByMonthYear(inputMonth, inputYear, inputUserId);

        // If data is found, format and return the response
        if (data && data.length > 0) {
            res.status(StatusCodes.OK).send({
                message: "Upcoming appointment dates retrieved successfully",
                totalCount: data.length,
                data: data.map(item => ({
                    appointment_date: item.appointment_date,
                    app_count: item.app_count
                }))
            });
        } else {
            // No data found
            res.status(StatusCodes.NOT_FOUND).send({
                message: "No upcoming appointment dates found for the specified month and year.",
                totalCount: 0,
                data: []
            });
        }
    } catch (e) {
        // Handle errors
        console.error(`Error in getUpcomingAppointmentsByMonthYear`, e);
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
    uploadAdmin(req, res, async (err) => {
        if (err) {
            console.log("Error during file upload:", err);
            return res.status(400).send({
                message: err.message
            });
        }

        try {
            const { name, designation, email, mobileNo, venue, purpose, date, time, country_code, tbsReq, dontSendEmailSms } = req.body;

            if (!name || !designation || !email || !mobileNo || !venue || !purpose || !date || !time) {
                return res.status(400).send({ message: "All required fields must be provided." });
            }

            // Time parsing logic
            const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;
            const timeComponents = time.match(timeRegex);

            if (!timeComponents) {
                return res.status(400).send({ message: `Invalid time format. Provided time: "${time}".` });
            }

            let hours = parseInt(timeComponents[1], 10);
            const minutes = timeComponents[2];
            const period = timeComponents[3]?.toUpperCase();

            if (period) {
                if (period === 'PM' && hours < 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
            }

            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;

            const appointmentData = {
                ap_id: Math.floor(100000 + Math.random() * 900000),
                full_name: name,
                designation,
                no_people: req.body.noOfPeople || 1,
                mobile_no: mobileNo,
                email_id: email,
                venue,
                meet_purpose: purpose,
                secretary_note: req.body.remarks || '',
                ap_date: date,
                ap_time: formattedTime,
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
                country_code,
                state: 0,
                meet_subject: purpose,
                mtype: tbsReq ? 'TBS' : 'Regular',
                attachment: ''
            };

            if (req.file) {
                console.log("File upload detected:", req.file);

                if (!req.file.buffer) {
                    console.error("File buffer is missing.");
                    return res.status(400).send({
                        message: "File upload failed. Buffer data is missing."
                    });
                }

                const uploadParams = {
                    Bucket: process.env.AWS_S3_BUCKETNAME,
                    Key: `attachments/${req.file.originalname}`,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype
                };

                try {
                    const uploadResult = await s3.upload(uploadParams).promise();
                    console.log('File uploaded successfully:', uploadResult.Location);
                    appointmentData.attachment = uploadResult.Location;
                } catch (uploadError) {
                    console.error('Error uploading file to S3:', uploadError);
                    return res.status(500).send({
                        message: 'File upload failed.',
                        error: uploadError.message
                    });
                }
            } else {
                console.log('No file uploaded.');
                return res.status(400).send({ message: "No file uploaded." });
            }

            const data = await model.insert(appointmentData);

            if (data) {
                if (!dontSendEmailSms) {
                    try {
                        await emailService.sendMailer(
                            appointmentData.email_id,
                            'Appointment Request Confirmation',
                            `Dear ${appointmentData.full_name},\n\nYour appointment request has been received.\nAppointment ID: ${appointmentData.ap_id}\nDate: ${appointmentData.ap_date}\nTime: ${formattedTime}\n\nBest regards,\nAppointment Team`
                        );
                    } catch (emailError) {
                        console.log('Error sending email:', emailError);
                    }
                }

                res.status(201).send({
                    message: 'Appointment created successfully',
                    data
                });
            } else {
                res.status(400).send({ message: "Failed to create appointment" });
            }
        } catch (error) {
            console.error('Error in addNewAppointmentAdmin:', error);
            res.status(500).send({ message: error.message });
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

		// Updated query to exclude deleted appointments
		const { totalCount, data } = await model.getDoneAppointments(offset, pageSize, 0); // Pass 0 to include only non-deleted appointments
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

// exports.schedule_appointment = async (req, res, next) => {
//     try {
//         const { 
//             appid, 
//             admin_user_id, 
//             ap_date, 
//             ap_time, 
//             meet_type, 
//             venue, 
//             to_be_opt, 
//             stopsendemailmessage, 
//             send_vds, 
//             stay_avail,
//             referenceEmail,
//             full_name,
//             no_people,
//             for_the_loc
//         } = req.body;

//         // Get Appointment Data By ID
//         const app_data = await model.findOneById(appid);
        
//         // Check if app_data is valid
//         if (!app_data || app_data.length === 0) {
//             return res.status(404).send({ message: "Appointment not found." });
//         }

//         // Get Logged in User data
//         const sec_data = await adminUserModel.findOne(admin_user_id);
//         const secretary_user_location = sec_data[0].user_location;
//         const secretary_user_name = sec_data[0].full_name;
//         const extra_sign = sec_data[0].extra_sign;

//         const ap_location = app_data[0].ap_location; // Accessing ap_location safely now
//         console.log("ap_location", ap_location);
        
//         // Generate QR Code
//         const qrCodeData = ap_location === 1 ? venue : app_data[0].id.toString();
//         const qrCodeBase64 = await generateQRCode(qrCodeData);

//         if (!qrCodeBase64) {
//             console.error('Failed to generate QR code.');
//             return res.status(500).send({ message: 'QR Code generation failed' });
//         }

//         // Upload QR Code to S3
//         const uploadParams = {
//             Bucket: process.env.AWS_S3_BUCKETNAME,
//             Key: `qr_code_${appid}.png`, // Unique file name
//             Body: Buffer.from(qrCodeBase64.split(",")[1], 'base64'), // Convert base64 to buffer
//             ContentType: 'image/png' // Set the content type
//         };

//         // Upload to S3
//         const uploadResult = await s3.upload(uploadParams).promise();
//         console.log('QR Code uploaded successfully:', uploadResult.Location); // Log the S3 URL

//         // Process appointment status
//         let ap_status = app_data[0].ap_status;
//         let rescheduled_app = '';
//         let approve_status = '';

//         if (['Scheduled', 'TB R/S', 'SB', 'GK', 'PB'].includes(ap_status)) {
//             rescheduled_app = 'Rescheduled';
//         }

//         if (ap_date && ap_time) {
//             approve_status = 'Scheduled';
//             if (['SB', 'GK', 'PB'].includes(ap_status)) {
//                 approve_status = ap_status;
//             }
//         }

//         if (to_be_opt) {
//             approve_status = 'TB R/S';
//         }

//         const data = {
//             ap_status: approve_status || null,
//             ap_date: ap_date,
//             app_visit: venue,
//             mtype: meet_type,
//             deleted_app: '0',
//             slotted_by: admin_user_id,
//             stay_avail: stay_avail ? 'Yes' : ''
//         };

//         if (ap_time) {
//             const dateTime = `${ap_date} ${ap_time}`;
//             data.ap_time = new Date(dateTime).getTime() / 1000;
//         }

//         if (rescheduled_app === 'Rescheduled') {
//             data.admit_status = '';
//             data.admitted_by = '0';
//         }

//         const result = await model.update(app_data[0].id, data);

//         if (result) {
//             // Fetch the email template
//             const emailTemplateModel = require('../models/email_template');
//             const emailTemplate = await emailTemplateModel.findOne(for_the_loc === 'IND' ? 8 : 35);

//             if (!emailTemplate || emailTemplate.length === 0) {
//                 console.error('Email template not found');
//                 return res.status(500).send({ message: 'Email template not found' });
//             }

//             // Prepare email content with QR Code URL
//             const emailBody = emailTemplate[0].template_data
//                 .replace('{$full_name}', full_name)
//                 .replace('{$AID}', appid)
//                 .replace('{$date}', ap_date)
//                 .replace('{$time}', ap_time)
//                 .replace('{$no_people}', no_people)
//                 .replace('{$app_location}', venue)
//                 .replace('{$link}', `<a href="${uploadResult.Location}">View QR Code</a>`)
//                 .replace('{$qr_code_image}', `<img src="cid:qr_code_image" alt="QR Code" style="width:200px; height:200px;"/>`); // Embed QR Code

//             // Send email with the selected message
//             const emailResult = await emailService.sendMailer(
//                 referenceEmail,
//                 'Appointment Scheduled',
//                 emailBody,
//                 {
//                     attachments: [
//                         {
//                             filename: `qr_code_${appid}.png`,
//                             content: qrCodeBase64.split(",")[1], // Extract base64 content
//                             encoding: 'base64',
//                             cid: 'qr_code_image' // Content ID for embedding in email
//                         }
//                     ]
//                 }
//             );

//             console.log('Email sent successfully:', emailResult); // Log the email result

//             // Respond with success
//             res.status(200).send({ 
//                 message: 'Appointment scheduled successfully.',
//                 qrCodeUrl: uploadResult.Location, // Include the S3 URL in the response
//                 emailResult, // Include emailResult in the response
//                 qrCode: {
//                     data: qrCodeData,
//                     image: qrCodeBase64,
//                     appointmentId: appid,
//                     venue: venue,
//                     generatedFor: ap_location === 1 ? 'venue' : 'appointmentId'
//                 }
//             });
//         } else {
//             res.status(500).send({ message: 'Failed to schedule appointment!' });
//         }
//     } catch (error) {
//         console.error('Error in schedule_appointment:', error);
//         res.status(500).send({ 
//             message: 'An error occurred while scheduling the appointment.',
//             error: error.message 
//         });
//     }
// };



// Helper function to generate QR Code in base64 format

// exports.schedule_appointment = async (req, res, next) => {
//     try {
//         const { 
//             appid, 
//             admin_user_id, 
//             ap_date, 
//             ap_time, 
//             meet_type, 
//             venue, 
//             to_be_opt, 
//             stopsendemailmessage, 
//             send_vds, 
//             stay_avail,
//             referenceEmail,
//             full_name,
//             no_people,
//             for_the_loc,
//             ap_location
//         } = req.body;

//         // Get Appointment Data By ID
//         const app_data = await model.findOneById(appid);
        
//         if (!app_data || app_data.length === 0) {
//             return res.status(404).send({ message: "Appointment not found." });
//         }

//         // Generate QR Code - Fixed Logic
//         let qrCodeData;
//         // if (parseInt(ap_location) === 1) {  // Ensure numeric comparison
//         //     qrCodeData = `Venue: ${venue}, Name: ${full_name}, Date: ${ap_date}, Time: ${ap_time}, No. of People: ${no_people}`;
//         //     console.log("Generating QR code for venue:", venue, full_name, ap_date, ap_time, no_people);
//         // } else {
//             qrCodeData = appid.toString();  // Use appointment ID for other locations
//             console.log("Generating QR code for appointment ID:", appid);
//         // }

//         const qrCodeBase64 = await generateQRCode(qrCodeData);

//         if (!qrCodeBase64) {
//             console.error('Failed to generate QR code.');
//             return res.status(500).send({ message: 'QR Code generation failed' });
//         }

//         // Upload QR Code to S3
//         const uploadParams = {
//             Bucket: process.env.AWS_S3_BUCKETNAME,
//             Key: `qr_code_${appid}.png`, // Unique file name
//             Body: Buffer.from(qrCodeBase64.split(",")[1], 'base64'), // Convert base64 to buffer
//             ContentType: 'image/png' // Set the content type
//         };

//         // Upload to S3
//         const uploadResult = await s3.upload(uploadParams).promise();
//         console.log('QR Code uploaded successfully:', uploadResult.Location); // Log the S3 URL

//         // Process appointment status
//         let ap_status = app_data[0].ap_status;
//         let rescheduled_app = '';
//         let approve_status = '';

//         if (['Scheduled', 'TB R/S', 'SB', 'GK', 'PB'].includes(ap_status)) {
//             rescheduled_app = 'Rescheduled';
//         }

//         if (ap_date && ap_time) {
//             approve_status = 'Scheduled';
//             if (['SB', 'GK', 'PB'].includes(ap_status)) {
//                 approve_status = ap_status;
//             }
//         }

//         if (to_be_opt) {
//             approve_status = 'TB R/S';
//         }

//         const data = {
//             ap_status: approve_status || null,
//             ap_date: ap_date,
//             app_visit: venue,
//             mtype: meet_type,
//             deleted_app: '0',
//             slotted_by: admin_user_id,
//             stay_avail: stay_avail ? 'Yes' : '',
//             ap_location: ap_location // Use ap_location from req.body
//         };

//         if (ap_time) {
//             const dateTime = `${ap_date} ${ap_time}`;
//             data.ap_time = new Date(dateTime).getTime() / 1000;
//         }

//         if (rescheduled_app === 'Rescheduled') {
//             data.admit_status = '';
//             data.admitted_by = '0';
//         }

//         const result = await model.update(app_data[0].id, data);

//         if (result) {
//             // Fetch the email template
//             const emailTemplateModel = require('../models/email_template');
//             const emailTemplate = await emailTemplateModel.findOne(for_the_loc === 'IND' ? 8 : 35);

//             if (!emailTemplate || emailTemplate.length === 0) {
//                 console.error('Email template not found');
//                 return res.status(500).send({ message: 'Email template not found' });
//             }

//             // Prepare email content with QR Code URL
//             const emailBody = emailTemplate[0].template_data
//                 .replace('{$full_name}', full_name)
//                 .replace('{$AID}', appid)
//                 .replace('{$date}', ap_date)
//                 .replace('{$time}', ap_time)
//                 .replace('{$no_people}', no_people)
//                 .replace('{$app_location}', venue)
//                 .replace('{$link}', `<a href="${uploadResult.Location}">View QR Code</a>`)
//                 .replace('{$qr_code_image}', `<img src="cid:qr_code_image" alt="QR Code" style="width:200px; height:200px;"/>`); // Embed QR Code

//             // Send email with the selected message
//             const emailResult = await emailService.sendMailer(
//                 referenceEmail,
//                 'Appointment Scheduled',
//                 emailBody,
//                 {
//                     attachments: [
//                         {
//                             filename: `qr_code_${appid}.png`,
//                             content: qrCodeBase64.split(",")[1], // Extract base64 content
//                             encoding: 'base64',
//                             cid: 'qr_code_image' // Content ID for embedding in email
//                         }
//                     ]
//                 }
//             );

//             console.log('Email sent successfully:', emailResult); // Log the email result

//             // Respond with success
//             res.status(200).send({ 
//                 message: 'Appointment scheduled successfully.',
//                 qrCodeUrl: uploadResult.Location, // Include the S3 URL in the response
//                 emailResult, // Include emailResult in the response
//                 qrCode: {
//                     data: qrCodeData,
//                     image: qrCodeBase64,
//                     appointmentId: appid,
//                     venue: venue,
//                     // generatedFor: ap_location === 1 ? 'venue' : 'appointmentId'
//                     generatedFor: 'appointmentId'
//                 }
//             });
//         } else {
//             res.status(500).send({ message: 'Failed to schedule appointment!' });
//         }
//     } catch (error) {
//         console.error('Error in schedule_appointment:', error);
//         res.status(500).send({ 
//             message: 'An error occurred while scheduling the appointment.',
//             error: error.message 
//         });
//     }
// };

exports.schedule_appointment = async (req, res, next) => {
    // console.log("schedule_appointment controller");
    // console.log(req.body);
    const { appid, admin_user_id, ap_date, ap_time, meet_type, venue, to_be_opt, stopsendemailmessage, send_vds, stay_avail } = req.body;
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
    // console.log("user data",full_name, email_id, mobile_no);
    
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
    //  approve_status = "SB";
    // }
    // if(venue == "Gurukul"){
    //  approve_status = "GK";
    // }
    // if(venue == "Puja Backstage"){
    //  approve_status = "PB";
    // }
    let date_time = '';
    if (ap_date && ap_time) {
        date_time = `${ap_date} ${ap_time}`;
    }
    // if($post['app_location'] !='' && $post['app_location'] != 'undefined'){
    //  if($post['venue'] == 'undefined'){
    //      $post['venue'] = $post['app_location'];
    //      $_POST['venue'] = $post['app_location'];
    //  }
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
    //  $data['arrival_time'] = $post['arrival_time'];
    // }else{
    //  $data['arrival_time'] = NULL;
    // }
    // if (isset($post['send_schedule']) && $post['send_schedule']=="Yes") {
    //  $data['schedule_date'] = $post['schedule_date'];
    //  $data['schedule_time'] = $post['schedule_time'];
    //  $data['send_schedule'] = $post['send_schedule'];
    // }else{
    //  $data['schedule_date'] = NULL;
    //  $data['schedule_time'] = NULL;
    //  $data['send_schedule'] = 'No';
    //  $post['send_schedule'] = "No";
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
        // Generate QR Code - HOLD
        // Conditional QR Code Generation
        let qrCodeData = ap_location === 1 ? venue : app_data[0].id.toString();
        const qrCodeBase64 = await generateQRCode(qrCodeData);
        if (!qrCodeBase64) {
            console.error('Failed to generate QR code.');
            return res.status(500).send({ message: 'QR Code generation failed' });
        }
        console.log('Generated QR Code Base64:', qrCodeBase64);

        // Upload QR Code to S3
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKETNAME,
            Key: `qr_code_${appid}.png`, // Unique file name
            Body: Buffer.from(qrCodeBase64.split(",")[1], 'base64'), // Convert base64 to buffer
            ContentType: 'image/png' // Set the content type
        };
        let uploadResult;
        try {
             uploadResult = await s3.upload(uploadParams).promise();
            console.log('QR Code uploaded successfully:', uploadResult.Location); // Log the S3 URL
            // Save the S3 URL to appointment data if needed
            data.qr_code_url = uploadResult.Location; // Save the URL to the appointment data
        } catch (uploadError) {
            console.error('Error uploading QR code to S3:', uploadError);
            return res.status(500).send({
                message: 'Failed to upload QR Code to S3.',
                error: uploadError.message
            });
        }

        // Save QR Code image to file
        // const uploadsDir = path.join(__dirname, '../uploads');
        // const qrCodeImagePath = path.join(uploadsDir, `qr_code_${appid}.png`);
        // const base64Image = qrCodeBase64.replace(/^data:image\/png;base64,/, '');
        // // Ensure the uploads directory exists
        // if (!fs.existsSync(uploadsDir)) {
        //     fs.mkdirSync(uploadsDir, { recursive: true });
        // }
        // try {
        //     fs.writeFileSync(qrCodeImagePath, base64Image, 'base64');
        //     console.log('QR Code image saved successfully at:', qrCodeImagePath);
        // } catch (err) {
        //     console.error('Error saving QR Code image:', err);
        //     return res.status(500).send({ message: 'Failed to save QR Code image.' });
        // }
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
            //  $post['ap_time'] = date('h:i A',strtotime($post['arrival_time']));
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
            // console.log(get_temp_data);
            const email_template_subject = {};
            const email_template_data = {};
            if (rescheduled_app == 'Rescheduled' || approve_status == 'Scheduled' || approve_status == 'TB R/S' || approve_status == 'SB' || approve_status == 'GK' || approve_status == 'PB') {
                // Extract the email template subject and body
                email_template_subject.body = get_temp_data[0].template_subject;
                email_template_data.body = get_temp_data[0].template_data;
                // Replace '{$SUB}' in the email body if it exists
                // if (email_template_data.body.includes('{$SUB}')) {
                //  email_template_data.body = email_template_data.body.replace('{$SUB}', app_data[0].meet_subject);
                // }
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
                    let subject = email_template_subject.body;
                    subject = subject.replace("{$AID}",app_data[0].ap_id);
                    // console.log(subject);
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
                    // Replace template variables in the email body
                    email_template_data.body = email_template_data.body
                        .replace('{$AID}',app_data[0].ap_id)
                        .replace('{$full_name}',full_name)
                        .replace('{$ji}',ji)
                        .replace('{$date}',new Date(ap_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
                        .replace('{$time}',ap_time)
                        .replace('{$no_people}',no_people)
                        .replace('{$email_note}',email_note)
                        .replace('{$meet_subject}',app_data[0].meet_subject)
                        .replace('{$site_url}',"")
                        .replace("{$link}",`<a href="${uploadResult.Location}">Please click on this link for Security ePass for entry</a>`)
                        .replace("{$qr_code}",`<img src="${uploadResult.Location}">`);
                    // console.log("templateData",email_template_data.body);
                    
                    const email_footer_data = await emailFooterModel.findOne(secretary_user_location);
                    // console.log("email_footer_data",email_footer_data);
                    const email_footer_template = {};
                    
                    email_footer_template.body = email_footer_data[0].footer_content;
                    // Email footer body template
                    let footer = email_footer_template.body;
                    // Replace variables in the template
                    footer = footer
                        .replace("{$secretary_user_name}", secretary_user_name)
                        .replace("{$extra_sign}",extra_sign);
                    // console.log('Footer:', footer);
                    let templateData = email_template_data.body;
                    
                    if (EURloc.includes(ap_location)) {
                        // Do Nothing
                    } else {
                        templateData += footer;
                    }
                    // console.log("email template data",templateData);
                    // return;
                    // Send Email
                    // from email, from name, to, subject, mailtype = html, message = templateData
                    try{
                        const emailResult = await emailService.sendMailer(
                            email_id,
                            subject,
                            templateData,
                            {
                                attachments: [
                                    {
                                        filename: `qr_code_${appid}.png`,
                                        content: qrCodeBase64.split(",")[1], // Extract base64 content
                                        encoding: 'base64',
                                        cid: 'qr_code_image' // Content ID for embedding in email
                                    }
                                ]
                            }
                        );
        
                        console.log('Email sent successfully:', emailResult);
                        // Respond with success
                        res.status(StatusCodes.OK).send({ message: 'Appointment scheduled successfully.' });
                    } catch (emailError) {
                        console.error('Error sending email:', emailError);
                        return res.status(500).send({ 
                            message: 'Failed to send email with QR code.',
                            error: emailError.message 
                        });
                    }
                    // Send SMS [HOLD]
                }
                
            }
        }
        // Send VDS Email [HOLD]
        // return response
        // res.status(StatusCodes.OK).send({ message: 'Appointment scheduled successfully.' });
    } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Failed to schedule appointment !' });
    }
    // res.send('Appointment scheduled');
};
async function generateQRCode(data) {
    const QRCode = require('qrcode');
    try {
        // Generate QR code as Data URL (base64)
        return await QRCode.toDataURL(data);
    } catch (err) {
        console.error('Failed to generate QR code', err);
        return null;
    }
}

exports.updateAssignToFill = async (req, res, next) => {
    try {
        const ap_id = req.params.ap_id; // Extract ap_id from the route parameter
        const { name, assignToFill } = req.body; // Extract name and assignToFill from the request body

        console.log("Request Parameters:", { ap_id, name, assignToFill });

        if (!name) {
            return res.status(StatusCodes.BAD_REQUEST).send({ message: "Name is required" });
        }

        const updateResult = await model.updateAssignToFill(ap_id, name, assignToFill); // Call the model method
        
        console.log("Update Result:", updateResult);

        const updatedAppointment = await model.findOneByApId(ap_id);

        if (updatedAppointment) {
            res.status(StatusCodes.OK).send({ 
                message: "Assign to updated successfully", 
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
    uploadAdmin(req, res, async (err) => {
        if (err) {
            console.error("Error during file upload:", err);
            return res.status(400).send({ message: "File upload error: " + err.message });
        }

        try {
            // Extract and validate `ap_id` from route parameters
            const { ap_id } = req.params;
            if (!ap_id || isNaN(ap_id)) {
                return res.status(400).send({ message: "Invalid appointment ID provided." });
            }

            // Validate and parse `time` from the request body
            if (!req.body.time || !/(\d+):(\d+)\s*(AM|PM)/i.test(req.body.time)) {
                return res.status(400).send({ message: "Invalid time format. Expected format: HH:MM AM/PM" });
            }

            const timeComponents = req.body.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
            let hours = parseInt(timeComponents[1], 10);
            const minutes = timeComponents[2];
            const period = timeComponents[3].toUpperCase();

            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;

            // Prepare appointment data
            const appointmentData = {
                full_name: req.body.name || '',
                email_id: req.body.email || '',
                country_code: req.body.country_code || '',
                mobile_no: req.body.mobileNo || '',
                picture: req.body.photo || '', // Handle the uploaded file or empty string
                venue: req.body.venue || '',
                country: req.body.country || '',
                designation: req.body.designation || '',
                from_date: req.body.from_date || null,
                to_date: req.body.to_date || null,
                no_people: req.body.noOfPeople || 0,
                meet_purpose: req.body.purpose || '',
                secretary_note: req.body.remarks || '',
                ap_date: req.body.date || null,
                ap_time: formattedTime,
                ap_status: req.body.status || 'pending',
                email_status: req.body.dontSendEmailSms ? '0' : '1',
                // Uncomment if handling file attachments
                // attachment: req.files ? req.files.map(file => file.filename).join(',') : '',
            };

            // Update appointment in the database
            const data = await model.updateByApId(ap_id.trim(), appointmentData);

            if (data) {
                res.status(StatusCodes.OK).send({
                    message: "Appointment updated successfully",
                    data: data,
                });
            } else {
                res.status(StatusCodes.BAD_REQUEST).send({ message: "Failed to update appointment" });
            }
        } catch (e) {
            console.error("Error in updateAppointmentAdmin:", e);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
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

exports.updateCheckInStatus = async (req, res, next) => {
    try {
        const { appid, status } = req.body; // Extract appid and status from the request body

        // Ensure appid and status are provided
        if (!appid || !status) {
            return res.status(StatusCodes.BAD_REQUEST).send({ message: "App ID and status are required" });
        }

        const data = await model.updateCheckInStatus(appid, { status }); // Call the model method
        if (data) {
            res.status(StatusCodes.OK).send({ message: "Check-in status updated successfully" });
        } else {
            res.status(StatusCodes.BAD_REQUEST).send({ message: "Failed to update check-in status" });
        }
    } catch (e) {
        console.log(`Error in updateCheckInStatus`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};


exports.getInboxData = async (req, res, next) => {
    try {
        const { user_id, limit, offset } = req.body;

        // Validate required input
        if (!user_id) {
            return res.status(400).send({ message: 'User ID is required' });
        }

        // Fetch admin user details (logged in user)
        const adminUserData = await adminUserModel.findOne(user_id);
        if (!adminUserData || adminUserData.length === 0) {
            return res.status(404).send({ message: 'Admin user not found' });
        }
        const user_location = adminUserData[0].user_location;

        const data = await model.getInboxAppointments(user_location, parseInt(limit), parseInt(offset));

        for (const key in data) {
            const value = data[key];
            const tuserdata = await userModel.findOne(value.user_id);
            if (!tuserdata || tuserdata.length === 0) {
                continue; // Skip this record or handle missing user data appropriately
            }

            // Update the 'toa' field
            data[key].toa = value.toa !== 'offline' ? 'online' : 'In-Person';

            // Extract user data for the current record
            const userData = tuserdata[0];

            // Handle appointments for 'me' and others
            if (value.for_ap === 'me') {
                Object.assign(data[key], {
                    full_name: userData.full_name || '',
                    photo: userData.photo ? `${userData.photo}` : '', // Modified
                    designation: userData.designation || '',
                    ref_name: value.ref_name,
                    ref_country_code: value.ref_country_code,
                    ref_mobile_no: value.ref_mobile_no,
                    country_code: userData.country_code || '',
                    phone_no: userData.phone_no || '',
                    user_full_name: userData.full_name || '',
                    user_email_id: userData.email_id || ''
                });
            } else {
                Object.assign(data[key], {
                    full_name: value.full_name,
                    photo: value.picture ? `${value.picture}` : '', // Modified
                    designation: value.designation,
                    ref_name: userData.full_name || '',
                    ref_country_code: userData.country_code || '',
                    ref_mobile_no: userData.phone_no || '',
                    country_code: value.country_code,
                    phone_no: value.mobile_no
                });
            }

            // Fetch and assign details for 'assigned to' and 'assigned by' users
            const assignToData = await adminUserModel.findOne(value.assign_to);
            const assignedByData = await adminUserModel.findOne(value.assigned_by);

            Object.assign(data[key], {
                assign_to_full_name: assignToData[0]?.full_name || '',
                assign_to_email_id: assignToData[0]?.email_id || '',
                assign_to_sort_name: assignToData[0]?.sort_name || '',
                assigned_by_full_name: assignedByData[0]?.full_name || '',
                assigned_by_email_id: assignedByData[0]?.email_id || '',
                assigned_by_sort_name: assignedByData[0]?.sort_name || ''
            });
        }

        if (!_.isEmpty(data)) {
            res.status(StatusCodes.OK).send({ message: `${data.length} records found`, data });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found !!" });
        }
    } catch (e) {
        console.error(`Error in getInboxData`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};


// Divya --added on 23 Dec 2024
// exports.getInboxData = async (req, res, next) => {
// 	try {
// 		const { user_id, limit, offset } = req.body;
// 		// console.log("getInboxData", limit, offset);

// 		// Fetch admin user details (logged in user)
// 		const adminUserData = await adminUserModel.findOne(user_id); 
// 		// console.log("adminUserData",adminUserData);
// 		const user_location = adminUserData[0].user_location;
// 		// console.log("user_location",user_location);
		
// 		const data = await model.getInboxAppointments(user_location, parseInt(limit), parseInt(offset));
		
// 		for (const key in data) {
// 			const value = data[key];
			
// 			// Fetch user details
// 			const tuserdata = await userModel.findOne(value.user_id); 
// 			// console.log("tuserdata",tuserdata);

// 			if (value.toa !== 'offline') {
// 				data[key].toa = 'online';
// 			} else {
// 				data[key].toa = 'In-Person';
// 			}

// 			if (value.for_ap === 'me') {
// 				data[key].full_name = tuserdata[0]?.full_name || '';
// 				data[key].photo = tuserdata[0]?.photo || '';
// 				data[key].designation = tuserdata[0]?.designation || '';
		
// 				data[key].ref_name = value.ref_name;
// 				data[key].ref_country_code = value.ref_country_code;
// 				data[key].ref_mobile_no = value.ref_mobile_no;
		
// 				data[key].country_code = tuserdata[0]?.country_code || '';
// 				data[key].phone_no = tuserdata[0]?.phone_no || '';
// 			} else {
// 				data[key].full_name = value.full_name;
// 				data[key].photo = value.picture;
// 				data[key].designation = value.designation;
		
// 				data[key].ref_name = tuserdata[0]?.full_name || '';
// 				data[key].ref_country_code = tuserdata[0]?.country_code || '';
// 				data[key].ref_mobile_no = tuserdata[0]?.phone_no || '';
		
// 				data[key].country_code = value.country_code;
// 				data[key].phone_no = value.mobile_no;
// 			}
		
// 			data[key].user_full_name = tuserdata[0]?.full_name || '';
// 			data[key].user_email_id = tuserdata[0]?.email_id || '';
		
// 			// Fetch admin user details (assigned to)
// 			const atuserdata = await adminUserModel.findOne(value.assign_to); 

// 			data[key].assign_to_full_name = atuserdata[0]?.full_name || '';
// 			data[key].assign_to_email_id = atuserdata[0]?.email_id || '';
// 			data[key].assign_to_sort_name = atuserdata[0]?.sort_name || '';
		
// 			// Fetch admin user details (assigned by)
// 			const attuserdata = await adminUserModel.findOne(value.assigned_by); 

// 			data[key].assigned_by_full_name = attuserdata[0]?.full_name || '';
// 			data[key].assigned_by_email_id = attuserdata[0]?.email_id || '';
// 			data[key].assigned_by_sort_name = attuserdata[0]?.sort_name || '';
// 		}
// 		// console.log("Inbox data",data.length);

// 		if (!_.isEmpty(data)) {
// 			res.status(StatusCodes.OK).send({ message: `${data.length} records found`, data });
// 		} else {
// 			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found !!" });
// 		}
// 	} catch (e) {
// 		console.log(`Error in getInboxData`, e);
// 		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
// 	}
// }

// Divya --added on 24 Dec 2024
// exports.getAssignedToMeData = async (req, res, next) => {
// 	// console.log("getAssignedToMeData");

// 	try {
// 		const { user_id, limit, offset } = req.body;
// 		// Fetch admin user details (logged in user)
// 		const adminUserData = await adminUserModel.findOne(user_id); 
// 		// console.log("adminUserData",adminUserData);

// 		const user_role = adminUserData[0].role;
// 		const user_location = adminUserData[0].user_location;

// 		const data = await model.getAssignedAppointments(user_id, user_role, user_location, parseInt(limit), parseInt(offset));
// 		// console.log("Assigned data",data.length);

// 		for (const key in data) {
// 			const value = data[key];

// 			// Fetch user details
// 			const tuserdata = await userModel.findOne(value.user_id); 
// 			// console.log("tuserdata",tuserdata);

// 			if (value.toa !== 'offline') {
// 				data[key].toa = 'online';
// 			} else {
// 				data[key].toa = 'In-Person';
// 			}

// 			if (value.for_ap === 'me') {
// 				data[key].full_name = tuserdata[0]?.full_name || '';
// 				data[key].photo = tuserdata[0]?.photo || '';
// 				data[key].designation = tuserdata[0]?.designation || '';
		
// 				data[key].ref_name = value.ref_name;
// 				data[key].ref_country_code = value.ref_country_code;
// 				data[key].ref_mobile_no = value.ref_mobile_no;
		
// 				data[key].country_code = tuserdata[0]?.country_code || '';
// 				data[key].phone_no = tuserdata[0]?.phone_no || '';
// 			} else {
// 				data[key].full_name = value.full_name;
// 				data[key].photo = value.picture;
// 				data[key].designation = value.designation;
		
// 				data[key].ref_name = tuserdata[0]?.full_name || '';
// 				data[key].ref_country_code = tuserdata[0]?.country_code || '';
// 				data[key].ref_mobile_no = tuserdata[0]?.phone_no || '';
		
// 				data[key].country_code = value.country_code;
// 				data[key].phone_no = value.mobile_no;
// 			}
		
// 			data[key].user_full_name = tuserdata[0]?.full_name || '';
// 			data[key].user_email_id = tuserdata[0]?.email_id || '';
		
// 			// Fetch admin user details (assigned to)
// 			const atuserdata = await adminUserModel.findOne(value.assign_to); 

// 			data[key].assign_to_full_name = atuserdata[0]?.full_name || '';
// 			data[key].assign_to_email_id = atuserdata[0]?.email_id || '';
// 			data[key].assign_to_sort_name = atuserdata[0]?.sort_name || '';
		
// 			// Fetch admin user details (assigned by)
// 			const attuserdata = await adminUserModel.findOne(value.assigned_by); 

// 			data[key].assigned_by_full_name = attuserdata[0]?.full_name || '';
// 			data[key].assigned_by_email_id = attuserdata[0]?.email_id || '';
// 			data[key].assigned_by_sort_name = attuserdata[0]?.sort_name || '';
// 		}
// 		// console.log("Inbox data",data.length);

// 		if (!_.isEmpty(data)) {
// 			res.status(StatusCodes.OK).send({ message: `${data.length} records found`, data });
// 		} else {
// 			res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found !!" });
// 		}

// 	} catch (e) {
// 		console.log(`Error in getAssignedToMeData`, e);
// 		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
// 	}
// }
exports.getAssignedToMeData = async (req, res, next) => {
    try {
        const { assign_to, limit, offset } = req.body; // Get `assign_to` from request body

        // Fetch admin user details (assigned user)
        const adminUserData = await adminUserModel.findOne(assign_to);  // Using `assign_to` for user details

        // Check if adminUserData is found
        if (!adminUserData || !adminUserData[0]) {
            return res.status(404).send({ message: "Assigned user not found." });
        }

        // Get location from the admin user data
        const user_location = adminUserData[0].user_location;

        // Fetch the assigned appointments
        const data = await model.getAssignedAppointments(assign_to, user_location, parseInt(limit), parseInt(offset));

        // Process the data (same as before)
        for (const key in data) {
            const value = data[key];

            // Fetch user details
            const tuserdata = await userModel.findOne(value.user_id);
            if (value.toa !== 'offline') {
                data[key].toa = 'online';
            } else {
                data[key].toa = 'In-Person';
            }

            if (value.for_ap === 'me') {
                data[key].full_name = tuserdata[0]?.full_name || '';
                data[key].photo = tuserdata[0]?.photo || '';
                data[key].designation = tuserdata[0]?.designation || '';
                data[key].ref_name = value.ref_name;
                data[key].ref_country_code = value.ref_country_code;
                data[key].ref_mobile_no = value.ref_mobile_no;
                data[key].country_code = tuserdata[0]?.country_code || '';
                data[key].phone_no = tuserdata[0]?.phone_no || '';
            } else {
                data[key].full_name = value.full_name;
                data[key].photo = value.picture;
                data[key].designation = value.designation;
                data[key].ref_name = tuserdata[0]?.full_name || '';
                data[key].ref_country_code = tuserdata[0]?.country_code || '';
                data[key].ref_mobile_no = tuserdata[0]?.phone_no || '';
                data[key].country_code = value.country_code;
                data[key].phone_no = value.mobile_no;
            }

            data[key].user_full_name = tuserdata[0]?.full_name || '';
            data[key].user_email_id = tuserdata[0]?.email_id || '';

            // Fetch admin user details (assigned to)
            const atuserdata = await adminUserModel.findOne(value.assign_to);
            data[key].assign_to_full_name = atuserdata[0]?.full_name || '';
            data[key].assign_to_email_id = atuserdata[0]?.email_id || '';
            data[key].assign_to_sort_name = atuserdata[0]?.sort_name || '';

            // Fetch admin user details (assigned by)
            const attuserdata = await adminUserModel.findOne(value.assigned_by);
            data[key].assigned_by_full_name = attuserdata[0]?.full_name || '';
            data[key].assigned_by_email_id = attuserdata[0]?.email_id || '';
            data[key].assigned_by_sort_name = attuserdata[0]?.sort_name || '';
        }

        // Return response
        if (!_.isEmpty(data)) {
            res.status(StatusCodes.OK).send({ message: `${data.length} records found`, data });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found !!" });
        }

    } catch (e) {
        console.log(`Error in getAssignedToMeData`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
}

// Divya --added on 28 Dec 2024
exports.getndateAppointments = async (req, res, next) => {
	try {
		// console.log("req",req.params);
		const { user_id, datestring } = req.params; 

		// Fetch admin user details (logged in user)
        const adminUserData = await adminUserModel.findOne(user_id);  // Using `user_id` for admin details
		// console.log("adminUserData",adminUserData);

		const show_appts_of = adminUserData[0].show_appts_of;
		const user_location = adminUserData[0].user_location;

		// Fetch the assigned appointments
        const data = await model.getndateAppointments(user_id, show_appts_of, user_location, datestring);
		// console.log("ndate Data",data.length);

		for (const key in data) {
            const value = data[key];

            // Fetch user details
            const tuserdata = await userModel.findOne(value.user_id);
            if (value.toa !== 'offline') {
                data[key].toa = 'online';
            } else {
                data[key].toa = 'In-Person';
            }

            if (value.for_ap === 'me') {
                data[key].full_name = tuserdata[0]?.full_name || '';
                data[key].photo = tuserdata[0]?.photo || '';
				
				data[key].country_code = tuserdata[0]?.country_code || '';
                data[key].phone_no = tuserdata[0]?.phone_no || '';
				data[key].email_id = tuserdata[0]?.email_id || '';
                
				data[key].designation = tuserdata[0]?.designation || '';
				data[key].company = tuserdata[0]?.company || '';

                data[key].ref_name = value.ref_name;
                data[key].ref_country_code = value.ref_country_code;
                data[key].ref_mobile_no = value.ref_mobile_no;
				data[key].ref_email_id = value.ref_email_id;
            } else {
                data[key].full_name = value.full_name;
                data[key].photo = value.picture;

				data[key].country_code = value.country_code;
                data[key].phone_no = value.mobile_no;
				data[key].email_id = value.email_id;

                data[key].designation = value.designation;
				data[key].company = value.designationcomp;
                
				data[key].ref_name = tuserdata[0]?.full_name || '';
                data[key].ref_country_code = tuserdata[0]?.country_code || '';
                data[key].ref_mobile_no = tuserdata[0]?.phone_no || '';
                data[key].ref_email_id = tuserdata[0]?.email_id || '';
            }

            // Fetch admin user details (assigned to)
            const atuserdata = await adminUserModel.findOne(value.assign_to);
            data[key].assign_to_full_name = atuserdata[0]?.full_name || '';
            data[key].assign_to_email_id = atuserdata[0]?.email_id || '';
            data[key].assign_to_sort_name = atuserdata[0]?.sort_name || '';

            // Fetch admin user details (assigned by)
            const attuserdata = await adminUserModel.findOne(value.assigned_by);
            data[key].assigned_by_full_name = attuserdata[0]?.full_name || '';
            data[key].assigned_by_email_id = attuserdata[0]?.email_id || '';
            data[key].assigned_by_sort_name = attuserdata[0]?.sort_name || '';
        }

		// console.log("ndate Data",data.length);

		const morning_data = [];
		const evening_data = [];
		const night_data = [];
		const tbrs_data = [];
		const done_data = [];
		const sb_data = [];
		const gk_data = [];
		const pb_data = [];

		let morning_users = 0;
		let evening_users = 0;
		let night_users = 0;
		let tbrs_users = 0;
		let done_users = 0;
		let sb_users = 0;
		let gk_users = 0;
		let pb_users = 0;

		for (const key in data) {
            const value = data[key];

			// console.log(value.ap_time);
			const ap_time = new Date(value.ap_time * 1000); // Convert timestamp to Date object
			const time = ap_time.getHours(); // Extract hour in 24-hour format
    		// console.log(ap_time, time);

			if(value.ap_status == "Scheduled"){
				if (time < 16) {
					morning_data.push(value);
					morning_users += value.no_people;
				} else if (time >= 16 && time < 19) {
					evening_data.push(value);
					evening_users += value.no_people;
				} else if (time >= 19 && time < 24) {
					night_data.push(value);
					night_users += value.no_people;
				}
			} else if(value.ap_status == "TB R/S"){
				// Push the value into the array
				tbrs_data.push(value);
				// Increment tbrs_users by the value of 'no_people'
				tbrs_users += value.no_people;
			} else if (value.ap_status = "Done"){
				done_data.push(value);
				done_users += value.no_people;
			} else if (value.ap_status = "SB"){
				sb_data.push(value);
				sb_users += value.no_people;
			} else if (value.ap_status = "GK"){
				gk_data.push(value);
				gk_users += value.no_people;
			} else if (value.ap_status = "PB"){
				pb_data.push(value);
				pb_users += value.no_people;
			}

			
		}

		const app_data = {};

		if (morning_data) {
			app_data.morning_data = morning_data;
		}

		if (evening_data) {
			app_data.evening_data = evening_data;
		}

		if (night_data) {
			app_data.night_data = night_data;
		}

		if (tbrs_data) {
			app_data.tbrs_data = tbrs_data;
		}

		if (done_data) {
			app_data.done_data = done_data;
		}

		if (sb_data) {
			app_data.sb_data = sb_data;
		}

		if (gk_data) {
			app_data.gk_data = gk_data;
		}

		if (pb_data) {
			app_data.pb_data = pb_data;
		}

		// console.log("app_data",app_data);

		// Return response
        if (!_.isEmpty(app_data)) {
            res.status(StatusCodes.OK).send({ message: `records found`, app_data });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found !!" });
        }

	} catch (e) {
		console.log(`Error in getndateAppointments`, e);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
	}
};

exports.searchByDate = async (req, res, next) => {
    try {
        const { from_date, to_date } = req.body; // Extract from_date and to_date from the request body

        // Validate date format
        const startDate = new Date(from_date);
        const endDate = new Date(to_date);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(StatusCodes.BAD_REQUEST).send({
                message: "Invalid date format. Please use YYYY-MM-DD format."
            });
        }

        // Call the model method to fetch appointments within the date range
        const data = await model.getAppointmentsByDateRange(startDate, endDate);

        if (!_.isEmpty(data)) {
            res.status(StatusCodes.OK).send(data);
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found for the specified date range." });
        }
    } catch (e) {
        console.log(`Error in searchByDate`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.getAllAppointments = async (req, res, next) => {
    try {
        const appointments = await model.getAllAppointments(); // Call the model method to get all appointments
        if (!_.isEmpty(appointments)) {
            res.status(StatusCodes.OK).send({ message: `${appointments.length} records found`, appointments });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No appointments found." });
        }
    } catch (e) {
        console.log(`Error in getAllAppointments`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};


// controllers/appointment_request.js
exports.getUpcomingAppointmentsAndHistory = async (req, res, next) => {
    try {
        const { user_id, assign_to } = req.params;
        const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format

        // Fetch upcoming appointments
        const upcomingAppointments = await model.getUpcomingAppointmentsByDate(today, assign_to);
        
        // Fetch appointment history
        const appointmentHistory = await model.getUserAppointmentsHistory(user_id);

        res.status(StatusCodes.OK).send({
            message: "Upcoming appointments and appointment history retrieved successfully",
            upcomingAppointments,
            appointmentHistory
        });
    } catch (e) {
        console.log(`Error in getUpcomingAppointmentsAndHistory`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

exports.getAppointmentInfo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const appointment = await model.getAppointmentInfoById(id);

        if (appointment) {
            res.status(StatusCodes.OK).send({
                message: "Appointment information retrieved successfully",
                code: StatusCodes.OK,
                success: true,
                data: appointment
            });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({
                message: "Appointment not found"
            });
        }
    } catch (e) {
        console.error('Error in getAppointmentInfo:', e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            message: e.message
        });
    }
};

exports.getAppointmentByIdOrName = async (req, res, next) => {
    try {
        const { ap_id, full_name } = req.body; 

        const appointmentData = await model.findByIdOrName(ap_id, full_name);

        if (!_.isEmpty(appointmentData)) {
            res.status(StatusCodes.OK).send({
                message: "Appointment details retrieved successfully",
                code: StatusCodes.OK,
                success: true,
                count: appointmentData.length,
                appointments: appointmentData 
            });
        } else {
            res.status(StatusCodes.NOT_FOUND).send({ message: "No appointment found with this ID or name." });
        }
    } catch (e) {
        console.log(`Error in getAppointmentByIdOrName`, e);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

