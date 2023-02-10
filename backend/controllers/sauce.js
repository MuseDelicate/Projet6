const Sauce = require('../models/Sauce');

// le "file system" nous permet de gérer des systmes de fichiers (et donc supprimer des fichiers)
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    // le corps de la requête est un objet sauce converti en chaîne, on le converti en JSON pour l'utiliser
    let sauceObject = JSON.parse(req.body.sauce);
    // on va utiliser le userId qui vient du token d'authentification donc on ne fait pas confiance à celui envoyé par le client
    delete sauceObject._userId;
    let sauce = new Sauce({
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
    // puis on enregistre la sauce
    sauce.save()
        .then(() => {
            res.status(201).json({ message: 'Sauce enregistrée !' });
        })
        .catch(error => {
            res.status(400).json({ error });
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

exports.modifySauce = async(req, res, next) => {
    // on regarde s'il y a une image dans la requête.
    const sauceObject = req.file ? {
        // si oui, on parse l'image pour la traiter
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
            // si non, on traite simplement l'objet entrant
    } : {...req.body };
    delete sauceObject._userId;
    // puis on met à jour la sauce avec les nouvelles informations transmises dans la requête
    await Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({ message: "Cette action n'est pas autorisée" });
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
    // on commence par récupérer la sauce à supprimer de la base de donnée
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            // on vérifie que l'utilisateur voulant supprimer la sauce soit bien celui qui l'a créée
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: "Cette action n'est pas autorisée" });
            } else {
                // on récupère le nom du fichier image pour pouvoir le supprimer du système de fichier avec unlink
                const filename = sauce.imageUrl.split('/images/')[1];
                // La suppression est asynchrone donc appelle un callback
                fs.unlink(`images/${filename}`, () => {
                    // une fois supprimée du système de fichier, on peut supprimer de la base de donnée
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: "Sauce supprimée !" }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

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