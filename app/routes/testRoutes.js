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

    //creates a new fb user and a user
    testRouter.route('/createFBUser')
        .post(function (req, res) {

            var id = req.body.id;
            var uid = req.body.uid;
            var name = req.body.name;
            var email = req.body.email;
            var token = req.body.token;

            var fbUser = new Facebook({
                id: id,
                uid: uid,
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

    //creates ONLY a local user
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


    //testRouter.route('/createUser')
    //    .post(function (req, res) {
    //
    //        var uid = res.body.uid;
    //
    //        Facebook.findOne({
    //            uid: uid
    //        }, function (err, facebook) {
    //
    //            console.log(chalk.green("data: " + JSON.stringify(facebook, null, "\t")));
    //
    //            var user = new User({
    //                'userDetails.facebook': facebook._id
    //            });
    //
    //            user.save(function (err) {
    //                if (err) {
    //                    console.log('Error: ' + err);
    //                } else {
    //                    console.log('User saved successfully');
    //
    //                    facebook.user=user._id;
    //
    //                    facebook.save(function(err){
    //                        if (err) {
    //                            console.log('Error: ' + err);
    //                        } else {
    //                            console.log('Facebook updated successfully');
    //                        }
    //                    });
    //                }
    //            });
    //        });
    //
    //    });


    //This will return my all rated claims' IDs
    testRouter.route('/myAllRatedClaims')
        .post(function (req, res) {
            var uid = req.body.uid;

            Facebook.findOne({
                uid: uid
            }, function (err, facebook) {

                if (err) {
                    console.log('Error: ' + err);
                } else {
                    console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));

                    Entry.aggregate([
                            {$match: {targetid: facebook._id}},
                            {$group: {_id: '$id', data: {$addToSet: '$data'}}}
                        ],
                        // { $project: { _id: 0, maxBalance: 1 }},
                        function (err, values) {
                            console.log('values: ' + JSON.stringify(values, null, "\t"));
                            var data = [];
                            for (var i = 0; i < values.length; i++) {
                                data.push({claimid: values[i]._id, data: values[i].data[0]});
                            }
                            res.json(data);
                        });
                }
            });
        });

    //this will return yes, notSure, no count for a given claimid
    testRouter.route('/ratedByOthersCounts')
        .post(function (req, res) {

            var uid = req.body.uid;
            var claimid = req.body.claimid;

            Facebook.findOne({
                uid: uid
            }, function (err, facebook) {
                if (err) {
                    console.log('Error: ' + err);
                } else {
                    console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));
                    getTypeCount(facebook.user, claimid, 1, function (err, yes) {
                        //console.log('yes: ' + yes);
                        //yesCount = yes;
                        getTypeCount(facebook.user, claimid, 0, function (err, notSure) {
                            //console.log('notSure: ' + notSure);
                            //notSureCount = notSure;
                            getTypeCount(facebook.user, claimid, -1, function (err, no) {
                                //noCount = no;
                                console.log('Counts: ' + {claimid: claimid, yes: yes, notSure: notSure, no: no});
								
								var totalCount = yes+no+notSure;
								var ratingVal;
								var score;
								if(totalCount>1){
									score = (yes*7) + (notSure*2) + (no*(-7));
									if(score>20){
										ratingVal = 'T';
									}else if(score<0){
										ratingVal = 'R';
									}else{
										ratingVal = 'C';
									}
								}else{
									ratingVal = 'N';
								}
								
								
                                res.json({claimid: claimid,score:score,rating:ratingVal, yes: yes, notSure: notSure, no: no});
                            });
                        });
                    });
                }
            });
        });
		
	//this will return rating of a claim
    testRouter.route('/claimScore')
        .post(function (req, res) {

            var uid = req.body.uid;
            var claimid = req.body.claimid;

            Facebook.findOne({
                uid: uid
            }, function (err, facebook) {
                if (err) {
                    console.log('Error: ' + err);
                } else {
                    console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));
                    getTypeCount(facebook.user, claimid, 1, function (err, yes) {
                        //console.log('yes: ' + yes);
                        //yesCount = yes;
                        getTypeCount(facebook.user, claimid, 0, function (err, notSure) {
                            //console.log('notSure: ' + notSure);
                            //notSureCount = notSure;
                            getTypeCount(facebook.user, claimid, -1, function (err, no) {
                                //noCount = no;
                                console.log('Counts: ' + {claimid: claimid, yes: yes, notSure: notSure, no: no});
								
								var totalCount = yes+no+notSure;
								var ratingVal;
								var score;
								if(totalCount>1){
									score = (yes*7) + (notSure*2) + (no*(-7));
									if(score>20){
										ratingVal = 'T';
									}else if(score<0){
										ratingVal = 'R';
									}else{
										ratingVal = 'C';
									}
								}else{
									ratingVal = 'N';
								}
								res.json({claimid: claimid , rating: ratingVal, count : totalCount, score:score, yes:yes, no:no, notSure:notSure});
                            });
                        });
                    });
                }
            });
        });


    testRouter.route('/ratedByMe')
        .post(function (req, res) {
            var uid = req.body.uid;

            Facebook.findOne({
                uid: uid
            }, function (err, facebook) {

                if (err) {
                    console.log('Error: ' + err);
                } else {
                    console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));


                    FacebookRatedByMe.findOne({
                        myid: uid
                    }, function (err, facebookRatedByMe) {
                        if (err) {
                            console.log('Error: ' + err);
                        } else {
                            console.log(chalk.green("FacebookRatedByMe: " + JSON.stringify(facebookRatedByMe, null, "\t")));
                        }
                    });


                }

            });

        });


    testRouter.route('/ratedByOthers')
        .post(function (req, res) {
            var uid = req.body.uid;

            Facebook.findOne({
                uid: uid
            }, function (err, facebook) {

                if (err) {
                    console.log('Error: ' + err);
                } else {
                    console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));


                    //User.findOne({
                    //    _id: facebook.user
                    //}).populate({
                    //        path: 'facebook.ratedByOthers',
                    //        select: '-_id'
                    //    })
                    //    .exec(function (err, user) {
                    //        if (err) {
                    //            console.log('Error: ' + err);
                    //        } else {
                    //            console.log(chalk.green("User: " + JSON.stringify(user, null, "\t")));
                    //            user.aggregate(
                    //                {$group: {_id: '$id'}}
                    //
                    //                , function (err, res) {
                    //                    if (err) return handleError(err);
                    //                    console.log(chalk.green("res: " + JSON.stringify(res, null, "\t")));
                    //                });
                    //        }
                    //    });

                    //Entry.aggregate()
                    //    .group(
                    //        {_id: null, myid: facebook._id}
                    //
                    //        //, { $project: { _id: 0, maxBalance: 1 }}
                    //    )
                    //    .exec(function (err, res) {
                    //        if (err) {
                    //            console.log('error: ' + err);
                    //        } else {
                    //            console.log(res); // [ { maxBalance: 98000 } ]
                    //        }
                    //    });


                    //Entry.aggregate([
                    //        {$match: {targetid: facebook._id}},
                    //
                    //        {$group: {_id: '$id'}}
                    //    ]
                    //    //, { $project: { _id: 0, maxBalance: 1 }}
                    //    , function (err, values) {
                    //        console.log(chalk.green("values: " + JSON.stringify(values, null, "\t")));
                    //    });


                    Entry.aggregate([
                            {$match: {targetid: facebook._id}},

                            {$group: {_id: '$id'}}
                        ],
                        // { $project: { _id: 0, maxBalance: 1 }},
                        function (err, values) {
                            if (err) {
                                console.log('error: ' + err);
                            } else {
                                console.log(values); // [ { maxBalance: 98000 } ]

                                var counts = [];

                                var yesCount, notSureCount, noCount;

                                //for (var i = 0; i < values.length; i++) {

                                //var claimid=values[i]._id;
                                var claimid = values[1];
                                getTypeCount(facebook.user, claimid, 1, function (err, yes) {
                                    console.log('yes: ' + yes);
                                    yesCount = yes;
                                    getTypeCount(facebook.user, claimid, 0, function (err, notSure) {
                                        console.log('notSure: ' + notSure);
                                        notSureCount = notSure;
                                        getTypeCount(facebook.user, claimid, -1, function (err, no) {
                                            noCount = no;
                                            console.log('no: ' + no);
                                            //counts.push({claimid: claimid, yes: yes, notSure: notSure, no: no});


                                            //res.json(counts);

                                            res.json({claimid: claimid._id, yes: yes, notSure: notSure, no: no});

                                        });
                                    });
                                });


                                //}

                            }
                        });


                    //var o = {};
                    //o.map = function () {
                    //    emit(this.id, this.rating)
                    //}
                    //o.reduce = function (k, vals) {
                    //
                    //    return vals.length;
                    //}
                    //o.verbose = true;
                    //
                    //
                    ////Entry.mapReduce(o, function (err, results) {
                    ////    console.log(results)
                    ////});
                    //
                    //Entry.mapReduce(o, function (err, model, stats) {
                    //    //console.log('map reduce took %d ms', stats.processtime)
                    //    //model.find().where('value').gt(10).exec(function (err, docs) {
                    //    //    console.log(docs);
                    //    //});
                    //});


                }

            });

        });


    //testRouter.route('/claimRatedByOthers')
    //    .post(function (req, res) {
    //        var uid = req.body.uid;
    //        var claimid=req.body.claimid;
    //
    //        Facebook.findOne({
    //            uid: uid
    //        }, function (err, facebook) {
    //
    //            if (err) {
    //                console.log('Error: ' + err);
    //            } else {
    //                console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));
    //
    //
    //                //User.findOne({
    //                //    _id: facebook.user
    //                //}).populate({
    //                //        path: 'facebook.ratedByOthers',
    //                //        select: '-_id'
    //                //    })
    //                //    .exec(function (err, user) {
    //                //        if (err) {
    //                //            console.log('Error: ' + err);
    //                //        } else {
    //                //            console.log(chalk.green("User: " + JSON.stringify(user, null, "\t")));
    //                //            user.aggregate(
    //                //                {$group: {_id: '$id'}}
    //                //
    //                //                , function (err, res) {
    //                //                    if (err) return handleError(err);
    //                //                    console.log(chalk.green("res: " + JSON.stringify(res, null, "\t")));
    //                //                });
    //                //        }
    //                //    });
    //
    //                //Entry.aggregate()
    //                //    .group(
    //                //        {_id: null, myid: facebook._id}
    //                //
    //                //        //, { $project: { _id: 0, maxBalance: 1 }}
    //                //    )
    //                //    .exec(function (err, res) {
    //                //        if (err) {
    //                //            console.log('error: ' + err);
    //                //        } else {
    //                //            console.log(res); // [ { maxBalance: 98000 } ]
    //                //        }
    //                //    });
    //
    //
    //                //Entry.aggregate([
    //                //        {$match: {targetid: facebook._id}},
    //                //
    //                //        {$group: {_id: '$id'}}
    //                //    ]
    //                //    //, { $project: { _id: 0, maxBalance: 1 }}
    //                //    , function (err, values) {
    //                //        console.log(chalk.green("values: " + JSON.stringify(values, null, "\t")));
    //                //    });
    //
    //
    //                Entry.aggregate([
    //                        {$match: {targetid: facebook._id}},
    //                        {$match: {claimid:claimid}}
    //                        //{$group: {_id: '$id'}}
    //                    ]
    //                    //, { $project: { _id: 0, maxBalance: 1 }}
    //                    , function (err, values) {
    //                        if (err) {
    //                            console.log('error: ' + err);
    //                        } else {
    //                            console.log(values); // [ { maxBalance: 98000 } ]
    //
    //                            var counts = [];
    //
    //                            var yesCount, notSureCount, noCount;
    //
    //                            //for (var i = 0; i < values.length; i++) {
    //
    //                            //var claimid=values[i]._id;
    //
    //
    //                            var claimid = values[1];
    //                            getTypeCount(facebook.user, claimid, 1, function (err, yes) {
    //                                console.log('yes: ' + yes);
    //                                yesCount = yes;
    //                                getTypeCount(facebook.user, claimid, 0, function (err, notSure) {
    //                                    console.log('notSure: ' + notSure);
    //                                    notSureCount = notSure;
    //                                    getTypeCount(facebook.user, claimid, -1, function (err, no) {
    //                                        noCount = no;
    //                                        console.log('no: ' + no);
    //                                        //counts.push({claimid: claimid, yes: yes, notSure: notSure, no: no});
    //
    //
    //                                        //res.json(counts);
    //
    //                                        res.json({claimid: claimid._id, yes: yes, notSure: notSure, no: no});
    //
    //                                    });
    //                                });
    //                            });
    //
    //
    //                            //}
    //
    //                        }
    //                    });
    //
    //
    //                //var o = {};
    //                //o.map = function () {
    //                //    emit(this.id, this.rating)
    //                //}
    //                //o.reduce = function (k, vals) {
    //                //
    //                //    return vals.length;
    //                //}
    //                //o.verbose = true;
    //                //
    //                //
    //                ////Entry.mapReduce(o, function (err, results) {
    //                ////    console.log(results)
    //                ////});
    //                //
    //                //Entry.mapReduce(o, function (err, model, stats) {
    //                //    //console.log('map reduce took %d ms', stats.processtime)
    //                //    //model.find().where('value').gt(10).exec(function (err, docs) {
    //                //    //    console.log(docs);
    //                //    //});
    //                //});
    //
    //
    //            }
    //
    //        });
    //
    //    });


    //returns total rate count for a claim by a user
    testRouter.route('/getTotalRateCount')
        .post(function (req, res) {
            var uid = req.body.uid;
            var claimid = req.body.claimid;

            Facebook.findOne({
                uid: uid
            }, function (err, facebook) {
                if (err) {
                    console.log('Error: ' + err);
                } else {
                    console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));
                    if (facebook) {

                        User.findOne({
                            _id: facebook.user
                        }).populate(
                            {
                                path: 'facebook.ratedByOthers',
                                match: {id: claimid},
                                select: '_id'
                            })
                            .exec(function (err, user) {
                                if (err) {
                                    console.log('Error: ' + err);
                                } else {
                                    console.log(chalk.green("User: " + JSON.stringify(user, null, "\t")));
                                    if (user) {
                                        console.log(chalk.green("Count: " + user.facebook.ratedByOthers.length));
                                        return res.json({count: user.facebook.ratedByOthers.length});
                                    } else {
                                        console.log('User not found');
                                        return res.json({message: 'User not found'});
                                    }
                                }
                            });

                    } else {
                        console.log('Facebook account not found');
                        return res.json({message: 'uid not found'});
                    }

                }
            });
        });


    //returns a specific type(yes, not sure, no) count for a claim by a user
    testRouter.route('/getTypeCount')
        .post(function (req, res) {
            var uid = req.body.uid;
            var claimid = req.body.claimid;
            var type = req.body.type;

            Facebook.findOne({
                uid: uid
            }, function (err, facebook) {
                if (err) {
                    console.log('Error: ' + err);
                } else {
                    console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));
                    if (facebook) {

                        User.findOne({
                            _id: facebook.user
                        }).populate(
                            {
                                path: 'facebook.ratedByOthers',
                                match: {id: claimid, rating: type},
                                select: '_id'
                            })
                            .exec(function (err, user) {
                                if (err) {
                                    console.log('Error: ' + err);
                                } else {
                                    console.log(chalk.green("User: " + JSON.stringify(user, null, "\t")));
                                    if (user) {
                                        console.log(chalk.green("Count: " + user.facebook.ratedByOthers.length));
                                        return res.json({count: user.facebook.ratedByOthers.length});
                                    } else {
                                        console.log('User not found');
                                        return res.json({message: 'User not found'});
                                    }
                                }
                            });

                    } else {
                        console.log('Facebook account not found');
                        return res.json({message: 'uid not found'});
                    }

                }
            });
        });

    var getTypeCount = function (userid, claimid, type, callback) {
        //Facebook.findOne({
        //    uid: uid
        //}, function (err, facebook) {
        //if (err) {
        //    console.log('Error: ' + err);
        //    callback(err, null);
        //} else {
        //    console.log(chalk.green("Facebook: " + JSON.stringify(facebook, null, "\t")));
        //if (facebook) {


        console.log('Searching; claimid: ' + claimid + ' , type: ' + type);

        User.findOne({
            _id: userid
        }).populate(
            {
                path: 'facebook.ratedByOthers',
                match: {id: claimid, rating: type},
                select: '_id'
            })
            .exec(function (err, user) {
                if (err) {
                    console.log('Error: ' + err);
                    callback(err, null);
                } else {
                    console.log(chalk.green("User: " + JSON.stringify(user, null, "\t")));
                    if (user) {
                        console.log(chalk.green("Count: " + user.facebook.ratedByOthers.length));
                        callback(null, user.facebook.ratedByOthers.length);
                    } else {
                        console.log('User not found');

                        callback('User not found', null);
                    }
                }
            });

        //} else {
        //    console.log('Facebook account not found');
        //    callback('uid not found', null);
        //}

        //}
        //});
    };

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

                                            Entry.findOneAndUpdate({
                                                    _id: facebookRatedByMe.entries[0]._id
                                                }, {
                                                    rating: rating
                                                },
                                                {
                                                    safe: true,
                                                    upsert: true,
                                                    new: true
                                                },
                                                function (err, entry) {
                                                    console.log(chalk.yellow("New rating: " + JSON.stringify(entry, null, "\t")));
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
                                            rating: rating
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

                                                                user.save(function (err) {
                                                                    if (err) {
                                                                        console.log("User(target) save error: " + err);
                                                                    } else {
                                                                        console.log("User(target) saved successfully");


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
            var claimid = req.query.claimid;

            if (!myid) {
                return res.json({error: "Missing myid paramter"});
            }

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
            }

            if (!claimid) {
                return res.json({error: "Missing claim paramter"});
            }

            Facebook.findOne({
                uid: myid
            }, function (err, me) {

                if (err) {
                    return res.json({err: err});
                }

                if (me) {

                    Facebook.findOne({
                        uid: targetid
                    }, function (err, target) {
                        if (err) {
                            return res.json({err: err});
                        }

                        if (target) {

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
                                    }
                                )
                                .exec(function (err, facebookRatedByMe) {

                                    console.log(chalk.blue("Previous rating: " + JSON.stringify(facebookRatedByMe, null, "\t")));

                                    if (facebookRatedByMe.entries[0]) {

                                        return res.json({messge: "Found: " + facebookRatedByMe.entries[0].rating});
                                    } else {
                                        return res.json({messge: "Not found"});
                                    }

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

                if (err) {
                    return res.json({err: err});
                }

                if (me) {

                    Facebook.findOne({
                        uid: targetid
                    }, function (err, target) {
                        if (err) {
                            return res.json({err: err});
                        }

                        if (target) {

                            FacebookRatedByMe
                                .findOne({
                                    myid: me._id,
                                    targetid: target._id
                                })
                                .populate(
                                    {
                                        path: 'entries',
                                        match: {id: claimid},
                                    }
                                )
                                .exec(function (err, facebookRatedByMe) {

                                    console.log(chalk.blue("Previous rating: " + JSON.stringify(facebookRatedByMe, null, "\t")));

                                    if (facebookRatedByMe.entries[0]) {

                                        Entry.findOneAndUpdate({
                                                _id: facebookRatedByMe.entries[0]._id,
                                            }, {
                                                rating: rating,
                                                data: claim
                                            },
                                            {
                                                safe: true,
                                                upsert: true,
                                                new: true
                                            },
                                            function (err, entry) {

                                                if (err) {
                                                    console.log('error: ' + err);
                                                    return res.json({message: "Error: " + err});
                                                } else {
                                                    console.log(chalk.yellow("New rating: " + JSON.stringify(entry, null, "\t")));
                                                    return res.json({message: "Found: " + facebookRatedByMe.entries[0].rating + ", updated to: " + rating});

                                                }
                                            });

                                    } else {
                                        return res.json({messge: "Not found"});
                                    }

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
        .delete(function (req, res) {
            var myid = req.body.myid;
            var targetid = req.body.targetid;
            var claimid = req.body.claimid;

            if (!myid) {
                return res.json({error: "Missing myid paramter"});
            }

            if (!targetid) {
                return res.json({error: "Missing targetid paramter"});
            }

            if (!claimid) {
                return res.json({error: "Missing claim paramter"});
            }


            Facebook.findOne({
                uid: myid
            }, function (err, me) {

                if (err) {
                    return res.json({err: err});
                }

                if (me) {

                    Facebook.findOne({
                        uid: targetid
                    }, function (err, target) {
                        if (err) {
                            return res.json({err: err});
                        }

                        if (target) {


                            FacebookRatedByMe
                                .findOne({
                                    myid: me._id,
                                    targetid: target._id
                                })
                                .populate(
                                    {
                                        path: 'entries',
                                        match: {id: claimid},
                                    }
                                )
                                .exec(function (err, facebookRatedByMe) {

                                    console.log(chalk.blue("Previous rating: " + JSON.stringify(facebookRatedByMe, null, "\t")));

                                    if (facebookRatedByMe.entries[0]) {

                                        //Entry.findOneAndUpdate({
                                        //        _id: facebookRatedByMe.entries[0]._id,
                                        //    }, {
                                        //        rating: rating,
                                        //        data: claim
                                        //    },
                                        //    {
                                        //        safe: true,
                                        //        upsert: true,
                                        //        new: true
                                        //    },
                                        //    function (err, entry) {
                                        //
                                        //        if (err) {
                                        //            console.log('error: ' + err);
                                        //            return res.json({message: "Error: " + err});
                                        //        } else {
                                        //            console.log(chalk.yellow("New rating: " + JSON.stringify(entry, null, "\t")));
                                        //            return res.json({message: "Found: " + facebookRatedByMe.entries[0].rating + ", updated to: " + rating});
                                        //
                                        //        }
                                        //    });

                                        facebookRatedByMe.entries.pull(facebookRatedByMe.entries[0]._id);

                                        facebookRatedByMe.save(function (err) {
                                            if (err) {
                                                console.log("error: " + err);
                                            } else {

                                                Entry.findOneAndRemove({
                                                    _id: facebookRatedByMe.entries[0]._id
                                                }, function (err) {
                                                    if (err) {
                                                        console.log('Error: ' + err);
                                                        return res.json({message: "Error: " + err});

                                                    } else {

                                                        User.findOne(
                                                            {
                                                                _id: target.user
                                                            },
                                                            function (err, user) {
                                                                console.log(chalk.blue("User: " + JSON.stringify(user, null, "\t")));

                                                                user.facebook.ratedByOthers.pull(facebookRatedByMe.entries[0]._id);

                                                                user.save(function (err) {
                                                                    if (err) {
                                                                        console.log("User save error: " + err);
                                                                    } else {
                                                                        console.log("User saved successfully");


                                                                    }
                                                                });
                                                            });


                                                        console.log('Successfully deleted');
                                                        return res.json({messge: "Successfully deleted"});

                                                    }
                                                });


                                            }
                                        });

                                    } else {
                                        return res.json({messge: "Not found"});
                                    }

                                });
                        } else {
                            return res.json({err: "No target with uid=" + myid + " found"});
                        }
                    });
                } else {
                    return res.json({err: "No user with uid=" + myid + " found"});
                }
            });
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



