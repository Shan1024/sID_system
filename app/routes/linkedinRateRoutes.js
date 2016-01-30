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

    var addRating = function (req, res, me, target, myUser, targetUser) {

        var myid = req.body.myid;
        var targetid = req.body.targetid;
        var claimid = req.body.claimid;
        var claim = req.body.claim;
        var rating = req.body.rating;

        //If an enty already exists
        Entry.findOne({
            claimid: claimid,
            mysid: myid,
            targetsid: targetid
        }, function (err, entry) {

            if (err) {
                console.log(chalk.red('Error occurred 9446151'));
                return res.json({success: false, message: "Error occurred"});
            } else {
                if (entry) {
                    console.log(chalk.yellow('Entry found'));

                    Claim.findOne({
                        claimid: claimid,
                        myid: targetid
                    }, function (err, myClaim) {

                        if (err) {
                            console.log(chalk.red('Error occurred 7984512'));
                            return res.json({success: false, message: "Error occurred"});
                        } else {

                            if (myClaim) {

                                //remove the current rating and score from the myClaim
                                if (entry.rating == defaultValues.votes.yes) {
                                    myClaim.yes = myClaim.yes - 1;
                                    myClaim.score = myClaim.score - defaultValues.multipliers.yes * entry.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score - defaultValues.multipliers.yes * entry.weight;
                                } else if (entry.rating == defaultValues.votes.no) {
                                    myClaim.no = myClaim.no - 1;
                                    myClaim.score = myClaim.score - defaultValues.multipliers.no * entry.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score - defaultValues.multipliers.no * entry.weight;
                                } else {
                                    myClaim.notSure = myClaim.notSure - 1;
                                    myClaim.score = myClaim.score - defaultValues.multipliers.notSure * entry.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score - defaultValues.multipliers.no * entry.weight;
                                }

                                //add the new rating and score to the myClaim
                                if (rating == defaultValues.votes.yes) {
                                    myClaim.yes = myClaim.yes + 1;
                                    myClaim.score = myClaim.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                } else if (rating == defaultValues.votes.no) {
                                    myClaim.no = myClaim.no + 1;
                                    myClaim.score = myClaim.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                } else {
                                    myClaim.notSure = myClaim.notSure + 1;
                                    myClaim.score = myClaim.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                }

                                entry.rating = rating;
                                entry.weight = myUser.linkedin.weight;
                                entry.lastUpdated = Date.now();

                                entry.save(function (err) {
                                    if (err) {
                                        console.log(chalk.red('Error occurred while saving the entry 4564'));
                                        return res.json({success: false, message: "Error occurred"});
                                    }
                                });

                                myClaim.lastUpdated = Date.now();
                                myClaim.setOverallRating();

                                myClaim.save(function (err) {
                                    if (err) {
                                        console.log(chalk.red('Error occured while saving the myClaim 4648'));
                                        return res.json({success: false, message: "Error occurred"});
                                    }
                                });

                                targetUser.setOverallLinkedInRating();
                                targetUser.save(function (err) {
                                    if (err) {
                                        console.log("targetUser save error: " + err);
                                        return res.json({success: false, message: "Error occurred"});
                                    } else {
                                        console.log("targetUser saved successfully");
                                        return res.json({
                                            success: true,
                                            myid: myid,
                                            targetid: targetid,
                                            claimid: claimid,
                                            claim: claim,
                                            rating: rating
                                        });
                                    }
                                });

                                //rating without a claim
                            } else {

                                console.log(chalk.red('No myClaim found 1456'));
                                console.log(chalk.red("ERROR XXXXX++++++++++++++++++++++++++++++++++++++++++++++ 984151513"));

                                var newClaim = new Claim({
                                    claimid: claimid,
                                    claim: claim,
                                    myid: targetid
                                });

                                if (rating == defaultValues.votes.yes) {
                                    newClaim.yes = 1;
                                    newClaim.score = defaultValues.multipliers.yes * myUser.linkedin.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                } else if (rating == defaultValues.votes.no) {
                                    newClaim.no = 1;
                                    newClaim.score = defaultValues.multipliers.no * myUser.linkedin.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                } else {
                                    newClaim.notSure = 1;
                                    newClaim.score = defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                    targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                }

                                newClaim.setOverallRating();
                                newClaim.save(function (err) {
                                    if (err) {
                                        console.log(chalk.red('Error occurred 1487'));
                                        return res.json({success: false, message: "Error occurred"});
                                    }
                                });

                                entry.rating = rating;
                                entry.weight = myUser.linkedin.weight;
                                entry.lastUpdated = Date.now();

                                entry.save(function (err) {
                                    if (err) {
                                        console.log(chalk.red('Error occured while saving the entry 4564'));
                                        return res.json({success: false, message: "Error occurred"});
                                    }
                                });

                                targetUser.linkedin.claims.push(newClaim);
                                targetUser.setOverallLinkedInRating();
                                targetUser.save(function (err) {
                                    if (err) {
                                        console.log("myUser save error: " + err);
                                        return res.json({success: false, message: "Error occurred"});
                                    } else {
                                        console.log("myUser saved successfully");
                                        return res.json({
                                            success: true,
                                            myid: myid,
                                            targetid: targetid,
                                            claimid: claimid,
                                            claim: claim,
                                            rating: rating
                                        });
                                    }
                                });
                            }
                        }
                    });

                    //If no entry is found
                } else {

                    var newEntry = new Entry({
                        claimid: claimid,
                        mysid: myid,
                        myid: me._id,
                        targetsid: targetid,
                        targetid: target._id,
                        claim: claim,
                        rating: rating,
                        weight: myUser.linkedin.weight
                    });

                    LinkedInRatedByMe.findOne({
                        myid: me._id,
                        targetid: target._id
                    }, function (err, linkedinRatedByMe) {

                        if (err) {
                            console.log(chalk.red('Error occurred 941651218'));
                            return res.json({success: false, message: "Error occurred"});
                        } else {

                            //user has already rated some of the claims of the target
                            if (linkedinRatedByMe) {
                                console.log(chalk.yellow('LinkedInRatedByMe found'));

                                newEntry.save(function (err) {

                                    if (err) {
                                        console.log("Error: " + err);
                                        return res.json({success: false, message: "Error occurred"});
                                    } else {

                                        linkedinRatedByMe.entries.push(newEntry);

                                        linkedinRatedByMe.save(function (err) {

                                            if (err) {
                                                console.log("Error 41518");
                                                return res.json({success: false, message: "Error occurred"});
                                            } else {
                                                //console.log(chalk.blue("User: " + JSON.stringify(user, null, "\t")));

                                                console.log("no error");

                                                targetUser.linkedin.ratedByOthers.push(newEntry);

                                                Claim.findOne({
                                                    claimid: claimid,
                                                    myid: targetid
                                                }, function (err, myClaim) {
                                                    if (err) {

                                                    } else {
                                                        if (myClaim) {

                                                            if (rating == defaultValues.votes.yes) {
                                                                myClaim.yes = myClaim.yes + 1;
                                                                myClaim.score = myClaim.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                            } else if (rating == defaultValues.votes.no) {
                                                                myClaim.no = myClaim.no + 1;
                                                                myClaim.score = myClaim.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                                            } else {
                                                                myClaim.notSure = myClaim.notSure + 1;
                                                                myClaim.score = myClaim.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                            }

                                                            myClaim.lastUpdated = Date.now();
                                                            myClaim.setOverallRating();

                                                            myClaim.save(function (err) {
                                                                if (err) {
                                                                    console.log(chalk.red('Error occured while saving the myClaim 4648'));
                                                                    return res.json({
                                                                        success: false,
                                                                        message: "Error occurred"
                                                                    });
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
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                            } else if (rating == defaultValues.votes.no) {
                                                                newClaim.no = 1;
                                                                newClaim.score = defaultValues.multipliers.no * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                                            } else {
                                                                newClaim.notSure = 1;
                                                                newClaim.score = defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                            }

                                                            newClaim.setOverallRating();

                                                            newClaim.save(function (err) {
                                                                if (err) {
                                                                    console.log(chalk.red('Error occurred 1487'));
                                                                    return res.json({
                                                                        success: false,
                                                                        message: "Error occurred"
                                                                    });
                                                                }
                                                            });

                                                            targetUser.linkedin.claims.push(newClaim);
                                                            targetUser.setOverallLinkedInRating();
                                                            targetUser.save(function (err) {
                                                                if (err) {
                                                                    console.log("User save error: " + err);
                                                                    return res.json({
                                                                        success: false,
                                                                        message: "Error occurred"
                                                                    });
                                                                } else {
                                                                    console.log("User saved successfully");
                                                                    return res.json({
                                                                        success: true,
                                                                        myid: myid,
                                                                        targetid: targetid,
                                                                        claimid: claimid,
                                                                        claim: claim,
                                                                        rating: rating
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });

                                //user haven't rated target before
                            } else {

                                newEntry.save(function (err) {

                                    if (err) {
                                        console.log("Error occurred 489421");
                                        return res.json({success: false, message: "Error occurred"});
                                    } else {

                                        var newLinkedInRating = new LinkedInRatedByMe({
                                            myid: me._id,
                                            targetid: target._id,
                                            entries: [newEntry._id]
                                        });

                                        newLinkedInRating.save(function (err) {

                                            if (err) {
                                                console.log("User not found: " + err);
                                                return res.json({success: false, message: "Error occurred"});
                                            } else {

                                                targetUser.linkedin.ratedByOthers.push(newEntry);

                                                Claim.findOne({
                                                    claimid: claimid,
                                                    myid: targetid
                                                }, function (err, myClaim) {
                                                    if (err) {

                                                    } else {
                                                        if (myClaim) {

                                                            if (rating == defaultValues.votes.yes) {
                                                                myClaim.yes = myClaim.yes + 1;
                                                                myClaim.score = myClaim.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                            } else if (rating == defaultValues.votes.no) {
                                                                myClaim.no = myClaim.no + 1;
                                                                myClaim.score = myClaim.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                                            } else {
                                                                myClaim.notSure = myClaim.notSure + 1;
                                                                myClaim.score = myClaim.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                            }

                                                            myClaim.lastUpdated = Date.now();
                                                            myClaim.setOverallRating();

                                                            myClaim.save(function (err) {
                                                                if (err) {
                                                                    console.log(chalk.red('Error occured while saving the myClaim 4648'));
                                                                    return res.json({
                                                                        success: false,
                                                                        message: "Error occurred"
                                                                    });
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
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.yes * myUser.linkedin.weight;
                                                            } else if (rating == defaultValues.votes.no) {
                                                                newClaim.no = 1;
                                                                newClaim.score = defaultValues.multipliers.no * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.no * myUser.linkedin.weight;
                                                            } else {
                                                                newClaim.notSure = 1;
                                                                newClaim.score = defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                                targetUser.linkedin.score = targetUser.linkedin.score + defaultValues.multipliers.notSure * myUser.linkedin.weight;
                                                            }

                                                            newClaim.setOverallRating();

                                                            newClaim.save(function (err) {
                                                                if (err) {
                                                                    console.log(chalk.red('Error occurred 1487'));
                                                                    return res.json({
                                                                        success: false,
                                                                        message: "Error occurred"
                                                                    });
                                                                }
                                                            });

                                                            targetUser.linkedin.claims.push(newClaim);
                                                            targetUser.setOverallLinkedInRating();
                                                            targetUser.save(function (err) {
                                                                if (err) {
                                                                    console.log("User save error: " + err);
                                                                    return res.json({
                                                                        success: false,
                                                                        message: "Error occurred"
                                                                    });
                                                                } else {
                                                                    console.log("User saved successfully");
                                                                }
                                                            });

                                                            myUser.linkedin.ratedByMe.push(newLinkedInRating);

                                                            myUser.save(function (err) {
                                                                if (err) {
                                                                    console.log("User(me) save error: " + err);
                                                                    return res.json({
                                                                        success: false,
                                                                        message: "Error occurred"
                                                                    });
                                                                } else {
                                                                    console.log("User(me) saved successfully");

                                                                    return res.json({
                                                                        success: true,
                                                                        myid: myid,
                                                                        targetid: targetid,
                                                                        claimid: claimid,
                                                                        claim: claim,
                                                                        rating: rating
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
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
                                User.findOne({
                                    _id: target.user
                                }, function (err, targetUser) {
                                    addRating(req, res, me, target, myUser, targetUser);
                                });
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
                                                User.findOne({
                                                    _id: linkedin.user
                                                }, function (err, targetUser) {
                                                    addRating(req, res, me, linkedin, myUser, targetUser);
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
     * @api {post} /rate/linkedin/getComments Returns all the comments of a user.
     * @apiName GetComments
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The Linked in User ID of the target user. If this is not provided, targetid will be set to current User ID.
     * @apiParam {String} [myid] The Linkedin User ID of the logged in user.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "comments": ["this is a comment",...]
     *    }
     *
     */
    rateRouter.route('/getComments')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var viewerid = req.body.myid;

            if (!targetid) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: false,
                            message: "Comments not found"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "Comments not found"
                    });
                }
            }

            Comment.find({
                targetsid: targetid,
				claimid: null
            }, function (err, comments) {
                if (err) {
                    console.log(chalk.red("Error occurred 8975") + " " + commentid + " " + targetid + " " + viewerid + err);
                    res.json({
                        success: false,
                        message: "Error occurred"
                    });
                } else {
                    if (comments) {
                        return res.json({
                            success: true,
                            comments: comments
                        });
                    } else {
                        return res.json({
                            success: false,
                            message: "Unexpected error"
                        });
                    }

                }
            });
        });

	/**
     * @api {post} /rate/linkedin/getClaimComments Returns all the comments of a users claims.
     * @apiName GetClaimComments
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The LinkedIn User ID of the target user. If this is not provided, targetid will be set to current User ID.
     * @apiParam {String} [myid] The LinkedIn User ID of the logged in user.
	 * @apiParam {String} [claimid] The LinkedIn claim ID of the associated claim.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "comments": ["this is a comment",...]
     *    }
     *
     */
    rateRouter.route('/getClaimComments')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var viewerid = req.body.myid;
			var claimid = req.body.claimid;
			
			if(!claimid){
				return res.json({success: false, message: "claim id not defined"});
			}

            if (!targetid) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: false,
                            message: "Comments not found"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "Comments not found"
                    });
                }
            }

            Comment.find({
                targetsid: targetid,
				claimid: claimid
            }, function (err, comments) {
                if (err) {
                    console.log(chalk.red("Error occurred 8975") + " " + commentid + " " + targetid + " " + viewerid + err);
                    res.json({
                        success: false,
                        message: "Error occurred"
                    });
                } else {
                    if (comments) {
                        return res.json({
                            success: true,
                            comments: comments
                        });
                    } else {
                        return res.json({
                            success: false,
                            message: "Unexpected error"
                        });
                    }

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
     * @apiParam {String} [myid] The LinkedIn User ID of the logged in user.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "yes": 0,
     *         "no": 0,
     *         "notSure": 1,
     *         "overallRating": 0,
     *         "claimScore": "C",
	 *		   "my rating : -1"
     *    }
     *
     */
    rateRouter.route('/getRating')
        .post(function (req, res) {

            var targetid = req.body.targetid;
            var claimid = req.body.claimid;
            var viewerid = req.body.myid;

            if (!targetid) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: false,
                            message: "Claim not found",
                            yes: 0,
                            no: 0,
                            notSure: 0,
                            overallRating: 0,
                            claimScore: "N"
                        });
                    }
                } else {
                    return res.json({
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

            if (!claimid) {
                return res.json({error: "Missing claimid parameter"});
            }

            Claim.findOne({
                claimid: claimid,
                myid: targetid
            }, function (err, claim) {
                if (err) {
                    console.log(chalk.red("Error occurred 8975"));
                    res.json({
                        success: false,
                        message: "Error occurred",
                        yes: 0,
                        no: 0,
                        notSure: 0,
                        overallRating: 0,
                        claimScore: "N"
                    });
                } else {
                    if (claim) {

                        var character;

                        if (claim.overallRatingLevel == defaultValues.ratings.trustedUser) {
                            character = "T";
                        } else if (claim.overallRatingLevel == defaultValues.ratings.untrustedUser) {
                            character = "R";
                        } else {
                            character = "C";
                        }

                        /**Added by Dodan*/

                        Entry.findOne({
                            claimid: claimid,
                            targetsid: targetid,
                            mysid: viewerid
                        }, function (err, entry) {
                            var myrating;
                            if (err) {
                                //do nothingg
                                console.log(chalk.red("Error occurred when getting entry"));
                            } else {
                                if (entry) {
                                    myrating = entry.rating;
                                }
                            }
                            res.json({
                                success: true,
                                yes: claim.yes,
                                no: claim.no,
                                notSure: claim.notSure,
                                overallRating: claim.overallRatingLevel,
                                claimScore: character,
                                myrating: myrating
                            });
                        });

                        /** Addition done*/
                        /*** Commented by Dodan

                         res.json({
                            success: true,
                            yes: claim.yes,
                            no: claim.no,
                            notSure: claim.notSure,
                            overallRating: claim.overallRatingLevel,
                            claimScore: character
                        });*/

                    } else {
                        console.log(chalk.red("Claim not found"));
                        return res.json({
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
     * @apiParam {String} [targetid] The LinkedIn User ID of the target user. If this is not provided, targetid will be set to current User ID.
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
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account is linked",
                            id: targetid,
                            claimsCount: 0,
                            yes: 0,
                            notSure: 0,
                            no: 0
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No user found in the session",
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
     * @api {post} /rate/linkedin/getOverallProfileRating Returns the overall profile rating as one of T, R, C, N characters.
     * @apiName GetOverallProfileRating
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} targetid The LinkedIn User ID of the target user.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         success: true,
     *         ratingLevel: "N"
     *     }
     */
    rateRouter.route('/getOverallProfileRating')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account is linked",
                            ratingLevel: "N"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No targetid provided or found in the session",
                        ratingLevel: "N"
                    });
                }
            }

            LinkedIn.findOne({
                uid: targetid
            }, function (err, linkedin) {

                if (err) {
                    console.log("Error occured 46488");
                    return res.json({
                        success: false,
                        message: "Error occurred",
                        ratingLevel: "N"
                    });
                } else {
                    if (linkedin) {

                        User.findOne({
                            _id: linkedin.user
                        }, function (err, user) {

                            if (err) {
                                return res.json({
                                    success: false,
                                    message: "Error occurred",
                                    ratingLevel: "N"
                                });
                            } else {
                                console.log(chalk.green("USER: " + JSON.stringify(user, null, "\t")));

                                console.log("overallRatingLevel: " + user.linkedin.overallRatingLevel);

                                var temp = user.linkedin.overallRatingLevel;

                                if (temp == defaultValues.ratings.trustedUser || temp == defaultValues.ratings.untrustedUser || temp == defaultValues.ratings.averageUser) {

                                    console.log("overallRatingLevel: " + user.linkedin.overallRatingLevel);

                                    if (user.linkedin.overallRatingLevel == defaultValues.ratings.trustedUser) {
                                        res.json({success: true, ratingLevel: "T"});
                                    } else if (user.linkedin.overallRatingLevel == defaultValues.ratings.untrustedUser) {
                                        res.json({success: true, ratingLevel: "R"});
                                    } else {
                                        res.json({success: true, ratingLevel: "C"});
                                    }

                                } else {
                                    res.json({success: true, ratingLevel: "N"});
                                }
                            }
                        });

                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account with given targetid found",
                            ratingLevel: "N"
                        });
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
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account is linked."
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No targetid provided and not found in session"
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
                        res.json({
                            success: true,
                            data: claims
                        });
                    } else {
                        res.json({
                            success: false,
                            message: "No claims found."
                        });
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
     * @apiParam {String} [targetid] The LinkedIn User ID of the target user. If this is not provided, targetid will be set to current User ID.
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
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account is linked"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "Error occurred"
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
                            return res.json({
                                success: false,
                                message: "Error occurred"
                            });
                        } else {
                            if (claims) {
                                console.log(chalk.blue("Claims found: " + JSON.stringify(claims, null, "\t")));
                                res.json({success: true, data: claims});
                            } else {
                                return res.json({
                                    success: false,
                                    message: "No claims user found."
                                });
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
     * @apiParam {String} [targetid] The LinkedIn User ID of the target user. If this is not provided, targetid will be set to current User ID.
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
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: false,
                            message: "LinkedIn is not linked"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No user found in the session",
                        id: targetid
                    });
                }
            }

            if (limit <= 0) {
                limit = defaultValues.entriesLimit;
            }
            if (!limit) {
                return res.json({error: "Missing limit paramter"});
            }


            if (!(order == 1 || order == -1)) {
                order = defaultValues.defaultOrder;
            }
            if (!order) {
                return res.json({error: "Missing order paramter"});
            }

            LinkedIn.findOne({
                uid: targetid
            }, function (err, linkedin) {
                if (err) {
                    console.log("Error occured 49841");
                    res.json({success: false, message: "Error occurred"});
                } else {
                    if (linkedin) {
                        console.log(chalk.blue("LinkedIn found: " + JSON.stringify(linkedin, null, "\t")));

                        Entry.find({
                            targetid: targetid
                        }).select('claimid lastUpdated data rating')
                            .sort({lastUpdated: order})
                            .limit(limit)
                            .exec(
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
     * @api {post} /rate/linkedin/getAllRatingsByUser Returns the all ratings done by a target user.
     * @apiName getAllRatingsByUser
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The LinkedIn User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         "success": true,
     *         "data": [
     *               "_id": "569dcce93317079e5a39f790",
     *               "myid": "56924c209980c72f3a52d0ff",
     *               "targetid": {
     *                 "_id": "569dcce93317079e5a39f78d",
     *                 "uid": {ID},
     *                 "name": {NAME}
     *               },
     *               "entries": [
     *                     {
     *                          "_id": "569dcce93317079e5a39f78f",
     *                          "mysid": "{ID}",
     *                          "targetsid": "{ID}",
     *                          "claim": {CLAIM},
     *                          "rating": 1,
     *                          "weight": 2,
     *                          "__v": 0,
     *                          "lastUpdated": "2016-01-19T05:43:05.665Z"
     *                     },
     *               ]
     *         ]
     *     }
     *
     */
    rateRouter.route('/getAllRatingsByUser')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: true,
                            message: "No linkedin account is linked"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No user found in the session"
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
                        LinkedInRatedByMe
                            .find({
                                myid: linkedin._id
                            })
                            .populate({
                                    path: 'entries',
                                    select: '-claimid -myid -targetid'
                                    //populate: {path: 'targetid', model: "LinkedIn", select: 'uid name'}
                                }
                                //,
                                //{
                                //    path: "targetid",
                                //    model: "LinkedIn"
                                //}
                            ).populate({
                                path: 'targetid',
                                select: 'uid name url photo'
                            })
                            //.select('entries')
                            .exec(function (err, linkedinRatedByMe) {
                                if (err) {
                                    console.log("Error occurred");
                                    res.json({success: false, message: "Error occurred"});
                                } else {
                                    if (linkedinRatedByMe) {
                                        console.log(chalk.blue("linkedinRatedByMe found: " + JSON.stringify(linkedinRatedByMe, null, "\t")));
                                        //console.log("test: " + linkedinRatedByMe[0].entries);
                                        res.json({success: true, data: linkedinRatedByMe.reverse()});
                                    } else {
                                        console.log("linkedinRatedByMe not found");
                                        res.json({success: false, message: "linkedinRatedByMe not found"});
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

    /**
     * @api {post} /rate/linkedin/getAllUsersRatedByMeCount Returns the number of users rated by the given user.
     * @apiName getAllUsersRatedByMeCount
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The LinkedIn User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *          "success": true,
     *          "count": 6
     *     }
     *
     */
    rateRouter.route('/getAllUsersRatedByMeCount')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: true,
                            message: "No linkedin account is linked"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No user found in the session"
                    });
                }
            }

            LinkedIn.findOne({
                uid: targetid
            }, function (err, linkedin) {

                if (err) {
                    return res.json({
                        success: false,
                        message: "Error occurred"
                    });
                } else {

                    if (linkedin) {
                        LinkedInRatedByMe
                            .find({
                                myid: linkedin._id
                            })
                            //.populate({
                            //    path: 'targetid',
                            //    select:'name uid'
                            //})
                            //.select('targetid')
                            .exec(function (err, linkedinRatedByMes) {
                                console.log(chalk.blue("linkedinRatedByMes found: " + JSON.stringify(linkedinRatedByMes, null, "\t")));
                                return res.json({
                                    success: true,
                                    count: linkedinRatedByMes.length
                                });

                            });
                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account for the given id found"
                        });
                    }
                }

            });

        });

    /**
     * @api {post} /rate/linkedin/getAllUsersRatedByMe Returns the users who are rated by the given user.
     * @apiName getAllUsersRatedByMe
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The LinkedIn User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *          "success": true,
     *          "data": [
     *              {
     *                  "_id": "56893cf746360ad81347544a",
     *                  "targetid": {
     *                      "_id": "56893cf746360ad813475447",
     *                      "uid": "100000211592969",
     *                      "name": "Malith Shan Mahanama"
     *                  }
     *              },
     *          ]
     *     }
     *
     */
    rateRouter.route('/getAllUsersRatedByMe')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: true,
                            message: "No linkedin account is linked"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No user found in the session"
                    });
                }
            }

            LinkedIn.findOne({
                uid: targetid
            }, function (err, linkedin) {

                if (err) {
                    return res.json({
                        success: false,
                        message: "Error occurred"
                    });
                } else {

                    if (linkedin) {
                        LinkedINRatedByMe
                            .find({
                                myid: linkedin._id
                            })
                            .populate({
                                path: 'targetid',
                                select: 'name uid -_id'
                            })
                            .select('targetid -_id')
                            .exec(function (err, linkedinRatedByMes) {
                                console.log(chalk.blue("linkedinRatedByMes found: " + JSON.stringify(linkedinRatedByMes, null, "\t")));
                                return res.json({
                                    success: true,
                                    data: linkedinRatedByMes
                                });

                            });
                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account for the given id found"
                        });
                    }
                }

            });

        });


    /**
     * @api {post} /rate/linkedin/getAllClaimsRatedByMeCount Returns the number of claims that the target user has rated.
     * @apiName getAllClaimsRatedByMeCount
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} [targetid] The LinkedIn User ID of the target user. If this is not provided, targetid will be set to current User ID.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *          "success": true,
     *          "count": 6
     *     }
     *
     */
    rateRouter.route('/getAllClaimsRatedByMeCount')
        .post(function (req, res) {

            var targetid = req.body.targetid;

            if (!targetid) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        targetid = req.user.userDetails.linkedin.uid;
                    } else {
                        return res.json({
                            success: true,
                            message: "No linkedin account is linked"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No user found in the session"
                    });
                }
            }

            LinkedIn.findOne({
                uid: targetid
            }, function (err, linkedin) {

                if (err) {
                    return res.json({
                        success: false,
                        message: "Error occurred"
                    });
                } else {

                    if (linkedin) {

                        LinkedIn
                            .find({
                                myid: linkedin._id
                            })
                            //.populate({
                            //    path: 'targetid',
                            //    select:'name uid'
                            //})
                            //.select('entries')
                            .exec(function (err, linkedinRatedByMes) {
                                //console.log(chalk.blue("linkedinRatedByMes found: " + JSON.stringify(linkedinRatedByMes, null, "\t")));
                                var count = 0;

                                for (var i = 0; i < linkedinRatedByMes.length; i++) {
                                    if (linkedinRatedByMes[i].entries) {
                                        count += linkedinRatedByMes[i].entries.length;
                                    }
                                }
                                return res.json({
                                    success: true,
                                    count: count
                                });

                            });

                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account for the given id found"
                        });
                    }
                }

            });

        });


    /**
     * Written By Dodan, Delete route if problems arise
     * @api {post} /rate/linkedin/getUrl Returns the linkedin url given the email address.
     * @apiName getUrl
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} email The LinkedIn sid user email of the user.
     *
     */
    rateRouter.route('/getUrl')
        .post(function (req, res) {

            var email = req.body.email;

            console.log("Email: " + email);

            if (!email) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        email = req.user.userDetails.linkedin.email;
                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account is linked"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No user found in the session"
                    });
                }
            }

            User.findOne({
                'userDetails.local.email': email
            }).populate({
                path: 'userDetails.linkedin'
            }).exec(function (err, user) {

                console.log(chalk.blue("User: " + JSON.stringify(user, null, "\t")));

                if (err) {
                    return res.json({success: false, message: "Error occurred"});
                } else {
                    if (user) {
                        var url;
                        if (user.userDetails.linkedin) {
                            url = user.userDetails.linkedin.url;
                        }
                        return res.json({success: true, url: url});
                    } else {

                    }
                }
            });
        });
	
	
	/**
     * Written By Dodan, Delete route if problems arise
     * @api {post} /rate/linkedin/getId Returns the linkedin id given the email address.
     * @apiName getId
     * @apiGroup LinkedIn
     * @apiVersion 0.1.0
     *
     * @apiParam {String} email The LinkedIn sid user email of the user.
     *
     */
    rateRouter.route('/getId')
        .post(function (req, res) {
            var email = req.body.email;
            if (!email) {
                if (req.user) {
                    if (req.user.userDetails.linkedin) {
                        email = req.user.userDetails.linkedin.email;
                    } else {
                        return res.json({
                            success: false,
                            message: "No linkedin account is linked"
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: "No user found in the session"
                    });
                }
            }

            User.findOne({
                'userDetails.local.email': email
            }).populate({
                path: 'userDetails.linkedin'
            }).exec(function (err, user) {

                console.log(chalk.blue("User: " + JSON.stringify(user, null, "\t")));

                if (err) {
                    return res.json({success: false, message: "Error occurred"});
                } else {
                    if (user) {
                        var uid;
                        if (user.userDetails.linkedin) {
                            uid = user.userDetails.linkedin.uid;
                        }
                        return res.json({success: true, uid: uid});
                    } else {

                    }
                }
            });
        });

    app.use('/rate/linkedin', rateRouter);

};