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
     * @apiName /
     * @apiGroup Facebook Rating Router
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       message: "Welcome to sID Rating API !!!"
     *     }
     *
     */
    rateRouter.route('/')
        .get(function (req, res) {
            res.json({message: "Welcome to sID Facebook Rating API !!!"});
        });


    /**
     * @api {post} /rate/facebook/setID Check the availability of a user in the DB using the email
     * @apiName /rate/setID
     * @apiGroup Facebook Rating Router
     *
     * @apiParam {String} email User email used to create the sID account.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "success": true,
     *       "id": FB_APP_ID
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
     * @api {post} /rate/getID Set the uid of a user according to the email
     * @apiName /rate/getID
     * @apiGroup Rating Router
     *
     * @apiParam {String} email User email used to create the sID account.
     * @apiParam {String} uid uid that needs to be added to the DB
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "success": true,
     *       "id": FB_APP_ID
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


    var addRating = function (req, res, me, target, myUser) {

        var myid = req.body.myid;
        var targetid = req.body.targetid;
        var claimid = req.body.claimid;
        var claim = req.body.claim;
        var rating = req.body.rating;

        FacebookRatedByMe
            .findOne({
                myid: me._id,
                targetid: target._id
            })

            //.populate('entries', null, { entries: {$elemMatch: {id: claimid}}})

            .populate(
                {
                    path: 'entries',
                    match: {id: claimid},
                    //select: 'data'
                }
            )

            //.populate('entries','id')

            .exec(function (err, facebookRatedByMe) {

                if (facebookRatedByMe) {
                    console.log(chalk.green("Previous ratings found"));
                    console.log(chalk.blue("Previous rating: " + JSON.stringify(facebookRatedByMe, null, "\t")));

                    if (facebookRatedByMe.entries[0]) {
                        console.log('Found');

                        //Entry.findOneAndUpdate({
                        //        _id: facebookRatedByMe.entries[0]._id
                        //    }, {
                        //        rating: rating
                        //    },
                        //    {
                        //        safe: true,
                        //        upsert: true,
                        //        new: true
                        //    },
                        //    function (err, entry) {
                        //        console.log(chalk.yellow("New rating: " + JSON.stringify(entry, null, "\t")));
                        //    });


                        Entry.findOne({
                            _id: facebookRatedByMe.entries[0]._id
                        }, function (err, entry) {

                            Claim.findOne({
                                claimid: claimid,
                                myid: targetid
                            }, function (err, claim) {

                                if (err) {
                                    console.log(chalk.red('Error occurred 4587'));
                                } else {

                                    if (claim) {

                                        //remove the current rating and score from the claim
                                        if (entry.rating == defaultValues.votes.yes) {
                                            claim.yes = claim.yes - 1;
                                            claim.score = claim.score - defaultValues.multipliers.yes * entry.weight;
                                        } else if (entry.rating == defaultValues.votes.no) {
                                            claim.no = claim.no - 1;
                                            claim.score = claim.score - defaultValues.multipliers.no * entry.weight;
                                        } else {
                                            claim.notSure = claim.notSure - 1;
                                            claim.score = claim.score - defaultValues.multipliers.notSure * entry.weight;
                                        }

                                        //add the new rating and score to the claim
                                        if (rating == defaultValues.votes.yes) {
                                            claim.yes = claim.yes + 1;
                                            claim.score = claim.score + defaultValues.multipliers.yes * myUser.userDetails.weight;
                                        } else if (rating == defaultValues.votes.no) {
                                            claim.no = claim.no + 1;
                                            claim.score = claim.score + defaultValues.multipliers.no * myUser.userDetails.weight;
                                        } else {
                                            claim.notSure = claim.notSure + 1;
                                            claim.score = claim.score + defaultValues.multipliers.notSure * myUser.userDetails.weight;
                                        }

                                        entry.rating = rating;
                                        entry.weight = myUser.userDetails.weight;
                                        entry.lastUpdated = Date.now();

                                        entry.save(function (err) {
                                            if (err) {
                                                console.log(chalk.red('Error occured while saving the entry 4564'));
                                            }
                                        });

                                        claim.lastUpdated = Date.now();
                                        claim.setOverallRating();

                                        claim.save(function (err) {
                                            if (err) {
                                                console.log(chalk.red('Error occured while saving the claim 4648'));
                                            }
                                        });

                                    } else {

                                        console.log(chalk.red('No claim found 1456'));

                                        var newClaim = new Claim({
                                            claimid: claimid,
                                            myid: targetid
                                        });

                                        if (rating == defaultValues.votes.yes) {
                                            newClaim.yes = 1;
                                            newClaim.score = defaultValues.multipliers.yes * myUser.userDetails.weight;
                                        } else if (rating == defaultValues.votes.no) {
                                            newClaim.no = 1;
                                            newClaim.score = defaultValues.multipliers.no * myUser.userDetails.weight;
                                        } else {
                                            newClaim.notSure = 1;
                                            newClaim.score = defaultValues.multipliers.notSure * myUser.userDetails.weight;
                                        }

                                        newClaim.setOverallRating();

                                        myUser.facebook.claims.push(newClaim);

                                        newClaim.save(function (err) {
                                            if (err) {
                                                console.log(chalk.red('Error occurred 1487'));
                                            }
                                        });

                                        myUser.save(function (err) {
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
                            data: claim,
                            rating: rating
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
                        data: claim,
                        rating: rating,
                        weight: myUser.userDetails.weight
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

                                    User.findOne(
                                        {
                                            _id: target.user
                                        },
                                        function (err, user) {
                                            console.log(chalk.blue("User(target): " + JSON.stringify(user, null, "\t")));

                                            user.facebook.ratedByOthers.push(newEntry);

                                            Claim.findOne({
                                                claimid: claimid,
                                                myid: targetid
                                            }, function (err, claim) {

                                                if (err) {
                                                    console.log(chalk.red("Error occurred 154"));
                                                } else {

                                                    if (claim) {

                                                        if (rating == defaultValues.votes.yes) {
                                                            claim.yes = claim.yes + 1;
                                                            claim.score = claim.score + defaultValues.multipliers.yes * myUser.userDetails.weight;
                                                        } else if (rating == defaultValues.votes.no) {
                                                            claim.no = claim.no + 1;
                                                            claim.score = claim.score + defaultValues.multipliers.no * myUser.userDetails.weight;
                                                        } else {
                                                            claim.notSure = claim.notSure + 1;
                                                            claim.score = claim.score + defaultValues.multipliers.notSure * myUser.userDetails.weight;
                                                        }

                                                        claim.lastUpdated = Date.now();
                                                        claim.setOverallRating();

                                                        claim.save(function (err) {
                                                            if (err) {
                                                                console.log(chalk.red('Error occurred 1487'));
                                                            }
                                                        });

                                                        user.save(function (err) {
                                                            if (err) {
                                                                console.log("User(target) save error: " + err);
                                                            } else {
                                                                console.log("User(target) saved successfully");
                                                            }
                                                        });

                                                    } else {

                                                        var newClaim = new Claim({
                                                            claimid: claimid,
                                                            myid: targetid
                                                        });

                                                        if (rating == defaultValues.votes.yes) {
                                                            newClaim.yes = 1;
                                                            newClaim.score = defaultValues.multipliers.yes * myUser.userDetails.weight;
                                                        } else if (rating == defaultValues.votes.no) {
                                                            newClaim.no = 1;
                                                            newClaim.score = defaultValues.multipliers.no * myUser.userDetails.weight;
                                                        } else {
                                                            newClaim.notSure = 1;
                                                            newClaim.score = defaultValues.multipliers.notSure * myUser.userDetails.weight;
                                                        }

                                                        newClaim.setOverallRating();

                                                        user.facebook.claims.push(newClaim);

                                                        newClaim.save(function (err) {
                                                            if (err) {
                                                                console.log(chalk.red('Error occurred 1487'));
                                                            }
                                                        });

                                                        user.save(function (err) {
                                                            if (err) {
                                                                console.log("User(target) save error: " + err);
                                                            } else {
                                                                console.log("User(target) saved successfully");
                                                            }
                                                        });
                                                    }
                                                }


                                            });
                                        });

                                    User.findOne(
                                        {
                                            _id: me.user
                                        },
                                        function (err, user) {
                                            console.log(chalk.blue("User(me): " + JSON.stringify(user, null, "\t")));

                                            user.facebook.ratedByMe.push(newFBRating);

                                            user.save(function (err) {
                                                if (err) {
                                                    console.log("User(me) save error: " + err);
                                                } else {
                                                    console.log("User(me) saved successfully");
                                                }
                                            });
                                        });

                                    return res.sendStatus(200);
                                }
                            });

                        }
                    });
                }
            });
    };

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
                                addRating(req, res, me, target, myUser);
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
                                                addRating(req, res, me, facebook, myUser);
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

    rateRouter.route('/getRating')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var claimid = req.body.claimid;

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
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

    rateRouter.route('/getAllRatingsCount')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
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

    //profileRating- fbid -> rating: t r c n

    rateRouter.route('/getOverallProfileRating')
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
                        }, function (err, user) {

                            console.log(chalk.green("USER: " + JSON.stringify(user, null, "\t")));

                            if (user.userDetails.overallRating) {

                                if (user.userDetails.overallRating == defaultValues.ratings.trustedUser) {
                                    res.json({success: true, ratingLevel: "T"});
                                } else if (user.userDetails.overallRating == defaultValues.ratings.untrustedUser) {
                                    res.json({success: true, ratingLevel: "R"});
                                } else {
                                    res.json({success: true, ratingLevel: "C"});
                                }

                            } else {
                                res.json({success: true, ratingLevel: "N"});
                            }

                        });

                    } else {
                        res.json({success: false, message: "No facebook account with given uid found"});
                    }
                }
            });
        });
    //profileRating

    app.use('/rate/facebook', rateRouter);

};