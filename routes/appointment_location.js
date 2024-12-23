const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/appointment_location');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/appointment_location.dto');
const router = express.Router();

router.get('/',  controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:id', checkAuth, controller.getOne);
router.put('/:id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:id', checkAuth, controller.update);
router.delete('/:id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);
router.get('/todayAppointments/:user_id/:location_id', checkAuth, controller.getTodayAppointments);
// added on 23 Dec 2024
router.get('/getAppointmentLocation/:user_id', checkAuth, controller.getAppointmentLocation);

module.exports = router;
