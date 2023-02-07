const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// fera remonter dans la console les erreurs de la bdd distante
const mongoError = require('mongoose-errors');

const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

userSchema.plugin(uniqueValidator);
userSchema.plugin(mongoError);

module.exports = mongoose.model('User', userSchema);