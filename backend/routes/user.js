const express = require('express');

// création d'un routeur Express qui enregistrera chaque route du parcours user
const router = express.Router();

const userCtrl = require('../controllers/user');

router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;