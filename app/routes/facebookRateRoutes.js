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

    //// middleware to use for all requests
    //rateRouter.use(function (req, res, next) {
    //    console.log(chalk.blue('Request received to secure api.'));
    //
    //    // check header or url parameters or post parameters for token
    //    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    //
    //    //if the user is authenticated - used in the web interface
    //    if (req.isAuthenticated()) {
    //        return next();
    //
    //        //if user has a token - used in the chrome extension
    //    } else {
    //
    //        // decode token
    //        if (token) {
    //
    //            // verifies secret and checks exp
    //            jwt.verify(token, app.get('apiSecret'), function (err, decoded) {
    //                if (err) {
    //                    return res.json({success: false, message: 'Failed to authenticate token.'});
    //                } else {
    //                    // if everything is good, save to request for use in other routes
    //                    req.decoded = decoded;
    //                    next();
    //                }
    //            });
    //        } else {
    //            //if there is no token
    //            //return an error
    //            return res.status(403).send({
    //                success: false,
    //                message: 'Forbidden. No token provided.'
    //            });
    //        }
    //    }
    //});

    /**
     * @api {get} /rate/facebook Test the secure api connection
     * @apiName Test
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       message: "Welcome to sID API !!!"
     *     }
     *
     */
    rateRouter.route('/')
        .get(function (req, res) {
            res.json({message: "Welcome to sID API !!!"});
        });


    /**
     * @api {post} /rate/facebook/getID Check the availability of a user in the DB using the email
     * @apiName GetID
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} email User email used to create the sID account.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "success": true,
     *       "id": {FB_APP_ID}
     *     }
     *
     */
    rateRouter.route('/getID')
        .post(function (req, res) {

            var email = req.body.email;

            if (!email) {
                return res.json({error: "Missing email paramter"});
            }

            User.findOne({
                'userDetails.local.email': email
            }).populate({
                path: 'userDetails.facebook'
            }).exec(function (err, user) {
                if (err) {
                    res.json({success: false, message: 'Error occured'});
                } else {
                    if (user) {
                        console.log(chalk.green("USER: " + JSON.stringify(user, null, "\t")));
                        res.json({success: true, id: user.userDetails.facebook.id});
                    } else {
                        res.json({success: false, message: 'Email not found'});
                    }
                }
            });

        });

    /**
     * @api {post} /rate/facebook/setID Set the uid of a user according to the email
     * @apiName SetID
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} email User email used to create the sID account.
     * @apiParam {String} uid uid that needs to be added to the DB
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "success": true,
     *       "id": {FB_APP_ID}
     *     }
     *
     */
    rateRouter.route('/setID')
        .post(function (req, res) {

            var email = req.body.email;
            var uid = req.body.uid;

            console.log(chalk.green('email: ' + email));
            console.log(chalk.green('uid: ' + uid));
            if (!email) {
                return res.json({error: "Missing email parameter"});
            }

            if (!uid) {
                return res.json({error: "Missing uid parameter"});
            }

            User.findOne({
                'userDetails.local.email': email
            }).populate({
                path: 'userDetails.facebook'
            }).exec(function (err, user) {
                if (err) {
                    res.json({success: false, message: 'Error occurred'});
                } else {
                    if (user) {

                        console.log(chalk.blue("User: " + JSON.stringify(user, null, "\t")));

                        Facebook.findOne({
                            user: user._id
                        }, function (err, facebook) {
                            facebook.uid = uid;

                            console.log(chalk.blue("Facebook2: " + JSON.stringify(facebook, null, "\t")));

                            facebook.save(function (err) {
                                if (err) {
                                    res.json({success: false, message: 'Error occurred'});
                                } else {
                                    res.json({success: true, message: 'Successfully updated'});
                                }
                            });

                        });
                    } else {
                        res.json({success: false, message: 'Email not found'});
                    }
                }
            });

        });


    var addRating = function (req, res, me, target, myUser, targetUser) {

        var myid = req.body.myid;
        var targetid = req.body.targetid;
        var claimid = req.body.claimid;
        var claim = req.body.claim;
        var rating = req.body.rating;

        FacebookRatedByMe
            .findOne({
                myid: me._id,
                targetid: target._id
            }).populate({
            path: 'entries',
            match: {
                id: claimid
            }
        }).exec(function (err, facebookRatedByMe) {

            if (facebookRatedByMe) {
                console.log(chalk.green("Previous ratings found"));
                console.log(chalk.blue("Previous rating: " + JSON.stringify(facebookRatedByMe, null, "\t")));

                if (facebookRatedByMe.entries[0]) {
                    console.log('Found');

                    Entry.findOne({
                        _id: facebookRatedByMe.entries[0]._id
                    }, function (err, entry) {

                        Claim.findOne({
                            claimid: claimid,
                            myid: targetid
                        }, function (err, myClaim) {

                            if (err) {
                                console.log(chalk.red('Error occurred 4587'));
                            } else {

                                if (myClaim) {

                                    //remove the current rating and score from the myClaim
                                    if (entry.rating == defaultValues.votes.yes) {
                                        myClaim.yes = myClaim.yes - 1;
                                        myClaim.score = myClaim.score - defaultValues.multipliers.yes * entry.weight;
                                        targetUser.facebook.score = targetUser.facebook.score - defaultValues.multipliers.yes * entry.weight;
                                    } else if (entry.rating == defaultValues.votes.no) {
                                        myClaim.no = myClaim.no - 1;
                                        myClaim.score = myClaim.score - defaultValues.multipliers.no * entry.weight;
                                        targetUser.facebook.score = targetUser.facebook.score - defaultValues.multipliers.no * entry.weight;
                                    } else {
                                        myClaim.notSure = myClaim.notSure - 1;
                                        myClaim.score = myClaim.score - defaultValues.multipliers.notSure * entry.weight;
                                        targetUser.facebook.score = targetUser.facebook.score - defaultValues.multipliers.no * entry.weight;
                                    }

                                    //add the new rating and score to the myClaim
                                    if (rating == defaultValues.votes.yes) {
                                        myClaim.yes = myClaim.yes + 1;
                                        myClaim.score = myClaim.score + defaultValues.multipliers.yes * myUser.facebook.weight;
                                        targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.yes * myUser.facebook.weight;
                                    } else if (rating == defaultValues.votes.no) {
                                        myClaim.no = myClaim.no + 1;
                                        myClaim.score = myClaim.score + defaultValues.multipliers.no * myUser.facebook.weight;
                                        targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.no * myUser.facebook.weight;
                                    } else {
                                        myClaim.notSure = myClaim.notSure + 1;
                                        myClaim.score = myClaim.score + defaultValues.multipliers.notSure * myUser.facebook.weight;
                                        targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.notSure * myUser.facebook.weight;
                                    }

                                    entry.rating = rating;
                                    entry.weight = myUser.facebook.weight;
                                    entry.lastUpdated = Date.now();

                                    entry.save(function (err) {
                                        if (err) {
                                            console.log(chalk.red('Error occured while saving the entry 4564'));
                                        }
                                    });

                                    myClaim.lastUpdated = Date.now();
                                    myClaim.setOverallRating();

                                    myClaim.save(function (err) {
                                        if (err) {
                                            console.log(chalk.red('Error occured while saving the myClaim 4648'));
                                        }
                                    });

                                    targetUser.setOverallFacebookRating();
                                    targetUser.save(function (err) {
                                        if (err) {
                                            console.log("targetUser save error: " + err);
                                        } else {
                                            console.log("targetUser saved successfully");
                                        }
                                    });

                                } else {

                                    console.log(chalk.red('No myClaim found 1456'));

                                    var newClaim = new Claim({
                                        claimid: claimid,
                                        claim: claim,
                                        myid: targetid
                                    });

                                    if (rating == defaultValues.votes.yes) {
                                        newClaim.yes = 1;
                                        newClaim.score = defaultValues.multipliers.yes * myUser.facebook.weight;
                                        targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.yes * myUser.facebook.weight;
                                    } else if (rating == defaultValues.votes.no) {
                                        newClaim.no = 1;
                                        newClaim.score = defaultValues.multipliers.no * myUser.facebook.weight;
                                        targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.no * myUser.facebook.weight;
                                    } else {
                                        newClaim.notSure = 1;
                                        newClaim.score = defaultValues.multipliers.notSure * myUser.facebook.weight;
                                        targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.notSure * myUser.facebook.weight;
                                    }

                                    newClaim.setOverallRating();

                                    myUser.facebook.claims.push(newClaim);
                                    myUser.save(function (err) {
                                        if (err) {
                                            console.log("myUser save error: " + err);
                                        } else {
                                            console.log("myUser saved successfully");
                                        }
                                    });

                                    newClaim.save(function (err) {
                                        if (err) {
                                            console.log(chalk.red('Error occurred 1487'));
                                        }
                                    });

                                    targetUser.setOverallFacebookRating();
                                    targetUser.save(function (err) {
                                        if (err) {
                                            console.log("myUser save error: " + err);
                                        } else {
                                            console.log("myUser saved successfully");
                                        }
                                    });


                                }
                            }
                        });
                    });
                } else {

                    console.log('Not found');

                    var entry = new Entry({
                        id: claimid,
                        myid: me._id,
                        targetid: target._id,
                        claim: claim,
                        rating: rating,
                        weight: myUser.facebook.weight
                    });

                    entry.save(function (err) {

                        if (err) {
                            console.log("Error: " + err);
                        } else {
                            facebookRatedByMe.entries.push(entry);

                            facebookRatedByMe.save(function (err) {
                                if (err) {
                                    console.log("error: " + err);
                                } else {
                                    console.log("no error");

                                    User.findOne(
                                        {
                                            _id: target.user
                                        },
                                        function (err, user) {

                                            if (err) {
                                                console.log("User not found: " + err);
                                            } else {
                                                console.log(chalk.blue("User: " + JSON.stringify(user, null, "\t")));

                                                user.facebook.ratedByOthers.push(entry);

                                                var newClaim = new Claim({
                                                    claimid: claimid,
                                                    myid: targetid
                                                });

                                                if (rating == defaultValues.votes.yes) {
                                                    newClaim.yes = 1;
                                                    newClaim.score = defaultValues.multipliers.yes * myUser.facebook.weight;
                                                    user.facebook.score = user.facebook.score + defaultValues.multipliers.yes * myUser.facebook.weight;
                                                } else if (rating == defaultValues.votes.no) {
                                                    newClaim.no = 1;
                                                    newClaim.score = defaultValues.multipliers.no * myUser.facebook.weight;
                                                    user.facebook.score = user.facebook.score + defaultValues.multipliers.no * myUser.facebook.weight;
                                                } else {
                                                    newClaim.notSure = 1;
                                                    newClaim.score = defaultValues.multipliers.notSure * myUser.facebook.weight;
                                                    user.facebook.score = user.facebook.score + defaultValues.multipliers.notSure * myUser.facebook.weight;
                                                }

                                                newClaim.setOverallRating();

                                                newClaim.save(function (err) {
                                                    if (err) {
                                                        console.log(chalk.red('Error occurred 1487'));
                                                    }
                                                });

                                                user.facebook.claims.push(newClaim);
                                                user.setOverallFacebookRating();
                                                user.save(function (err) {
                                                    if (err) {
                                                        console.log("User save error: " + err);
                                                    } else {
                                                        console.log("User saved successfully");
                                                    }
                                                });
                                            }
                                        });

                                }
                            });
                        }
                    });
                    return res.sendStatus(200);
                }
                return res.sendStatus(200);

            } else {
                console.log(chalk.red("Previous ratings not found"));
                //return res.json({message:"Previous ratings not found"});

                var newEntry = new Entry({
                    id: claimid,
                    myid: me._id,
                    targetid: target._id,
                    claim: claim,
                    rating: rating,
                    weight: myUser.facebook.weight
                });

                newEntry.save(function (err) {

                    if (err) {
                        console.log(chalk.red("Error saving the entry"));
                        return res.json({err: "Error saving the entry"});
                    } else {

                        var newFBRating = new FacebookRatedByMe({
                            myid: me._id,
                            targetid: target._id,
                            entries: [newEntry._id]
                        });

                        newFBRating.save(function (err) {
                            if (err) {
                                console.log(chalk.red("Error saving the entry: " + err));
                                return res.json({err: "Error saving the entry: " + err});
                            } else {


                                targetUser.facebook.ratedByOthers.push(newEntry);

                                Claim.findOne({
                                    claimid: claimid,
                                    myid: targetid
                                }, function (err, myClaim) {

                                    if (err) {
                                        console.log(chalk.red("Error occurred 154"));
                                    } else {

                                        if (myClaim) {

                                            if (rating == defaultValues.votes.yes) {
                                                myClaim.yes = myClaim.yes + 1;
                                                myClaim.score = myClaim.score + defaultValues.multipliers.yes * myUser.facebook.weight;
                                                targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.yes * myUser.facebook.weight;
                                            } else if (rating == defaultValues.votes.no) {
                                                myClaim.no = myClaim.no + 1;
                                                myClaim.score = myClaim.score + defaultValues.multipliers.no * myUser.facebook.weight;
                                                targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.no * myUser.facebook.weight;
                                            } else {
                                                myClaim.notSure = myClaim.notSure + 1;
                                                myClaim.score = myClaim.score + defaultValues.multipliers.notSure * myUser.facebook.weight;
                                                targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.notSure * myUser.facebook.weight;
                                            }

                                            myClaim.lastUpdated = Date.now();
                                            myClaim.setOverallRating();

                                            myClaim.save(function (err) {
                                                if (err) {
                                                    console.log(chalk.red('Error occurred 1487'));
                                                }
                                            });

                                            targetUser.setOverallFacebookRating();
                                            targetUser.save(function (err) {
                                                if (err) {
                                                    console.log("User(target) save error: " + err);
                                                } else {
                                                    console.log("User(target) saved successfully");
                                                }
                                            });

                                        } else {

                                            var newClaim = new Claim({
                                                claimid: claimid,
                                                claim: claim,
                                                myid: targetid
                                            });

                                            if (rating == defaultValues.votes.yes) {
                                                newClaim.yes = 1;
                                                newClaim.score = defaultValues.multipliers.yes * myUser.facebook.weight;
                                                targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.yes * myUser.facebook.weight;
                                            } else if (rating == defaultValues.votes.no) {
                                                newClaim.no = 1;
                                                newClaim.score = defaultValues.multipliers.no * myUser.facebook.weight;
                                                targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.no * myUser.facebook.weight;
                                            } else {
                                                newClaim.notSure = 1;
                                                newClaim.score = defaultValues.multipliers.notSure * myUser.facebook.weight;
                                                targetUser.facebook.score = targetUser.facebook.score + defaultValues.multipliers.notSure * myUser.facebook.weight;
                                            }

                                            newClaim.setOverallRating();
                                            newClaim.save(function (err) {
                                                if (err) {
                                                    console.log(chalk.red('Error occurred 1487'));
                                                }
                                            });

                                            targetUser.facebook.claims.push(newClaim);
                                            targetUser.setOverallFacebookRating();
                                            targetUser.save(function (err) {
                                                if (err) {
                                                    console.log("User(target) save error: " + err);
                                                } else {
                                                    console.log("User(target) saved successfully");
                                                }
                                            });
                                        }
                                    }


                                });

                                myUser.facebook.ratedByMe.push(newFBRating);

                                myUser.save(function (err) {
                                    if (err) {
                                        console.log("User(me) save error: " + err);
                                    } else {
                                        console.log("User(me) saved successfully");
                                    }
                                });

                                return res.sendStatus(200);
                            }
                        });

                    }
                });
            }
        });
    };

    /**
     * @api {post} /rate/facebook/addRating Adds a new Facebook rating or update an existing one.
     * @apiName AddRating
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} myid The Facebook User ID of the user who is rating.
     * @apiParam {String} targetid The Facebook User ID of the user who is getting rated.
     * @apiParam {String} claimid The Facebook Claim ID.
     * @apiParam {String} claim The claim details.
     * @apiParam {String} rating The rating that the current user has given for the claim. The value must be one of 1, 0, -1.
     *
     */
    rateRouter.route('/addRating')
        .post(function (req, res) {

            var myid = req.body.myid;
            var targetid = req.body.targetid;
            var claimid = req.body.claimid;
            var claim = req.body.claim;
            var rating = req.body.rating;

            if (!myid) {
                return res.json({error: "Missing myid paramter"});
            }

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
            }

            if (!claimid) {
                return res.json({error: "Missing claimid paramter"});
            }

            if (!claim) {
                return res.json({error: "Missing claim paramter"});
            }

            if (!rating) {
                return res.json({error: "Missing rating paramter"});
            }


            Facebook.findOne({
                uid: myid
            }, function (err, me) {
                if (me) {
                    console.log(chalk.yellow("User found: " + JSON.stringify(me, null, "\t")));

                    Facebook.findOne({
                        uid: targetid
                    }, function (err, target) {
                        if (target) {

                            console.log(chalk.blue("Target found: " + JSON.stringify(target, null, "\t")));

                            User.findOne({
                                _id: me.user
                            }, function (err, myUser) {
                                User.findOne({
                                    _id: target.user
                                }, function (err, targetUser) {
                                    addRating(req, res, me, target, myUser, targetUser);
                                });
                            });

                        } else {

                            console.log(chalk.red("Target not found. Creating a new Facebook account."));

                            var facebook = new Facebook();
                            var newUser = new User();

                            facebook.uid = targetid;
                            facebook.user = newUser._id;

                            facebook.save(function (err) {
                                if (err) {
                                    return res.json({message: "Target with uid=" + targetid + " not found and Facebook cannot be created"});
                                } else {

                                    newUser.userDetails.facebook = facebook._id;

                                    newUser.save(function (err) {
                                        if (err) {
                                            return res.json({message: "Target with uid=" + targetid + " not found and User cannot be created"});
                                        } else {
                                            User.findOne({
                                                _id: me.user
                                            }, function (err, myUser) {
                                                User.findOne({
                                                    _id: target.user
                                                }, function (err, targetUser) {
                                                    addRating(req, res, me, facebook, myUser, targetUser);
                                                });
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    console.log(chalk.red("Me not found"));
                    return res.json({message: "User with uid=" + myid + " not found"});
                }
            });
        });

    /**
     * @api {post} /rate/facebook/getRating Returns the ratings of a claim.
     * @apiName GetRating
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} claimid The Facebook Claim ID.
     * @apiParam {String} [targetid] The Facebook User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "yes": 0,
     *         "no": 0,
     *         "notSure": 1,
     *         "overallRating": 0,
     *         "claimScore": "C"
     *    }
     *
     */
    rateRouter.route('/getRating')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var claimid = req.body.claimid;

            if (!targetid) {
                if (req.user.userDetails.facebook) {
                    targetid = req.user.userDetails.facebook.uid;
                } else {
                    return res.json({
                        success: true,
                        id: targetid,
                        claimsCount: 0,
                        yes: 0,
                        notSure: 0,
                        no: 0
                    });
                }
            }

            if (!claimid) {
                return res.json({error: "Missing claimid paramter"});
            }

            Claim.findOne({
                claimid: claimid,
                myid: targetid
            }, function (err, claim) {
                if (err) {
                    console.log(chalk.red("Error occured 8975"));
                    res.json({
                        success: false,
                        message: "Error occured",
                        yes: 0,
                        no: 0,
                        notSure: 0,
                        overallRating: 0,
                        claimScore: "N"
                    });
                } else {
                    if (claim) {

                        var character;

                        if (claim.overallRating == defaultValues.ratings.trustedUser) {
                            character = "T";
                        } else if (claim.overallRating == defaultValues.ratings.untrustedUser) {
                            character = "R";
                        } else {
                            character = "C";
                        }

                        res.json({
                            success: true,
                            yes: claim.yes,
                            no: claim.no,
                            notSure: claim.notSure,
                            overallRating: claim.overallRating,
                            claimScore: character
                        });

                    } else {
                        console.log(chalk.red("Claim not found"));
                        res.json({
                            success: false,
                            message: "Claim not found",
                            yes: 0,
                            no: 0,
                            notSure: 0,
                            overallRating: 0,
                            claimScore: "N"
                        });
                    }
                }
            });
        });

    /**
     * @api {post} /rate/facebook/getAllRatingsCount Get sum of Yes, No, NotSure counts of all claims made by the target user.
     * @apiName GetAllRatingsCount
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The Facebook User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "id": {ID},
     *         "claimsCount": 3,
     *         "yes": 2,
     *         "notSure": 2,
     *         "no": 0
     *     }
     *
     */
    rateRouter.route('/getAllRatingsCount')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user.userDetails.facebook) {
                    targetid = req.user.userDetails.facebook.uid;
                } else {
                    return res.json({
                        success: true,
                        id: targetid,
                        claimsCount: 0,
                        yes: 0,
                        notSure: 0,
                        no: 0
                    });
                }
            }

            Claim.find({
                myid: targetid
            }, function (err, claim) {

                if (err) {
                    console.log(chalk.red("Error occurred 44680"));

                    res.json({
                        success: false,
                        message: "Error occurred"
                    });

                } else {

                    if (claim) {

                        console.log("Claims count: " + claim.length);

                        var yes = 0, no = 0, notSure = 0;

                        for (var i = 0; i < claim.length; i++) {
                            yes += claim[i].yes;
                            no += claim[i].no;
                            notSure += claim[i].notSure;
                        }

                        res.json({
                            success: true,
                            id: targetid,
                            claimsCount: claim.length,
                            yes: yes,
                            notSure: notSure,
                            no: no
                        });

                    } else {
                        res.json({
                            success: true,
                            id: targetid,
                            claimsCount: 0,
                            yes: 0,
                            notSure: 0,
                            no: 0
                        });
                    }
                }
            });
        });


    /**
     * @api {post} /rate/facebook/getOverallProfileRating Returns the overall profile rating as one of T, R, C, N characters.
     * @apiName GetOverallProfileRating
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The Facebook User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "ratingLevel": "N"
     *     }
     */
    rateRouter.route('/getOverallProfileRating')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user.userDetails.facebook) {
                    targetid = req.user.userDetails.facebook.uid;
                } else {
                    return res.json({
                        success: true,
                        id: targetid,
                        claimsCount: 0,
                        yes: 0,
                        notSure: 0,
                        no: 0
                    });
                }
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
                        }, function (err, user) {

                            console.log(chalk.green("USER: " + JSON.stringify(user, null, "\t")));

                            if (user.facebook.overallRating) {

                                if (user.facebook.overallRating == defaultValues.ratings.trustedUser) {
                                    res.json({success: true, ratingLevel: "T"});
                                } else if (user.facebook.overallRating == defaultValues.ratings.untrustedUser) {
                                    res.json({success: true, ratingLevel: "R"});
                                } else {
                                    res.json({success: true, ratingLevel: "C"});
                                }

                            } else {
                                res.json({success: true, ratingLevel: "N"});
                            }

                        });

                    } else {
                        res.json({success: false, message: "No facebook account with given targetid found"});
                    }
                }
            });
        });

    /**
     * @api {post} /rate/facebook/getAllRatedClaims Returns all of the claims of the target user that are rated.
     * @apiName GetAllRatedClaims
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The Facebook User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "data": [
     *           {
     *             "_id": "5671b384be3b91a821ae16c4",
     *             "claimid": {CLAIM_ID},
     *             "claim": {CLAIM},
     *             "myid": {ID},
     *             "__v": 0,
     *             "overallRating": 0,
     *             "score": 2,
     *             "notSure": 1,
     *             "no": 0,
     *             "yes": 0,
     *             "lastUpdated": "2015-12-16T20:18:45.734Z"
     *          },
     *        ]
     *     }
     */
    rateRouter.route('/getAllRatedClaims')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user.userDetails.facebook) {
                    targetid = req.user.userDetails.facebook.uid;
                } else {
                    return res.json({
                        success: true,
                        id: targetid,
                        claimsCount: 0,
                        yes: 0,
                        notSure: 0,
                        no: 0
                    });
                }
            }

            Claim.find({
                myid: targetid
            }, function (err, claims) {
                if (err) {
                    console.log("Error occured 98798");
                    res.json({success: false, message: "Error occurred"});
                } else {
                    if (claims) {
                        console.log(chalk.blue("Target found: " + JSON.stringify(claims, null, "\t")));
                        res.json({success: true, data: claims});
                    } else {
                        res.json({success: true, message: "No claims found."});
                    }
                }
            });
        });

    /**
     * @api {post} /rate/facebook/getLastRatedClaims Returns the last updated Claims of the target user.
     * @apiName GetLastRatedClaims
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The Facebook User ID of the target user. If this is not provided, targetid will be set to current User ID.
     * @apiParam {Number} limit The number of results needed. If the value is invalid, default value will be used.
     * @apiParam {Number} order -1 for descending order and 1 for ascending order. Default value is -1.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "data": [
     *           {
     *             "_id": "5671b59e6993ff982e1cd811",
     *             "claimid": {CLAIM_ID},
     *             "claim": {CLAIM},
     *             "myid": {ID},
     *             "__v": 0,
     *             "overallRating": 0,
     *             "score": 10,
     *             "notSure": 1,
     *             "no": 0,
     *             "yes": 1,
     *             "lastUpdated": "2015-12-16T21:04:54.439Z"
     *           },
     *         ]
     *     }
     *
     */
    rateRouter.route('/getLastRatedClaims')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var limit = req.body.limit;
            var order = req.body.order;

            if (!targetid) {
                if (req.user.userDetails.facebook) {
                    targetid = req.user.userDetails.facebook.uid;
                } else {
                    return res.json({
                        success: true,
                        id: targetid,
                        claimsCount: 0,
                        yes: 0,
                        notSure: 0,
                        no: 0
                    });
                }
            }
            if (!limit) {
                return res.json({error: "Missing limit paramter"});
            }
            if (limit <= 0) {
                limit = defaultValues.claimsLimit;
            }

            if (!order) {
                return res.json({error: "Missing order paramter"});
            }
            if (!(order == 1 || order == -1)) {
                order = defaultValues.defaultOrder;
            }

            Claim.find({
                myid: targetid
            }).sort({
                lastUpdated: order
            }).limit(limit)
                .exec(
                    function (err, claims) {
                        if (err) {
                            console.log("Error occured 7945");
                            res.json({success: false, message: "Error occurred"});
                        } else {
                            if (claims) {
                                console.log(chalk.blue("Claims found: " + JSON.stringify(claims, null, "\t")));
                                res.json({success: true, data: claims});
                            } else {
                                res.json({success: true, message: "No claims user found."});
                            }
                        }
                    });
        });

    /**
     * @api {post} /rate/facebook/getLastRatedEntries Returns the last updated Entries of the target user.
     * @apiName GetLastRatedEntries
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The Facebook User ID of the target user. If this is not provided, targetid will be set to current User ID.
     * @apiParam {Number} limit The number of results needed. If the value is invalid, default value will be used.
     * @apiParam {Number} order -1 for descending order and 1 for ascending order. Default value is -1.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "data": [
     *           {
     *             "_id": "5671b59e6993ff982e1cd811",
     *             "id": {CLAIM_ID},
     *             "data": {CLAIM},
     *             "rating": 1,
     *             "lastUpdated": "2015-12-16T21:04:54.439Z"
     *           },
     *         ]
     *     }
     *
     */
    rateRouter.route('/getLastRatedEntries')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var limit = req.body.limit;
            var order = req.body.order;

            if (!targetid) {
                if (req.user.userDetails.facebook) {
                    targetid = req.user.userDetails.facebook.uid;
                } else {
                    return res.json({
                        success: true,
                        id: targetid,
                        claimsCount: 0,
                        yes: 0,
                        notSure: 0,
                        no: 0
                    });
                }
            }
            if (!limit) {
                return res.json({error: "Missing limit paramter"});
            }
            if (limit <= 0) {
                limit = defaultValues.entriesLimit;
            }

            if (!order) {
                return res.json({error: "Missing order paramter"});
            }
            if (!(order == 1 || order == -1)) {
                order = defaultValues.defaultOrder;
            }

            Facebook.findOne({uid: targetid}, function (err, facebook) {
                if (err) {
                    console.log("Error occured 49841");
                    res.json({success: false, message: "Error occurred"});
                } else {
                    if (facebook) {
                        console.log(chalk.blue("Facebook found: " + JSON.stringify(facebook, null, "\t")));

                        Entry.find({
                            targetid: facebook._id
                        }).select('id lastUpdated data rating')
                            .sort({lastUpdated: order})
                            .limit(limit).exec(
                            function (err, entries) {
                                if (err) {
                                    console.log("Error occured 7945");
                                    res.json({success: false, message: "Error occurred"});
                                } else {
                                    if (entries) {
                                        console.log(chalk.blue("Claims found: " + JSON.stringify(entries, null, "\t")));
                                        res.json({success: true, data: entries});
                                    } else {
                                        res.json({success: true, message: "No entries user found."});
                                    }
                                }
                            });
                    } else {
                        res.json({success: true, message: "No facebook account found."});
                    }
                }
            });
        });

    /**
     * @api {post} /rate/facebook/getAllRatingsByUser Returns the all ratings done by a target user.
     * @apiName getAllRatingsByUser
     * @apiGroup Facebook
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The Facebook User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "data": [
     *           {
     *             "_id": "5671b59e6993ff982e1cd811",
     *             "id": {CLAIM_ID},
     *             "myid": "5671a265ebe27c396108ea77",
     *             "targetid": "5671a1dcebe27c396108ea74",
     *             "data": {CLAIM},
     *             "rating": 1,
     *             "weight": 2,
     *             "__v": 0,
     *             "lastUpdated": "2015-12-16T21:04:54.439Z"
     *           },
     *         ]
     *     }
     *
     */
    rateRouter.route('/getAllRatingsByUser')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user.userDetails.facebook) {
                    targetid = req.user.userDetails.facebook.uid;
                } else {
                    return res.json({
                        success: true,
                        id: targetid,
                        claimsCount: 0,
                        yes: 0,
                        notSure: 0,
                        no: 0
                    });
                }
            }

            Facebook.findOne({
                uid: targetid
            }, function (err, facebook) {
                if (err) {
                    console.log("Error occurred");
                    res.json({success: false, message: "Error occurred"});
                } else {
                    if (facebook) {
                        FacebookRatedByMe.find({
                            myid: facebook._id
                        }).populate({
                                path: 'entries',
                                populate: {path: 'targetid', model: Facebook, select: 'uid name'}
                            })
                            //.select('entries')
                            .exec(function (err, fbRatedByMe) {
                                if (err) {
                                    console.log("Error occurred");
                                    res.json({success: false, message: "Error occurred"});
                                } else {
                                    if (fbRatedByMe) {
                                        console.log(chalk.blue("fbRatedByMe found: " + JSON.stringify(fbRatedByMe, null, "\t")));
                                        res.json({success: true, data: fbRatedByMe});
                                    } else {
                                        console.log("fbRatedByMe not found");
                                        res.json({success: false, message: "fbRatedByMe not found"});
                                    }
                                }
                            });
                    } else {
                        console.log("Target not found");
                        res.json({success: false, message: "Target not found"});
                    }
                }
            });
        });

    app.use('/rate/facebook', rateRouter);

};