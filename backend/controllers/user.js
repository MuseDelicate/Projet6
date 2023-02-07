const User = require('../models/User');

// module qiu permet de crypter ('hacher' les mots de passe)
const bcrypt = require('bcrypt');

// ce package va créer et vérifier les token d'authentification
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    // le mot de passe sera "haché" 10fois. L'exécution de la fonction sera plus longue mais la hachage plus sécurisé.
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user.save()
                .then(() => res.status(201).json({ message: 'Nouvel utilisateur créé' }))
                .catch(error => res.status(400).json({ error }))
        })
        .catch(error => res.status(500).json({ error }));

};

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'Les informations email et mot de passe fournies ne correspondent pas' });
            }
            // cette méthode permet de comparer le hash (venu du string entré par l'utilisateur) correspond au hash stocké en base de donnée. 
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ message: 'Les informations email et mot de passe fournies ne correspondent pas' });
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign({ userId: user._id },
                            // cette fonction va chiffrer un nouveau token, valable 24h
                            'RANDOM_TOKEN_SECRET', { expiresIn: '24h' }
                            // à modifier en production par une longue chaîne chiffrée aléatoire

                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};