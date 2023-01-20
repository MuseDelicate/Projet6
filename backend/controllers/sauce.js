const Sauce = require('../models/Sauce');


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
    const sauce = new Sauce({
        _id: req.params.id,
        title: req.body.title,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        price: req.body.price,
        userId: req.body.userId
    });
    Sauce.updateOne({ _id: req.params.id }, sauce)
        .then(
            () => {
                res.status(201).json({
                    message: 'Cette sauce a bien été mise à jour !'
                });
            })
        .catch(
            (error) => {
                res.status(400).json({
                    error
                });
            }
        );
}

exports.deleteSauce = (req, res, next) => {
    Sauce.deleteOne({ _id: req.params.id })
        .then(() => {
            res.status(200).json({ message: "Sauce supprimée !" });
        })
        .catch(error => {
            res.status(400).json({ error });
        })
}

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }))
};