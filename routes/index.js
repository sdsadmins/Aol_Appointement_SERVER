const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/jwtVerify.js');
const tokenController = require('../controllers/token');
const uploadController = require('../controllers/upload');

const appointment_tagsRouter = require('./appointment_tags');
const itinerary_listRouter = require('./itinerary_list');
const admin_usersRouter = require('./admin_users');
const offiline_locationsRouter = require('./offiline_locations');
const sms_templatesRouter = require('./sms_templates');
const qr_scan_logsRouter = require('./qr_scan_logs');
const ci_sessionRouter = require('./ci_session');
const zoom_bulkRouter = require('./zoom_bulk');
const countriesRouter = require('./countries');
const statesRouter = require('./states');
const users_regRouter = require('./users_reg');
const darshan_line_requestsRouter = require('./darshan_line_requests');
const itinerary_eventRouter = require('./itinerary_event');
const phone_country_codeRouter = require('./phone_country_code');
const forwarded_req_logRouter = require('./forwarded_req_log');
const email_templateRouter = require('./email_template');
const itinerary_remarksRouter = require('./itinerary_remarks');
const appointment_requestRouter = require('./appointment_request');
const settingsRouter = require('./settings');
const appointment_locationRouter = require('./appointment_location');
const aol_programsRouter = require('./aol_programs');
const sms_templateRouter = require('./sms_template');
const user_tagsRouter = require('./user_tags');
const email_footerRouter = require('./email_footer');
const citiesRouter = require('./cities');
const apex_loginRouter = require('./apex_login');
const loginRouter = require('../routes/auth/login.js');


// router.post('/token', tokenController.authLogin);
router.post('/upload', checkAuth, uploadController.uploadFile);

router.use('/appointment_tags', appointment_tagsRouter);
router.use('/itinerary_list', itinerary_listRouter);
router.use('/admin_users', admin_usersRouter);
router.use('/offiline_locations', offiline_locationsRouter);
router.use('/sms_templates', sms_templatesRouter);
router.use('/qr_scan_logs', qr_scan_logsRouter);
router.use('/ci_session', ci_sessionRouter);
router.use('/zoom_bulk', zoom_bulkRouter);
router.use('/countries', countriesRouter);
router.use('/states', statesRouter);
router.use('/users_reg', users_regRouter);
router.use('/darshan_line_requests', darshan_line_requestsRouter);
router.use('/itinerary_event', itinerary_eventRouter);
router.use('/phone_country_code', phone_country_codeRouter);
router.use('/forwarded_req_log', forwarded_req_logRouter);
router.use('/email_template', email_templateRouter);
router.use('/itinerary_remarks', itinerary_remarksRouter);
router.use('/appointment_request', appointment_requestRouter);
router.use('/settings', settingsRouter);
router.use('/appointment_location', appointment_locationRouter);
router.use('/aol_programs', aol_programsRouter);
router.use('/sms_template', sms_templateRouter);
router.use('/user_tags', user_tagsRouter);
router.use('/email_footer', email_footerRouter);
router.use('/cities', citiesRouter);
router.use('/auth', loginRouter);

// router.use('/schedule_appointment', appointment_requestRouter);

module.exports = router;
