const express = require('express');
const checkAuth = require('../middleware/jwtVerify');
const controller = require('../controllers/states');
const bodyValidator = require("../middleware/bodyValidator");
const updateValidator = require("../middleware/updateValidator");
const createDto = require('../dto/states.dto');
const router = express.Router();

router.get('/', controller.getAll);
router.post('/', checkAuth, bodyValidator(createDto), controller.create);
router.get('/:id', checkAuth, controller.getOne);
router.put('/:id', checkAuth, updateValidator(createDto), controller.update);
router.patch('/:id', checkAuth, controller.update);
router.delete('/:id', checkAuth, controller.remove);
router.get('/search/:searchKey', checkAuth, controller.search);
router.get('/statesList/:country_id', checkAuth, controller.getStateByCountryId);

module.exports = router;
