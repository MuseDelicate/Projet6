const res = require('express/lib/response');
const Sauce = require('../models/Sauce');
// le "file system" nous permet de gérer des systmes de fichiers (et donc supprimer des fichiers)
const fs = require('fs');
const req = require('express/lib/request');
const { json } = require('express/lib/response');


exports.createSauce = (req, res, next) => {
    let sauceObject = JSON.parse(req.body.sauce);
    console.log(sauceObject);
    // on va utiliser le userId qui vient du token d'authentification donc on ne fait pas confiance à celui envoyé par le client
    delete sauceObject._userId;
    // On créé une nouvelle instance du modèle 'Sauce'
    let sauce = new Sauce({
        // on récupère le userId en utilisant le token d'authentification
        userId: req.auth.userId,
        name: sauceObject.name,
        manufacturer: sauceObject.manufacturer,
        description: sauceObject.description,
        mainPepper: sauceObject.mainPepper,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        heat: sauceObject.heat,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: [],
    });
    console.log(sauce);
    sauce.save()
        .then(() => {
            res.status(201).json({ message: 'Sauce enregistrée !' });
            console.log('Sauce enregistrée !');
        })
        .catch(error => {
            res.status(400).json({ error });
            console.log(error);
        });
};

exports.getOneSauce = (req, res, next) => {
    console.log(req.params.id);
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

exports.modifySauce = async(req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body };
    // supprimer les images non utilisées sur le serveur si l'image a été modifiée
    // voir ce qui est dans la requête (le body) pour voir ce qui est modifié
    delete sauceObject._userId;
    await Sauce.findOne({ _id: req.params.id })
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

exports.deleteSauce = async(req, res, next) => {
    // on commence par récupérer l'objet à supprimer de la base de donnée
    await Sauce.findOne({ _id: req.params.id })
        // ce qui nous retourne une promesse
        .then((sauce) => {
            // on vérifie que l'utilisateur voulant supprimer la sauce soit bien celui qui l'a créée
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: "Cette action n'est pas autorisée" });
            } else {
                // on récupère le nom du fichier image pour pouvoir le supprimer avec unlink (fonction asynchrone) ...
                const filename = sauce.imageUrl.split('/images/')[1];
                // une fois supprimée de la base de donnée, on peut supprimer sur le serveur
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => {
                        fs.unlink(`images/${filename}`, () => {
                            res.status(200).json({ message: "Sauce supprimée !" });
                        })
                    })
                    .catch(error => {
                        res.status(400).json({ error });
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

exports.likeSauce = async(req, res, next) => {
    const sauceObject = req.body;
    const like = sauceObject.like;
    const userId = sauceObject.userId;

    // on commence par récupérer la sauce
    await Sauce.findOne({
            _id: req.params.id
        })
        .then((sauce) => {
            // on définit un objet contenant les champs qu'il faudra mettre à jour selon le like ou dislike
            let actualLike = {
                likes: sauce.likes,
                dislikes: sauce.dislikes,
                usersLiked: sauce.usersLiked,
                usersDisliked: sauce.usersDisliked
            };

            // on regarde la valeur de like envoyée par le serveur
            switch (like) {
                case 1: // l'utilisateur a liké la sauce
                    if (!actualLike.usersLiked.includes(userId)) {
                        // on vérifie que l'utilisateur n'ait pas déjà liké la sauce
                        // si non, on ajoute son id au tableau usersLiked
                        actualLike.usersLiked.push(userId);
                    }
                    break;
                case -1:
                    // l'utilisateur a disliké la sauce
                    if (!actualLike.usersDisliked.includes(userId)) {
                        // on vérifie que l'utilisateur n'ait pas déjà liké la sauce
                        // si non, on ajoute son id au tableau usersLiked
                        actualLike.usersDisliked.push(userId);
                    }
                    break;
                case 0:
                    // l'utilisateur a annulé son like ou son dislike
                    // si son id est dans le tableau usersLiked, c'est qu'il avait déjà liké la sauce
                    if (actualLike.usersLiked.includes(userId)) {
                        // on supprime cet id du tableau usersLiked
                        const index = actualLike.usersLiked.indexOf(userId);
                        actualLike.usersLiked.splice(index, 1);
                    } else {
                        // sinon c'est qu'il est dans usersDisliked
                        const index = actualLike.usersDisliked.indexOf(userId);
                        actualLike.usersDisliked.splice(index, 1);
                    }
                    break;
                default:
                    break;
            }
            //La longueur de usersLiked ou usersDisliked correspond au nombre de user ayant liké ou disliké la sauce
            actualLike.likes = actualLike.usersLiked.length;
            actualLike.dislikes = actualLike.usersDisliked.length;

            // on met à jour la sauce avec ces nouvelles valeurs
            Sauce.updateOne({ _id: req.params.id }, actualLike)
                .then(() => {
                    res.status(201).json({ message: "Note prise en compte !" })
                })
                .catch((error) => {
                    res.status(400).json({ error })
                });

        })
        .catch((error) => {
            res.json({ error })
        });


}