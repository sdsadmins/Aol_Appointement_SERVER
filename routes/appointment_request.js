const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/appointment_request');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/appointment_request.dto');
const router = express.Router();

// router.get('/', checkAuth, controller.getAll);
// router.post('/', checkAuth, bodyValidator(createDto), controller.create);
// router.get('/:id', checkAuth, controller.getOne);
// router.put('/:id', checkAuth, updateValidator(createDto), controller.update);    
// router.patch('/:id', checkAuth, controller.update);
// router.delete('/:id', checkAuth, controller.remove);
router.post('/appointmentform/:user_id', checkAuth, controller.submitSelfAppointment);
router.get('/search/:searchKey', checkAuth, controller.search);
router.get('/usersData/:assign_to', checkAuth, controller.getUserAppointments);
router.post('/getLastSecretary', checkAuth, controller.getLastSecretary);
router.post('/appointmentforOther/:user_id', checkAuth, controller.submitGuestAppointment);
router.get('/usersHistory/:user_id/:email_id', checkAuth, controller.getUserHistory);
router.get('/single_appointment_details/:id', checkAuth, controller.getSingleAppointmentDetails);
router.post('/change_check_in_status', checkAuth, controller.changeCheckInStatus);
router.post('/update_appointment/:user_id', checkAuth, controller.updateAppointment);
router.post('/make_appointment_done', checkAuth, controller.makeAppointmentDone);
router.post('/make_undone', checkAuth, controller.makeAppointmentUndone);
router.post('/more_info_appointment/:user_id', checkAuth, controller.moreInfoAppointment);
router.get('/restore_appointment/:ap_id', checkAuth, controller.restoreAppointment);
router.post('/deleteAppointment/:ap_id', checkAuth, controller.deleteAppointment);
router.get('/getAppointmentTomorrow/:assign_to/:location_id', checkAuth, controller.getTomorrowsAppointmentsData);

router.get('/todayAppointments/:assign_to/:location_id/:date', checkAuth, controller.getTodayAppointments);
router.get('/getndateAppointments/:user_id/:datestring', checkAuth, controller.getndateAppointments);  // Divya --added on 28 Dec 2024

router.get('/upcomingAppointmentsByDate/:date', checkAuth, controller.getUpcomingAppointmentsByDate);
router.post('/get_right_nav_count/:user_id', checkAuth, controller.getRightNavCount);

router.get('/upcomingAppointmentsByMonthYear', checkAuth, controller.getUpcomingAppointmentsByMonthYear);


router.get('/appointmentsByLocation/:location_id', checkAuth, controller.getAppointmentsByLocation);
router.post('/getInboxData', checkAuth, controller.getInboxData);   // Divya --added on 23 Dec 2024
router.post('/getAssignedToMeData', checkAuth, controller.getAssignedToMeData);   // Divya --added on 24 Dec 2024


router.get('/appointment/:id', checkAuth, controller.getAppointmentById);
router.post('/send-more-info-email', checkAuth, controller.sendMoreInfoEmail);
router.get('/get-starred-appointment-details', checkAuth, controller.getStarredAppointmentDetails);
router.post('/filter_by_assigned_status', checkAuth, controller.filterAppointmentsByAssignedStatus);
router.post('/mark_as_deleted', checkAuth, controller.markAppointmentAsDeleted);
router.post('/addnewappointment_admin', checkAuth, controller.addNewAppointmentAdmin);
router.post('/changeAppointmentStatus/:ap_id', checkAuth, controller.changeAppointmentStatus);
router.post('/doneAppointments', checkAuth, controller.getDoneAppointments);
router.get('/deletedAppointments', checkAuth, controller.getDeletedAppointments);
router.post('/mark_multiple_as_deleted', checkAuth, controller.markMultipleAsDeleted);
router.post('/updateAssignToFill/:ap_id', checkAuth, controller.updateAssignToFill);
router.put('/updateAppointmentAdmin/:ap_id', checkAuth, controller.updateAppointmentAdmin);
router.post('/change_appointment_star', checkAuth, controller.changeAppointmentStar);


router.post('/schedule_appointment', controller.schedule_appointment);
router.get('/appointmentsByDate/:assign_to?/:datestring', checkAuth, controller.getAppointmentsByDate);

router.post('/searchByDate', checkAuth, controller.searchByDate);
router.post('/updateCheckInStatus', checkAuth, controller.updateCheckInStatus);

router.get('/allAppointments', checkAuth, controller.getAllAppointments);

// routes/appointment_request.js
router.get('/upcomingAppointmentsAndHistory/:user_id/:assign_to', checkAuth, controller.getUpcomingAppointmentsAndHistory);

router.get('/appointmentInfo/:id', checkAuth, controller.getAppointmentInfo);

module.exports = router;
