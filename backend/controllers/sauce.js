const res = require('express/lib/response');
const Sauce = require('../models/Sauce');
// le "file system" nous permet de gérer des systmes de fichiers (et donc supprimer des fichiers)
const fs = require('fs');
const req = require('express/lib/request');
const { json } = require('express/lib/response');


exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    // notre id sera généré automatiquement par la base de donnée
    delete sauceObject._id;
    // on va utiliser le userId qui vient du token d'authentification donc on ne fait pas confiance à celui envoyé par le client
    delete sauceObject._userId;
    // On créé une nouvelle instance du modèle 'Sauce'
    const sauce = new Sauce({
        ...sauceObject,
        // on génère un userId en utilisant le token d'authentification
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => {
            res.status(201).json({ message: 'Sauce enregistrée !' });
            console.log('Sauce enregistrée !');
        })
        .catch(error => {
            res.status(400).json({ error });
            console.log('Erreur');
        });
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({
            _id: req.params.id
        })
        .then((sauce) => {
            res.status(200).json(sauce);
        })
        .catch((error) => {
            res.status(400).json({ error });
        })
}

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body };

    delete sauceObject._userId;
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: "Cette action n'est pas autorisée" });
            } else {
                Sauce.updateOne({ _id: req.params.id }, {...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Cette sauce a bien été modifiée !' }))
                    .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.deleteSauce = (req, res, next) => {
    // on commence par récupérer l'objet à supprimer de la base de donnée, ce qui nous retourne une promesse
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            // on vérifie que l'utilisateur voulant supprimer la sauce soit bien celui qui l'a créée
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: "Cette action n'est pas autorisée" });
            } else {
                // on récupère le nom du fichier image pour pouvoir le supprimer avec unlink (fonction asynchrone) ...
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    // ... et on exécute le callback qui supprimera la sauce de la base de donnée
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => {
                            res.status(200).json({ message: "Sauce supprimée !" });
                        })
                        .catch(error => {
                            res.status(400).json({ error });
                        })
                })
            }
        })
        .catch((error) => {
            res.status(500).json({ error });
        })
}

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }))
};

exports.likeSauce = (req, res, next) => {
    // on commence par récupérer la sauce
    Sauce.findOne({
            _id: req.params.id
        })
        .then((sauce) => {
            res.status(200).json(sauce);
            //L'utilisateur ne peut pas liker ou disliker ses propres sauces
            if (userId === req.params.id) {
                res.status(401).json({ message: "Vous ne pouvez pas noter vos propres sauces !" });
            } else {
                if (req.params.like === 1) {
                    sauce.updateOne({ _id: req.params.id }, {...req.body, _id: req.params.id })
                        .then((sauce) => {
                            sauce.likes++;
                            sauce.usersLiked.push(req.body.userId);
                            res.status(201).json({ message: "Note prise en compte" })
                        })
                        .catch((error) => res.status(500).json({ error }));
                } else if (req.params.like === -1) {
                    sauce.updateOne({ _id: req.params.id }, {...req.body, _id: req.params.id })
                        .then((sauce) => {
                            sauce.dislikes++;
                            sauce.usersDisliked.push(req.body.userId);
                            res.status(201).json({ message: "Note prise en compte" })
                        })
                        .catch((error) => res.status(500).json({ error }));
                    // c'est donc que le statut like est à 0, il reste 2 conditions : le user avait liké, ou disliké la sauce
                } else {
                    if (sauce.usersLiked.includes(req.body.userId)) {
                        sauce.updateOne({ _id: req.params.id }, {...req.body, _id: req.params.id })
                            .then((sauce) => {
                                sauce.likes--;
                                // on retire le nom du user du tableau usersLiked

                            })
                            .catch((error) => res.status(500).json({ error }));

                    } else if (sauce.usersDisliked.includes(req.body.userId)) {
                        sauce.updateOne({ _id: req.params.id }, {...req.body, _id: req.params.id })
                            .then((sauce) => {
                                sauce.dislikes--;
                                // on retire le nom du user du tableau usersDisliked

                            })
                            .catch((error) => res.status(500).json({ error }));

                    } else {
                        res.status(500).json({ error })
                    }

                }

            }

        })
        .catch((error) => res.status(404).json({ message: "Sauce non trouvee !" }))


    if (req.body.like === -1) {

    }

}

/*

//Lorsqu'un utilisateur like ou dislike une sauce, son id doit être ajouté ou retiré du tableau like ou dislike

*/