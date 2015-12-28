var chalk = require('chalk');
var mongoose = require('mongoose');
var defaultValues = require("../../config/defaultValues");

var Entry = require("../models/entry");
var Claim = require('../models/claim');
var FacebookRatedByMe = require('../models/facebookRatedByMe');
var Facebook = require("../models/facebook");
var LinkedInRatedByMe = require('../models/linkedinRatedByMe');
var LinkedIn = require("../models/linkedin");
var User = require("../models/user");

module.exports = function (app, express) {

    var otherRoutes = express.Router();

    /**
     * @api {get} /other Test the secure api connection
     * @apiName Other
     * @apiGroup Other
     * @apiVersion 0.1.0
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

    /**
     * @api {post} /other/getLinkedInURL Get the LinkedIn profile url of a user.
     * @apiName GetLinkedInURL
     * @apiGroup Other
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid Facebook User ID of the target user.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       message: "Welcome to sID API !!!"
     *     }
     *
     */
    otherRoutes.route('/getLinkedInURL')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
            }

            Facebook.findOne({
                uid: targetid
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
                                        if (user.userDetails.linkedin) {
                                            console.log("URL: " + user.userDetails.linkedin.url);
                                            res.json({success: true, url: user.userDetails.linkedin.url});
                                        } else {
                                            res.json({
                                                success: false,
                                                message: "No LinkedIn account is linked to this user"
                                            });
                                        }
                                    } else {
                                        res.json({success: false, message: "No user account found"});
                                    }
                                }
                            });
                    } else {
                        res.json({success: false, message: "No facebook account with given targetid found"});
                    }
                }
            });
        });


    /**
     * @api {post} /other/getSuggestions Get the Facebook and LinkedIn name suggestions for a given text.
     * @apiName GetSuggestions
     * @apiGroup Other
     * @apiVersion 0.1.0
     *
     * @apiParam {String} text The string that needs to get suggestions.
     *
     * @apiSuccessExample Success-Response:
     * {
     *     facebook: [
     *          {
     *              "name": {NAME}
     *          },
     *     ],
     *     linkedin: [
     *          {
     *              "name": {NAME}
     *          },
     *     ],
     *     success: true
     * }
     *
     */

    otherRoutes.route('/getSuggestions')
        .post(function (req, res) {

            var text = req.body.text;

            if (!text) {
                return res.json({success: false, message: "No text parameter fount"});
            }

            Facebook.find({
                name: new RegExp(text, "i")
            }).select("name")
                .exec(function (err, facebook) {
                    if (err) {
                        console.log("Error occurred 441512");
                        res.json({message: "Error occurred", success: true});
                    } else {
                        console.log("facebook: " + facebook);
                        LinkedIn.find({
                            name: new RegExp(text, "i")
                        }).select("name")
                            .exec(function (err, linkedin) {
                                if (err) {
                                    console.log("Error occurred 515614");
                                    res.json({message: "Error occurred", success: true});
                                } else {
                                    console.log("LinkedIn: " + linkedin);
                                    res.json({facebook: facebook, linkedin: linkedin, success: true});
                                }
                            });
                    }
                });
        });

    otherRoutes.route('/getSuggestions')
        .get(function (req, res) {

            var text = req.query.text;

            console.log('==================inside get========================');

            if (!text) {
                return res.json({success: false, message: "No text parameter fount"});
            }

            Facebook.find({
                name: new RegExp(text, "i")
            }).select("name")
                .exec(function (err, facebook) {
                    if (err) {
                        console.log("Error occurred 441512");
                        res.json({year: 1923, value: "Error facebook", tokens: ["error facebook"], success: false});
                    } else {
                        console.log("facebook: " + facebook);
                        LinkedIn.find({
                            name: new RegExp(text, "i")
                        }).select("name")
                            .exec(function (err, linkedin) {
                                if (err) {
                                    console.log("Error occurred 515614");
                                    res.json({
                                        year: 1923,
                                        value: "Error linkedin",
                                        tokens: ["error linkedin"],
                                        success: false
                                    });
                                } else {
                                    console.log("LinkedIn: " + linkedin);
                                    if (facebook.length > 0) {
                                        res.json({
                                            year: 1923,
                                            value: facebook[0].name,
                                            tokens: ["seetee", "tharanga"],
                                            success: true
                                        });
                                    } else {
                                        res.json({year: 1923, value: "No User", tokens: ["no user"], success: true});
                                    }
                                }
                            });
                    }
                });
        });

    otherRoutes.route('/getSuggestionsFacebook')
        .get(function (req, res) {

            var text = req.query.text;

            if (!text) {
                return res.json({success: false, message: "No text parameter fount"});
            }

            Facebook.find({
                name: new RegExp(text, "i")
            }).select("name user id")
                .exec(function (err, facebook) {
                    if (err) {
                        console.log("Error occurred 441512");
                        res.json({values: "Error facebook", tokens: ["error facebook"], success: false});
                    } else {
                        if (facebook.length > 0) {
                            res.json({values: facebook, tokens: [], success: true});
                        } else {
                            res.json({values: "No Facebook Suggestions", tokens: ["no facebook user"], success: true});
                        }
                    }
                });
        });


    otherRoutes.route('/getSuggestionsLinkedIn')
        .get(function (req, res) {

            var text = req.query.text;

            if (!text) {
                return res.json({success: false, message: "No text parameter fount"});
            }

            LinkedIn.find({
                name: new RegExp(text, "i")
            }).select("name user photo")
                .exec(function (err, linkedin) {
                    if (err) {
                        console.log("Error occurred 441512");
                        res.json({values: "Error linkedin", tokens: ["error linkedin"], success: false});
                    } else {
                        if (linkedin.length > 0) {
                            res.json({values: linkedin, tokens: [], success: true});
                        } else {
                            res.json({values: "No LinkedIn Suggestions", tokens: ["no linkedin user"], success: true});
                        }
                    }
                });
        });

    app.use('/other', otherRoutes);

};
