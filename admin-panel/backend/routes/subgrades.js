const express = require('express');
const router = express.Router();
const subgradeController = require('../controllers/subgradeController');

router.get('/', subgradeController.getAllSubgrades);
router.get('/:id', subgradeController.getSubgradeById);
router.post('/', subgradeController.createSubgrade);
router.put('/:id', subgradeController.updateSubgrade);
router.delete('/:id', subgradeController.deleteSubgrade);

module.exports = router;
