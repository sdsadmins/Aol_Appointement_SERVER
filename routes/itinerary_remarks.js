const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/itinerary_remarks');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/itinerary_remarks.dto');
const router = express.Router();

router.get('/', checkAuth, controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:remarks_id', checkAuth, controller.getOne);
router.put('/:remarks_id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:remarks_id', checkAuth, controller.update);
router.delete('/:remarks_id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);

module.exports = router;
