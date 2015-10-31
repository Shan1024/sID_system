var mongoose = require('mongoose');

var User = require('./user');

//Facebook schema
var facebookSchema = mongoose.Schema({
    id: String,
    name: String,
    email: String,
    token: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Facebook', facebookSchema);
