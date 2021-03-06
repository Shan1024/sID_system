var mongoose = require('mongoose');

var defaultValues = require("../../config/defaultValues");

//Entry schema
var claimSchema = mongoose.Schema({
    claimid: String,
    claim: String,
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
    overallRatingLevel: {
        type: Number,
        default: defaultValues.ratings.averageUser
    }
});

claimSchema.methods.setOverallRating = function () {
    if (!this.score) {
        this.overallRatingLevel = defaultValues.ratings.averageUser;
    } else {
        if (this.score >= defaultValues.bounds.claim.trusted) {
            this.overallRatingLevel = defaultValues.ratings.trustedUser;
        } else if (this.score < defaultValues.bounds.claim.untrusted) {
            this.overallRatingLevel = defaultValues.ratings.untrustedUser;
        } else {
            this.overallRatingLevel = defaultValues.ratings.averageUser;
        }
    }
};

module.exports = mongoose.model('Claim', claimSchema);