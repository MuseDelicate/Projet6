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
    const sauceObject = req.body;

    // on commence par récupérer la sauce
    Sauce.findOne({
            _id: req.params.id
        })
        .then((sauce) => {
            if (sauceObject.like === 1) { // pas req.body.like mais doit provenir du json
                console.log(`likée par ${req.body.userId} !`);
                console.log(sauce);

                const usersLikedArray = sauce.usersLiked;
                console.log(usersLikedArray);
                const likes = sauce.likes;
                console.log(`Nombre de likes avant mise à jour: ${usersLikedArray.length}`);
                console.log(`Nb likes avant màj (calcul avec le nb de likes) : ${likes}`);

                const rateUser = req.body.userId;

                const checkUser = usersLikedArray.includes(rateUser);
                console.log(`user qui note les sauces : ${rateUser}`);
                console.log(`checkUser : ${checkUser}`);

                // tester si le userId existe dans le tableau, ce qui fait 2 conditions :
                if (checkUser) {
                    console.log(`le user est déjà dans le tableau usersLiked`);
                    res.status(401).json({ error: "Impossible de liker de nouveau !" });
                } else {
                    console.log(`Pas dans le tableau usersLiked :`);
                    console.log(usersLikedArray);
                    console.log(`id du user ayant liké la sauce : ${rateUser}`);

                    const newUsersLikedArray = usersLikedArray.push(rateUser);

                    //la fonction push renvoie la longueur du  nouveau tableau (c'est le nombre de likes mis à jour)
                    console.log(`Nb de likes mis à jour après like du user (calcul avec .length) : ${usersLikedArray.length}`);
                    console.log(`Nb de likes mis à jour après like du user (calcul après .push) : ${newUsersLikedArray}`);
                    console.log(`Nouveau tableau usersLiked :`);
                    console.log(usersLikedArray);

                    sauce.updateOne({ _id: req.params.id }, { likes: newUsersLikedArray /* ne marche pas mieux avec usersLikedArray.length*/ , usersLiked: usersLikedArray })
                        .then(() => {
                            console.log(sauce);
                            // PROBLEME : le nombre de likes reste à 0
                            res.status(201).json({ message: "Note prise en compte" })
                        })
                        .catch((error) => res.status(500).json({ error }));
                }
            }
            if (sauceObject.like === -1) {
                console.log(`dislikée par ${req.body.userId} !`);
                const usersDislikedArray = sauce.usersDisliked;
                console.log(usersDislikedArray);
                const dislikes = sauce.dislikes;
                console.log(`Nombre de dislikes avant mise à jour: ${usersDislikedArray.length}`);
                console.log(`Nb dislikes avant màj (calcul avec le nb de dislikes) : ${dislikes}`);

                const rateUser = req.body.userId;

                const checkUser = usersDislikedArray.includes(rateUser);
                console.log(`user qui note les sauces : ${rateUser}`);
                console.log(`checkUser : ${checkUser}`);

                // tester si le userId existe dans le tableau, ce qui fait 2 conditions :
                if (checkUser) {
                    console.log(`le user est déjà dans le tableau usersLiked`);
                    res.status(401).json({ error: "Impossible de liker de nouveau !" });
                } else {
                    console.log(`Pas dans le tableau usersDisliked :`);
                    console.log(usersDislikedArray);
                    console.log(`id du user ayant disliké la sauce : ${rateUser}`);

                    const newUsersDislikedArray = usersDislikedArray.push(rateUser);

                    //la fonction push renvoie la longueur du  nouveau tableau (c'est le nombre de dislikes mis à jour)
                    console.log(`Nb de dislikes mis à jour après dislike du user (calcul avec .length) : ${usersDislikedArray.length}`);
                    console.log(`Nb de dislikes mis à jour après dislike du user (calcul après .push) : ${newUsersDislikedArray}`);
                    console.log(`Nouveau tableau usersDisliked :`);
                    console.log(usersDislikedArray);

                    sauce.updateOne({ _id: req.params.id }, { dislikes: newUsersDislikedArray /* ne marche pas mieux avec usersDislikedArray.length*/ , usersDisliked: usersDislikedArray })
                        .then(() => {
                            console.log(sauce);
                            // PROBLEME : le nombre de dislikes reste à 0 ?
                            res.status(201).json({ message: "Note prise en compte" })
                        })
                        .catch((error) => res.status(500).json({ error }));
                }


            }
        })
        .catch((error) => res.status(404).json({ error: "sauce non trouvée" }));
}