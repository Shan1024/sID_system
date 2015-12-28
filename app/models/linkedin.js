var mongoose = require('mongoose');

var User = require('./user');

//LinkedInSchema schema
var linkedinSchema = mongoose.Schema({
    appid: String,
    uid: String,
    name: String,
    email: String,
    token: String,
    url: String,
    photo: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('LinkedIn', linkedinSchema);
