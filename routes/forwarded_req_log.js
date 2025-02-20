const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/forwarded_req_log');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/forwarded_req_log.dto');
const router = express.Router();

router.get('/', checkAuth, controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:id', checkAuth, controller.getOne);
router.put('/:id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:id', checkAuth, controller.update);
router.delete('/:id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);

module.exports = router;
