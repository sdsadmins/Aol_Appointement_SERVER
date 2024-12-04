const express = require('express');
const checkAuth = require('../../middleware/jwtVerify');
const controller = require('../../controllers/users_reg');
const bodyValidator = require("../../middleware/bodyValidator");
const createDto = require('../../dto/users_reg.dto');
const Admincontroller = require('../../controllers/admin_users');
// const s = require('../dto/admin_users.dto');
// const { login } = require('../../controllers/auth/authController');
// const { user_register } = require('../../controllers/auth/authController');
const router = express.Router();

router.get('/', checkAuth, controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);



router.get('/', checkAuth, Admincontroller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), Admincontroller.create);
// router.post('/login', login);
// router.post('/user_register', user_register);

// router.post

module.exports = router;
