const Sauce = require('../models/Sauce');

exports.createSauce = (req, res, next) => {
    const sauce = new Sauce({
        name: req.body.name,
        manufacturer: req.body.manufacturer,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        mainPepperIngredient: req.body.mainPepperIngredient,
        heat: req.body.heat,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: [],
        userId: req.body.userId
    });
    sauce.save().then(
        () => {
            res.status(201).json({
                message: 'Sauce enregistrée !'
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};