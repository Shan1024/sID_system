var mongoose = require('mongoose');

var Entry = require('./entry');
var LinkedIn = require('./linkedin');

//LinkedInRatedByMe schema
var linkedinRatedByMeScheme = mongoose.Schema({
    myid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facebook'
    },
    targetid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LinkedIn'
    },
    entries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entry'
    }]

});

module.exports = mongoose.model('LinkedInRatedByMe', linkedinRatedByMeScheme);
