var chalk = require('chalk');

var Entry = require("../models/entry");
var FacebookRatedByMe = require('../models/facebookRatedByMe');
var Facebook = require("../models/facebook");
var User = require("../models/user");

var mongoose = require('mongoose');

module.exports = function (app, express) {

    var testRouter = express.Router();

    testRouter.route('/')
        .get(function (req, res) {
            res.json({message: "Welcome to test api"});
        });

    testRouter.route('/createFBUser')
        .post(function (req, res) {

            var id = req.body.id;
            var name = req.body.name;
            var email = req.body.email;
            var token = req.body.token;

            var fbUser = new Facebook({
                id: id,
                name: name,
                email: email,
                token: token
            });

            var user = new User({
                'userDetails.facebook': fbUser._id
            });

            fbUser.user = user._id;

            console.log(chalk.red("data: " + JSON.stringify(fbUser, null, "\t")));
            console.log(chalk.red("data: " + JSON.stringify(user, null, "\t")));

            fbUser.save(function (err) {
                if (err) {
                    res.json({message: "Failed 1"});
                } else {
                    user.save(function (err) {
                        if (err) {
                            res.json({message: "Failed 2"});
                        } else {
                            res.json(fbUser);
                        }
                    });
                }
            });
        });

    testRouter.route('/createLocalUser')
        .post(function (req, res) {

            var firstname = req.body.firstname;
            var lastname = req.body.lastname;
            var email = req.body.email;
            var password = req.body.password;

            var user = new User({
                userDetails: {
                    local: {
                        firstname: firstname,
                        lastname: lastname,
                        email: email,
                        password: password
                    }
                }
            });

            console.log(chalk.red("data: " + JSON.stringify(user, null, "\t")));

            user.save(function (err) {
                if (err) {
                    res.json({message: "Failed 2"});
                } else {
                    res.json(user);
                }
            });

        });

    testRouter.route('/addRating')
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

                            FacebookRatedByMe.findOne({
                                myid: me._id,
                                targetid: target._id
                            }, function (err, facebookRatedByMe) {

                                if (facebookRatedByMe) {
                                    console.log(chalk.green("Previous ratings found"));
                                    //return res.json({message:"Previous ratings found"});

                                } else {
                                    console.log(chalk.red("Previous ratings not found"));
                                    //return res.json({message:"Previous ratings not found"});

                                    var entry = new Entry({
                                        id: claimid,
                                        data: claim,
                                        rating: rating
                                    });

                                    entry.save(function (err) {

                                        if (err) {
                                            console.log(chalk.red("Error saving the entry"));
                                            return res.json({err: "Error saving the entry"});
                                        } else {

                                            var newFBRating = new FacebookRatedByMe({
                                                myid: me._id,
                                                targetid: target._id,
                                                entries: [entry._id]
                                            });

                                            newFBRating.save(function (err) {
                                                if (err) {
                                                    console.log(chalk.red("Error saving the entry: " + err));
                                                    return res.json({err: "Error saving the entry: " + err});
                                                } else {
                                                    return res.sendStatus(200);
                                                }
                                            });

                                        }
                                    });
                                }
                            });

                            //User.findOne({
                            //    _id: me.user,
                            //    'facebook.ratedByMe': {$elemMatch: {targetid: target._id}}
                            //}, function (err, user) {
                            //    if (user) {
                            //        console.log(chalk.green('Rating already available'));
                            //        console.log(chalk.green(JSON.stringify(user, null, "\t")));
                            //        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
                            //        res.json({message: "Rating already available"});
                            //
                            //    } else {
                            //        console.log(chalk.yellow('Rating not available'));
                            //
                            //        var entry = new Entry({
                            //            data: claim,
                            //            rating: rating
                            //        });
                            //
                            //        entry.save(function (err) {
                            //            if (err) {
                            //                console.log(chalk.red('Error: ' + err));
                            //            } else {
                            //
                            //                var facebookRatedByMe = new FacebookRatedByMe({
                            //                    id: target._id
                            //                });
                            //
                            //                facebookRatedByMe.save(function (err) {
                            //
                            //                    if (err) {
                            //                        console.log('error1: ' + err);
                            //                    } else {
                            //                        console.log('OK');
                            //
                            //                        FacebookRatedByMe.findOneAndUpdate({
                            //                                id: target._id
                            //                            }, {
                            //                                $push: {
                            //                                    entries: entry._id
                            //                                }
                            //                            },
                            //                            {
                            //                                safe: true,
                            //                                upsert: true, new : true
                            //                            },
                            //                            function (err, model) {
                            //                                if (err) {
                            //                                    console.log('error2: ' + err);
                            //                                } else {
                            //                                    console.log(chalk.green('Model: ' + JSON.stringify(model, null, "\t")));
                            //
                            //                                    User.findOneAndUpdate({
                            //                                        _id: me.user
                            //                                    }, {
                            //                                        $push: {
                            //                                            'facebook.ratedByMe': facebookRatedByMe._id
                            //                                        }
                            //                                    }, {
                            //                                        safe: true,
                            //                                        upsert: true
                            //                                    }, function (err, me) {
                            //
                            //                                        if (err) {
                            //                                            console.log('error3: ' + err);
                            //                                        } else {
                            //                                            console.log(chalk.cyan('Me: ' + JSON.stringify(me, null, "\t")));
                            //                                        }
                            //
                            //                                    });
                            //                                }
                            //                            }
                            //                        );
                            //                    }
                            //                });
                            //            }
                            //        });
                            //    }
                            //});

                        } else {
                            console.log(chalk.red("Target not found"));
                            return res.json({message: "Target with uid=" + targetid + " not found"});
                        }
                    });
                } else {
                    console.log(chalk.red("Me not found"));
                    return res.json({message: "User with uid=" + myid + " not found"});
                }
            });
        })
        .get(function (req, res) {

            var myid = req.query.myid;
            var targetid = req.query.targetid;
            var claim = req.query.claim;
            var rating = req.query.rating;

            if (!myid) {
                return res.json({error: "Missing myid paramter"});
            }

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
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

                if (err) {
                    return res.json({err: err});
                }

                if (me) {

                    Facebook.findOne({
                        id: targetid
                    }, function (err, target) {
                        if (err) {
                            return res.json({err: err});
                        }

                        if (target) {
                            FacebookRatedByMe.findOne({
                                myid: me._id,
                                targetid: target._id
                            }, function (err, entry) {
                                console.log(chalk.yellow("User found: " + JSON.stringify(entry, null, "\t")));
                                return res.send(200);
                            });
                        } else {
                            return res.json({err: "No target with uid=" + myid + " found"});
                        }


                    });

                } else {
                    return res.json({err: "No user with uid=" + myid + " found"});
                }
            });


        })
        .put(function (req, res) {
            var myid = req.body.myid;
            var targetid = req.body.targetid;
            var claim = req.body.claim;
            var rating = req.body.rating;

            if (!myid) {
                return res.json({error: "Missing myid paramter"});
            }

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
            }

            if (!claim) {
                return res.json({error: "Missing claim paramter"});
            }

            if (!rating) {
                return res.json({error: "Missing rating paramter"});
            }

            return res.send(200);
        })
        .delete(function (req, res) {
            var myid = req.body.myid;
            var targetid = req.body.targetid;
            var claim = req.body.claim;

            if (!myid) {
                return res.json({error: "Missing myid paramter"});
            }

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
            }

            if (!claim) {
                return res.json({error: "Missing claim paramter"});
            }

            return res.send(200);
        });

    testRouter.route('/addRating_temp1')
        .post(function (req, res) {

            var myid = req.body.myid;
            var targetid = req.body.targetid;
            var claim = req.body.claim;
            var rating = req.body.rating;

            Facebook.findOne({
                id: myid
            }, function (err, me) {
                if (me) {
                    console.log(chalk.yellow("User found: " + JSON.stringify(me, null, "\t")));

                    Facebook.findOne({
                        id: targetid
                    }, function (err, target) {
                        if (target) {

                            console.log(chalk.blue("Target found: " + JSON.stringify(target, null, "\t")));

                            User.findOne({
                                _id: me.user,
                                'facebook.ratedByMe': {$elemMatch: {targetid: target._id}}
                            }, function (err, user) {
                                if (user) {
                                    console.log(chalk.green('Rating already available'));
                                    console.log(chalk.green(JSON.stringify(user, null, "\t")));
                                    console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
                                    res.json({message: "Rating already available"});

                                } else {
                                    console.log(chalk.yellow('Rating not available'));

                                    var entry = new Entry({
                                        data: claim,
                                        rating: rating
                                    });

                                    entry.save(function (err) {
                                        if (err) {
                                            console.log(chalk.red('Error: ' + err));
                                        } else {

                                            var facebookRatedByMe = new FacebookRatedByMe({
                                                id: target._id
                                            });

                                            facebookRatedByMe.save(function (err) {

                                                if (err) {
                                                    console.log('error1: ' + err);
                                                } else {
                                                    console.log('OK');

                                                    FacebookRatedByMe.findOneAndUpdate({
                                                            id: target._id
                                                        }, {
                                                            $push: {
                                                                entries: entry._id
                                                            }
                                                        },
                                                        {
                                                            safe: true,
                                                            upsert: true
                                                        },
                                                        function (err, model) {
                                                            if (err) {
                                                                console.log('error2: ' + err);
                                                            } else {
                                                                console.log(chalk.green('Model: ' + JSON.stringify(model, null, "\t")));

                                                                User.findOneAndUpdate({
                                                                    _id: me.user
                                                                }, {
                                                                    $push: {
                                                                        'facebook.ratedByMe': facebookRatedByMe._id
                                                                    }
                                                                }, {
                                                                    safe: true,
                                                                    upsert: true
                                                                }, function (err, me) {

                                                                    if (err) {
                                                                        console.log('error3: ' + err);
                                                                    } else {
                                                                        console.log(chalk.cyan('Me: ' + JSON.stringify(me, null, "\t")));
                                                                    }

                                                                });
                                                            }
                                                        }
                                                    );
                                                }
                                            });
                                        }
                                    });
                                }
                            });

                        } else {
                            console.log(chalk.red("Target not found"));
                            res.json({message: "Target not found"});
                        }
                    });
                } else {
                    console.log(chalk.red("Me not found"));
                    res.json({message: "Me not found"});
                }
            });
        });

    app.use('/test', testRouter);


    //entry.save(function (err) {
    //    if (err) {
    //        console.log(chalk.red('Error: ' + err));
    //    } else {
    //        User.findOneAndUpdate({
    //                _id: me.user
    //            },
    //            {
    //                $push: {
    //                    'facebook.ratedByMe': {
    //                        targetid: target._id,
    //                        $push: {
    //                            'entries.basic_info': entry
    //                        }
    //                    },
    //                }
    //            },
    //            {
    //                safe: true,
    //                upsert: true
    //            },
    //            function (err, model) {
    //                if (err) {
    //                    console.log(chalk.red(err));
    //                    res.json({message: err});
    //                } else {
    //                    console.log("Model: " + model);
    //
    //                    //User.findOneAndUpdate({
    //                    //        'facebook.ratedByMe.targetid': target._id
    //                    //    }, {
    //                    //        $push: {
    //                    //            'facebook.ratedByMe.entries.basic_info': entry._id,
    //                    //        }
    //                    //    },
    //                    //    {
    //                    //        safe: true,
    //                    //        upsert: true
    //                    //    }, function (err, updatedUser) {
    //                    //
    //                    //        if(err){
    //                    //            console.log('err: '+err);
    //                    //        }
    //                    //        console.log(chalk.green('User found: ' + JSON.stringify(updatedUser, null, "\t")));
    //                    //
    //                    //
    //                    //    });
    //
    //                    res.json({message: "OK"});
    //                }
    //            }
    //        );
    //    }
    //});

};
