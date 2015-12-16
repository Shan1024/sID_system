var chalk = require('chalk');
var mongoose = require('mongoose');
var defaultValues = require("../../config/defaultValues");

var Entry = require("../models/entry");
var Claim = require('../models/claim');
var FacebookRatedByMe = require('../models/facebookRatedByMe');
var Facebook = require("../models/facebook");
var User = require("../models/user");

module.exports = function (app, express) {

    var rateRouter = express.Router();


    app.use('/rate/linkedin', rateRouter);

};