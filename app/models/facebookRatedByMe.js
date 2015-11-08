var mongoose = require('mongoose');

var Entry = require('./entry');
var Facebook = require('./facebook');

//FacebookRatedByMe schema
var facebookRatedByMeScheme = mongoose.Schema({
    myid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facebook'
    },
    targetid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facebook'
    },
    entries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entry'
    }]

});

module.exports = mongoose.model('FacebookRatedByMe', facebookRatedByMeScheme);
