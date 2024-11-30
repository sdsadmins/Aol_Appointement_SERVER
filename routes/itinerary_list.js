const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/itinerary_list');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/itinerary_list.dto');
const router = express.Router();

router.get('/', checkAuth, controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:itinerary_id', checkAuth, controller.getOne);
router.put('/:itinerary_id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:itinerary_id', checkAuth, controller.update);
router.delete('/:itinerary_id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);

module.exports = router;
