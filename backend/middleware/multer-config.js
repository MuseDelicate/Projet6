// multer est un package qui permet de capturer les fichiers envoyés avec une requête HTTP
const multer = require('multer');

// on créée un dictionnaire des différents formats d'image possibles depuis le frontend
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

// objet de configuration pour multer
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        // on dit dans quel dossier on enregistre les images
        callback(null, 'images');
    },
    // génération du nouveau nom (unique avec un timestamp) de fichier à utiliser
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

// on exporte le middleware multer complètement configuré
module.exports = multer({ storage: storage }).single('image');