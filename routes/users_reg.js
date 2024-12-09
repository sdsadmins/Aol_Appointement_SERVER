const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/users_reg');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/users_reg.dto');
const fileUpload = require('express-fileupload');
const router = express.Router();

router.get('/', checkAuth, controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:id', checkAuth, controller.getOne);
router.put('/:id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:id', checkAuth, controller.update);
router.delete('/:id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);
router.post('/change_password/:user_id', checkAuth, controller.changePassword);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/updatePasswordByEmail', controller.updatePasswordByEmail);
router.get('/usersData/:user_id', checkAuth, controller.getUserData);
router.post('/decryptAndUpdateSingleUser', controller.decryptAndUpdateSingleUser);
router.post('/forgotPassword', controller.forgotPassword);
router.put('/updateProfile/:user_id', checkAuth, controller.updateProfile);

module.exports = router;
