const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/phone_country_code');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/phone_country_code.dto');
const router = express.Router();

router.get('/', controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:id', checkAuth, controller.getOne);
router.put('/:id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:id', checkAuth, controller.update);
router.delete('/:id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);

module.exports = router;
