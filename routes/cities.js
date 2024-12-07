const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/cities');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/cities.dto');
const router = express.Router();

router.get('/', controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:prid', checkAuth, controller.getOne);
router.put('/:prid', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:prid', checkAuth, controller.update);
router.delete('/:prid', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);
router.get('/state/:state_id',  controller.getByState);

module.exports = router;
