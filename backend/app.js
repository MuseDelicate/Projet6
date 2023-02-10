// on appelle le fichier .env qui contient les informations de sécurité, ici il y a la
// variable MONGO-LINK, qui permet la connection à la base de données.
const dotenv = require('dotenv');
dotenv.config();

// module qui permet de construire un serveur node.js plus facilement
const express = require('express');

// import de mongoose, qui facilite les interactions avec la base de donnée MongoDB (NoSQL)
const mongoose = require('mongoose');

// Express est un framework basé sur Node, il permet
const app = express();

// pour accéder au path du serveur
const path = require('path');

const userRoutes = require('./routes/user');
const sauceRoutes = require('./routes/sauce');

// connection à la base de donnée
mongoose.connect(process.env.MONGO_LINK, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

// Nous permet d'accéder au corps de la requête json
app.use(express.json());

// ce module permet d'éviter l'importation de req, res et json
app.use(express.urlencoded({ extended: true }));

// Ce middleware va éviter les erreurs de CORS (système de sécurité qui bloque les appels HTTP entre des serveurs différents)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// gestionnaire de routage des images, de manière statique
app.use('/images', express.static(path.join(__dirname, 'images')));

// enregistrement du routeur pour toutes les demandes envoyées vers api/auth et api/sauces
app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);

module.exports = app;