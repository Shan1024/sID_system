// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var chalk = require('chalk');
var defaultValues = require("../../config/defaultValues");

var Entry = require('./entry');
var Claim = require('./claim');
var FacebookRatedByMe = require('./facebookRatedByMe');
var LinkedInRatedByMe = require('./linkedinRatedByMe');
var Facebook = require('./facebook');
var LinkedIn = require('./linkedin');

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
            ref: 'Entry'
        }],
        claims: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Claim'
        }],
        weight: {
            type: Number,
            default: defaultValues.weights.averageUser
        },
        score: {
            type: Number,
            default: 0
        },
        overallRatingLevel: Number
    },
    linkedin: {
        ratedByMe: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LinkedInRatedByMe'
        }],
        ratedByOthers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Entry'
        }],
        claims: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Claim'
        }],
        weight: {
            type: Number,
            default: defaultValues.weights.averageUser
        },
        score: {
            type: Number,
            default: 0
        },
        overallRatingLevel: Number
    }
});

userSchema.methods.setOverallFacebookRating = function () {
    if (!this.facebook.score) {
        this.facebook.overallRatingLevel = defaultValues.ratings.averageUser;
    } else {
        if (this.facebook.score >= defaultValues.bounds.overall.trusted) {
            this.facebook.overallRatingLevel = defaultValues.ratings.trustedUser;
        } else if (this.facebook.score < defaultValues.bounds.overall.untrusted) {
            this.facebook.overallRatingLevel = defaultValues.ratings.untrustedUser;
        } else {
            this.facebook.overallRatingLevel = defaultValues.ratings.averageUser;
        }
    }
};

userSchema.methods.setOverallLinkedInRating = function () {
    if (!this.linkedin.score) {
        this.linkedin.overallRatingLevel = defaultValues.ratings.averageUser;
    } else {
        if (this.linkedin.score >= defaultValues.bounds.overall.trusted) {
            this.linkedin.overallRatingLevel = defaultValues.ratings.trustedUser;
        } else if (this.linkedin.score < defaultValues.bounds.overall.untrusted) {
            this.linkedin.overallRatingLevel = defaultValues.ratings.untrustedUser;
        } else {
            this.linkedin.overallRatingLevel = defaultValues.ratings.averageUser;
        }
    }
};


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
