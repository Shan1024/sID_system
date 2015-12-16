var chalk = require('chalk');
var mongoose = require('mongoose');
var defaultValues = require("../../config/defaultValues");

var Entry = require("../models/entry");
var Claim = require('../models/claim');
var FacebookRatedByMe = require('../models/facebookRatedByMe');
var Facebook = require("../models/facebook");
var User = require("../models/user");

module.exports = function (app, express) {

    var otherRoutes = express.Router();

    /**
     * @api {get} /other Test the secure api connection
     * @apiName /
     * @apiGroup Other Router
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       message: "Welcome to sID API !!!"
     *     }
     *
     */
    otherRoutes.route('/')
        .get(function (req, res) {
            res.json({message: "Welcome to sID API !!!"});
        });

    //getLIURL id->url
    otherRoutes.route('/getLinkedInURL')
        .post(function (req, res) {

            var uid = req.body.uid;

            if (!uid) {
                return res.json({error: "Missing uid paramter"});
            }

            Facebook.findOne({
                uid: uid
            }, function (err, facebook) {

                if (err) {
                    console.log("Error occured 46488");
                    res.json({success: false, message: "Error occurred"});
                } else {
                    if (facebook) {

                        User.findOne({
                            _id: facebook.user
                        }).populate({
                                path: 'userDetails.linkedin'
                            })
                            .exec(function (err, user) {
                                if (err) {
                                    console.log("Error occured 46488");
                                    res.json({success: false, message: "Error occurred"});
                                } else {
                                    if (user) {
                                        console.log(chalk.green("USER: " + JSON.stringify(user, null, "\t")));
                                        if(user.userDetails.linkedin){
                                            console.log("URL: "+user.userDetails.linkedin.url);
                                            res.json({success: true, url: user.userDetails.linkedin.url});
                                        }else{
                                            res.json({success: false, message: "No LinkedIn account is linked to this user"});
                                        }
                                    } else {
                                        res.json({success: false, message: "No user account found"});
                                    }
                                }
                            });
                    } else {
                        res.json({success: false, message: "No facebook account with given uid found"});
                    }
                }
            });
        });

    app.use('/other', otherRoutes);

};