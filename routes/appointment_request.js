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
router.get('/usersData/:user_id', checkAuth, controller.getUserAppointments);
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
router.post('/deleteAppt/:user_id', checkAuth, controller.deleteAppointment);
router.get('/tomorrowAppointments/:id', checkAuth, controller.getTomorrowsAppointments);
router.get('/todayAppointments/:id', controller.getTodayAppointments);
router.get('/upcomingAppointmentsByDate/:date', checkAuth, controller.getUpcomingAppointmentsByDate);
router.post('/get_right_nav_count/:user_id', checkAuth, controller.getRightNavCount);
router.get('/appointmentsByLocation/:location_id', checkAuth, controller.getAppointmentsByLocation);
router.get('/appointment/:id', checkAuth, controller.getAppointmentById);
router.post('/send-more-info-email', checkAuth, controller.sendMoreInfoEmail);
router.get('/get-starred-appointment-details', checkAuth, controller.getStarredAppointmentDetails);


router.post('/filter_by_assigned_status', checkAuth, controller.filterAppointmentsByAssignedStatus);
router.post('/addnewappointment_admin', checkAuth, controller.addNewAppointmentAdmin);

module.exports = router;
