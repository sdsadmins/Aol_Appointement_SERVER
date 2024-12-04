const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/appointment_request');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/appointment_request.dto');
const router = express.Router();

router.get('/', checkAuth, controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:id', checkAuth, controller.getOne);
router.put('/:id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:id', checkAuth, controller.update);
router.delete('/:id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);
router.get('/usersData/:user_id', controller.getUserAppointments);
router.post('/getLastSecretary', controller.getLastSecretary);

module.exports = router;
