var chalk = require('chalk');
var mongoose = require('mongoose');
var defaultValues = require("../../config/defaultValues");

var Entry = require("../models/entry");
var Claim = require('../models/claim');
var LinkedInRatedByMe = require('../models/linkedinRatedByMe');
var LinkedIn = require("../models/linkedin");
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
     * @api {get} /rate/linkedin Test the secure api connection
     * @apiName Test
     * @apiGroup LinkedIn
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

    var addRating = function (req, res, me, target, myUser) {

        var myid = req.body.myid;
        var targetid = req.body.targetid;
        var claimid = req.body.claimid;
        var claim = req.body.claim;
        var rating = req.body.rating;

        LinkedInRatedByMe
            .findOne({
                myid: me._id,
                targetid: target._id
            }).populate({
            path: 'entries',
            match: {
                id: claimid
            }
        }).exec(function (err, linkedinRatedByMe) {

            if (linkedinRatedByMe) {
                console.log(chalk.green("Previous ratings found"));
                console.log(chalk.blue("Previous rating: " + JSON.stringify(linkedinRatedByMe, null, "\t")));

                if (linkedinRatedByMe.entries[0]) {
                    console.log('Found');

                    Entry.findOne({
                        _id: linkedinRatedByMe.entries[0]._id
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
                                    } else if (entry.rating == defaultValues.votes.no) {
                                        myClaim.no = myClaim.no - 1;
                                        myClaim.score = myClaim.score - defaultValues.multipliers.no * entry.weight;
                                    } else {
                                        myClaim.notSure = myClaim.notSure - 1;
                                        myClaim.score = myClaim.score - defaultValues.multipliers.notSure * entry.weight;
                                    }

                                    //add the new rating and score to the myClaim
                                    if (rating == defaultValues.votes.yes) {
                                        myClaim.yes = myClaim.yes + 1;
                                        myClaim.score = myClaim.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                    } else if (rating == defaultValues.votes.no) {
                                        myClaim.no = myClaim.no + 1;
                                        myClaim.score = myClaim.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                    } else {
                                        myClaim.notSure = myClaim.notSure + 1;
                                        myClaim.score = myClaim.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                    }

                                    entry.rating = rating;
                                    entry.weight = myUser.linkedin.weight;
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

                                } else {

                                    console.log(chalk.red('No myClaim found 1456'));

                                    var newClaim = new Claim({
                                        claimid: claimid,
                                        claim: claim,
                                        myid: targetid
                                    });

                                    if (rating == defaultValues.votes.yes) {
                                        newClaim.yes = 1;
                                        newClaim.score = defaultValues.multipliers.yes * myUser.linkedin.weight;
                                    } else if (rating == defaultValues.votes.no) {
                                        newClaim.no = 1;
                                        newClaim.score = defaultValues.multipliers.no * myUser.linkedin.weight;
                                    } else {
                                        newClaim.notSure = 1;
                                        newClaim.score = defaultValues.multipliers.notSure * myUser.linkedin.weight;
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
                        claim: claim,
                        rating: rating,
                        weight: myUser.linkedin.weight
                    });

                    entry.save(function (err) {

                        if (err) {
                            console.log("Error: " + err);
                        } else {
                            linkedinRatedByMe.entries.push(entry);

                            linkedinRatedByMe.save(function (err) {
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

                                                user.linkedin.ratedByOthers.push(entry);

                                                var newClaim = new Claim({
                                                    claimid: claimid,
                                                    myid: targetid
                                                });

                                                if (rating == defaultValues.votes.yes) {
                                                    newClaim.yes = 1;
                                                    newClaim.score = defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                } else if (rating == defaultValues.votes.no) {
                                                    newClaim.no = 1;
                                                    newClaim.score = defaultValues.multipliers.no * myUser.linkedin.weight;
                                                } else {
                                                    newClaim.notSure = 1;
                                                    newClaim.score = defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                }

                                                newClaim.setOverallRating();

                                                user.linkedin.claims.push(newClaim);

                                                newClaim.save(function (err) {
                                                    if (err) {
                                                        console.log(chalk.red('Error occurred 1487'));
                                                    }
                                                });

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
                    weight: myUser.linkedin.weight
                });

                newEntry.save(function (err) {

                    if (err) {
                        console.log(chalk.red("Error saving the entry"));
                        return res.json({err: "Error saving the entry"});
                    } else {

                        var newLIRating = new LinkedInRatedByMe({
                            myid: me._id,
                            targetid: target._id,
                            entries: [newEntry._id]
                        });

                        newLIRating.save(function (err) {
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

                                        user.linkedin.ratedByOthers.push(newEntry);

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
                                                        myClaim.score = myClaim.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                    } else if (rating == defaultValues.votes.no) {
                                                        myClaim.no = myClaim.no + 1;
                                                        myClaim.score = myClaim.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                                    } else {
                                                        myClaim.notSure = myClaim.notSure + 1;
                                                        myClaim.score = myClaim.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                    }

                                                    myClaim.lastUpdated = Date.now();
                                                    myClaim.setOverallRating();

                                                    myClaim.save(function (err) {
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
                                                        claim: claim,
                                                        myid: targetid
                                                    });

                                                    if (rating == defaultValues.votes.yes) {
                                                        newClaim.yes = 1;
                                                        newClaim.score = defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                    } else if (rating == defaultValues.votes.no) {
                                                        newClaim.no = 1;
                                                        newClaim.score = defaultValues.multipliers.no * myUser.linkedin.weight;
                                                    } else {
                                                        newClaim.notSure = 1;
                                                        newClaim.score = defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                    }

                                                    newClaim.setOverallRating();

                                                    user.linkedin.claims.push(newClaim);

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

                                        user.linkedin.ratedByMe.push(newLIRating);

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

    /**
     * @api {post} /rate/linkedin/addRating Adds a new LinkedIn rating or update an existing one.
     * @apiName AddRating
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} myid The LinkedIn User ID of the user who is rating.
     * @apiParam {String} targetid The LinkedIn User ID of the user who is getting rated.
     * @apiParam {String} claimid The LinkedIn Claim ID.
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


            LinkedIn.findOne({
                uid: myid
            }, function (err, me) {
                if (me) {
                    console.log(chalk.yellow("User found: " + JSON.stringify(me, null, "\t")));

                    LinkedIn.findOne({
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

                            console.log(chalk.red("Target not found. Creating a new LinkedIn account."));

                            var linkedin = new LinkedIn();
                            var newUser = new User();

                            linkedin.uid = targetid;
                            linkedin.user = newUser._id;

                            linkedin.save(function (err) {
                                if (err) {
                                    return res.json({message: "Target with uid=" + targetid + " not found and LinkedIn cannot be created"});
                                } else {

                                    newUser.userDetails.linkedin = linkedin._id;

                                    newUser.save(function (err) {
                                        if (err) {
                                            return res.json({message: "Target with uid=" + targetid + " not found and User cannot be created"});
                                        } else {
                                            User.findOne({
                                                _id: me.user
                                            }, function (err, myUser) {
                                                addRating(req, res, me, linkedin, myUser);
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
     * @api {post} /rate/linkedin/getRating Returns the ratings of a claim.
     * @apiName GetRating
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid The LinkedIn User ID of the target user.
     * @apiParam {String} claimid The LinkedIn Claim ID.
     *
     */
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

    /**
     * @api {post} /rate/linkedin/getAllRatingsCount Get sum of Yes, No, NotSure counts of all claims made by the target user.
     * @apiName GetAllRatingsCount
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid The LinkedIn User ID of the target user.
     *
     */
    rateRouter.route('/getAllRatingsCount')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user.userDetails.linkedin) {
                    targetid = req.user.userDetails.linkedin.uid;
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
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid The LinkedIn User ID of the target user.
     *
     */
    rateRouter.route('/getOverallProfileRating')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user.userDetails.linkedin) {
                    targetid = req.user.userDetails.linkedin.uid;
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

            LinkedIn.findOne({
                uid: targetid
            }, function (err, linkedin) {

                if (err) {
                    console.log("Error occured 46488");
                    res.json({success: false, message: "Error occurred"});
                } else {
                    if (linkedin) {

                        User.findOne({
                            _id: linkedin.user
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
                        res.json({success: false, message: "No linkedin account with given targetid found"});
                    }
                }
            });
        });

    /**
     * @api {post} /rate/linkedin/getAllRatedClaims Returns all of the claims of the target user that are rated.
     * @apiName GetAllRatedClaims
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid The LinkedIn User ID of the target user.
     *
     */
    rateRouter.route('/getAllRatedClaims')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user.userDetails.linkedin) {
                    targetid = req.user.userDetails.linkedin.uid;
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
     * @api {post} /rate/linkedin/getLastRatedClaims Returns the last updated Claims of the target user.
     * @apiName GetLastRatedClaims
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid The LinkedIn User ID of the target user.
     * @apiParam {Number} limit The number of results needed. If the value is invalid, default value will be used.
     * @apiParam {Number} order -1 for descending order and 1 for ascending order. Default value is -1.
     *
     */
    rateRouter.route('/getLastRatedClaims')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var limit = req.body.limit;
            var order = req.body.order;

            if (!targetid) {
                if (req.user.userDetails.linkedin) {
                    targetid = req.user.userDetails.linkedin.uid;
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
     * @api {post} /rate/linkedin/getLastEntries Returns the last updated Entries of the target user.
     * @apiName GetLastEntries
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid The LinkedIn User ID of the target user.
     * @apiParam {Number} limit The number of results needed. If the value is invalid, default value will be used.
     * @apiParam {Number} order -1 for descending order and 1 for ascending order. Default value is -1.
     *
     */
    rateRouter.route('/getLastEntries')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var limit = req.body.limit;
            var order = req.body.order;

            if (!targetid) {
                if (req.user.userDetails.linkedin) {
                    targetid = req.user.userDetails.linkedin.uid;
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

            LinkedIn.findOne({uid: targetid}, function (err, linkedin) {
                if (err) {
                    console.log("Error occured 49841");
                    res.json({success: false, message: "Error occurred"});
                } else {
                    if (linkedin) {
                        console.log(chalk.blue("LinkedIn found: " + JSON.stringify(linkedin, null, "\t")));

                        Entry.find({
                            targetid: linkedin._id
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
                        res.json({success: true, message: "No linkedin account found."});
                    }
                }
            });


        });

    /**
     * @api {post} /rate/linkedin/getAllRatingsByMe Returns the all ratings done by a target user.
     * @apiName GetAllRatingsByMe
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid The Facebook User ID of the target user.
     *
     */
    rateRouter.route('/getAllRatingsByUser')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user.userDetails.linkedin) {
                    targetid = req.user.userDetails.linkedin.uid;
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

            LinkedIn.findOne({
                uid: targetid
            }, function (err, linkedin) {
                if (err) {
                    console.log("Error occurred");
                    res.json({success: false, message: "Error occurred"});
                } else {
                    if (linkedin) {
                        LinkedInRatedByMe.findOne({
                            myid: linkedin._id
                        }).populate({
                            path: 'entries'
                        }).select('entries')
                            .exec(function (err, liRatedByMe) {
                                if (err) {
                                    console.log("Error occurred");
                                    res.json({success: false, message: "Error occurred"});
                                } else {
                                    if (liRatedByMe) {
                                        console.log(chalk.blue("liRatedByMe found: " + JSON.stringify(liRatedByMe, null, "\t")));
                                        res.json({success: true, data: liRatedByMe.entries});
                                    } else {
                                        console.log("liRatedByMe not found");
                                        res.json({success: false, message: "liRatedByMe not found"});
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

    app.use('/rate/linkedin', rateRouter);

};