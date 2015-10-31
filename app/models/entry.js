var mongoose = require('mongoose');

//Entry schema
var entrySchema = mongoose.Schema({
    data: String,
    rating: Number
});

module.exports = mongoose.model('Entry', entrySchema);
