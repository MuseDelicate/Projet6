const express = require('express');

// création d'un routeur Express qui enregistrera chaque route du parcours sauce
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const sauceCtrl = require('../controllers/sauce');

// le middleware auth vérifie que l'utilisateur est bien connecté (ses informations d'authentification sont transmises aux différentes requêtes)
// le middleware multer permet de capturer les fichiers envoyés dans une requête HTTP
router.get('/', auth, sauceCtrl.getAllSauces);
router.get('/:id', auth, sauceCtrl.getOneSauce);
router.post('/', auth, multer, sauceCtrl.createSauce);
router.put('/:id', auth, multer, sauceCtrl.modifySauce);
router.delete('/:id', auth, sauceCtrl.deleteSauce);
router.post('/:id/like', auth, sauceCtrl.likeSauce);

module.exports = router;