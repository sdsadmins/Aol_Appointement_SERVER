const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/admin_users');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/admin_users.dto');
const router = express.Router();

router.get('/', checkAuth, controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:id', checkAuth, controller.getOne);
router.put('/:id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:id', checkAuth, controller.update);
router.delete('/:id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);
router.post('/decryptAndUpdateSingleAdmin', controller.decryptAndUpdateSingleAdmin);
router.post('/adminLogin', controller.adminLogin);
router.post('/change-password/:user_id', checkAuth, controller.adminUserChangePassword);

module.exports = router;
