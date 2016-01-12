var mongoose = require('mongoose');

//Entry schema
var entrySchema = mongoose.Schema({
    claimid: String,
    mysid: String,
    myid: {
        type: mongoose.Schema.Types.ObjectId
    },
    targetsid: String,
    targetid: {
        type: mongoose.Schema.Types.ObjectId
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    claim: String,
    rating: Number,
    weight: Number
});

module.exports = mongoose.model('Entry', entrySchema);
