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
        ...sauceObject,
        // on récupère le userId en utilisant le token d'authentification
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
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

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body };
    // supprimer les images non utilisées sur le serveur si l'image a été modifiée
    // voir ce qui est dans la requête (le body) pour voir ce qui est modifié
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

// JSON.parse car le front envoie la requête au format json
// faire un console.log de req.body pour voir ce qu'il contient
exports.likeSauce = (req, res, next) => {
    console.log('req.body :')
    console.log(req.body);

    // on commence par récupérer la sauce
    Sauce.findOne({
            _id: req.params.id
        })
        .then((sauce) => {
            // l'utilisateur a liké la sauce
            if (req.body.like === 1) {
                console.log(`likée par ${req.body.userId} !`);
                console.log(sauce);

                // tester si le userId existe dans le tableau, ce qui fait 2 conditions :
                if (sauce.usersLiked.includes(req.body.userId)) {
                    // si le user est déjà dans le tableau, il a déjà liké la saucé précédemment
                    // donc il ne peut pas liker la même sauce plusieurs fois
                    res.status(401).json({ error: "Impossible de liker de nouveau !" });
                } else {
                    // le user n'est pas dans le tableau des users ayant déjà liké la sauce
                    sauce.usersLiked.push(req.body.userId);

                    //la fonction array.push renvoie la longueur du nouveau tableau (c'est le nombre de likes mis à jour)
                    Sauce.updateOne({ _id: req.params.id }, { likes: sauce.usersLiked.length, usersLiked: sauce.usersLiked })
                        .then(() => {
                            console.log(sauce);
                            res.status(201).json({ message: "Like pris en compte" })
                        })
                        .catch((error) => res.status(500).json({ error }));
                }
            }
            if (req.body.like === -1) {
                console.log(`dislikée par ${req.body.userId} !`);
                console.log(sauce);

                // tester si le userId existe dans le tableau, ce qui fait 2 conditions :
                if (sauce.usersDisliked.includes(req.body.userId)) {
                    // si le user est déjà dans le tableau, il a déjà disliké la sauce précédemment
                    // donc il ne peut pas disliker la même sauce plusieurs fois
                    res.status(401).json({ error: "Impossible de disliker de nouveau !" });
                } else {
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: 1 }, $push: { usersDisliked: req.body.userId } })
                        .then(() => {
                            console.log(sauce);
                            res.status(201).json({ message: "Dislike pris en compte" })
                        })
                        .catch((error) => res.status(500).json({ error }));
                }
            }
            if (req.body.like === 0) {
                if (sauce.usersLiked.includes(req.body.userId)) {
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: -1 }, $pull: { usersLiked: req.body.userId } })
                        .then(() => {
                            res.status(200).json({ message: "Annulation du like" });
                        })
                        .catch((error) => res.status(500).json({ error }));
                }
            } else if (sauce.usersDisliked.includes(req.body.userId)) {
                Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: -1 }, $pull: { usersDisliked: req.body.userId } })
                    .then(() => {
                        res.status(200).json({ message: "Annulation du dislike" });
                    })
                    .catch((error) => res.status(500).json({ error }));

            } else {
                res.status(500).json({ error: "on est perdus !" });
            }



        })
        .catch((error) => res.status(404).json({ error: "sauce non trouvée" }));
}