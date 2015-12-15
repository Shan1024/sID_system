var mongoose = require('mongoose');

//Entry schema
var claimSchema = mongoose.Schema({
    claimid: String,
    myid: String,
    score: Number,
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
    overall: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Claim', claimSchema);