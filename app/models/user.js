// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var chalk = require('chalk');

var Entry = require('./entry');
var FacebookRatedByMe = require('./facebookRatedByMe');
var Facebook = require('./facebook');
var Facebook = require('./linkedin');

var userSchema = mongoose.Schema({
    userDetails: {
        local: {
            firstname: String,
            lastname: String,
            email: String,
            password: String,
            verified: Boolean
        },
        facebook: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Facebook'
        },
        linkedin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LinkedIn'
        },
        created: {
            type: Date,
            default: Date.now
        }
    },
    facebook: {
        ratedByMe: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FacebookRatedByMe'
        }],
        ratedByOthers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Facebook'
        }]
    },
    linkedin: {}
});

// // set up a mongoose model and pass it using module.exports
// module.exports = mongoose.model('User', new Schema());

// generating a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
    console.log(chalk.yellow('Checking passwords . . .: ' + password));
    return bcrypt.compareSync(password, this.userDetails.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
