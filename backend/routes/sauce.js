const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const sauceCtrl = require('../controllers/sauce');

//router.get('/', auth, sauceCtrl.getAllSauces);
//router.get('/:id', auth, sauceCtrl.getOneSauce);
router.post('/', auth, sauceCtrl.createSauce);
//router.put('/:id', auth, sauceCtrl.modifySauce);
//router.delete('/:id', auth, sauceCtrl.deleteSauce);
//router.post('/:id/like', auth, sauceCtrl.likeSauce);

module.exports = router;