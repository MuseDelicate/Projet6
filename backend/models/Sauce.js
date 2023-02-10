const mongoose = require('mongoose');
const mongoError = require('mongoose-errors');

// Chaque sauce devra respecter ce modèle de sauce
const sauceSchema = mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    description: { type: String, required: true },
    mainPepper: { type: String, required: true },
    imageUrl: { type: String, required: true },
    heat: { type: Number, required: true },
    likes: { type: Number, default: 0, required: false },
    dislikes: { type: Number, default: 0, required: false },
    usersLiked: [{ type: String, required: true }],
    usersDisliked: [{ type: String, required: true }]
});

sauceSchema.plugin(mongoError);

module.exports = mongoose.model('Sauce', sauceSchema);