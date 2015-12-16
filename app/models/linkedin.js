var mongoose = require('mongoose');

var User = require('./user');

//LinkedInSchema schema
var linkedinSchema = mongoose.Schema({
    id: String,
    name: String,
    email: String,
    token: String,
    url: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('LinkedIn', linkedinSchema);
