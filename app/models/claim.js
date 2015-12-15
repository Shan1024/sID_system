var mongoose = require('mongoose');

var defaultValues = require("../../config/defaultValues");

//Entry schema
var claimSchema = mongoose.Schema({
    claimid: String,
    myid: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    yes: {
        type: Number,
        default: 0
    },
    no: {
        type: Number,
        default: 0
    },
    notSure: {
        type: Number,
        default: 0
    },
    score: {
        type: Number,
        default: 0
    },
    overallRating: {
        type: Number,
        default: defaultValues.ratings.averageUser
    }
});

claimSchema.methods.setOverallRating = function () {
    if (!this.score) {
        this.overallRating = defaultValues.ratings.averageUser;
    } else {
        if (this.score >= defaultValues.bounds.trustedUser) {
            this.overallRating = defaultValues.ratings.trustedUser;
        } else if (this.score >= defaultValues.bounds.averageUser) {
            this.overallRating = defaultValues.ratings.averageUser;
        } else {
            this.overallRating = defaultValues.ratings.untrustedUser;
        }
    }
};

module.exports = mongoose.model('Claim', claimSchema);