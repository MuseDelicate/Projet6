const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// ce package fera remonter dans la console les erreurs de la base de donnée distante
const mongoError = require('mongoose-errors');

// on créé le modèle que doit avoir un user
const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// on ajoute les plugin au modèle défini
userSchema.plugin(uniqueValidator);
userSchema.plugin(mongoError);

module.exports = mongoose.model('User', userSchema);