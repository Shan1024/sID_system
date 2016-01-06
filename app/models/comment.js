var mongoose = require('mongoose');

//Entry schema
var commentSchema = mongoose.Schema({
    commentid: String,
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
    comment: String
});

module.exports = mongoose.model('Comment', commentSchema);
