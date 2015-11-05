var chalk = require('chalk');

var Entry = require("../models/entry");
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


                                    //User.findOne({
                                    //    _id: me.user
                                    //}, function (err, me) {
                                    //    console.log(chalk.cyan('Me: ' + JSON.stringify(me, null, "\t")));
                                    //
                                    //
                                    //});

                                    var entry = {
                                        targetid: target._id
                                    };

                                    User.findOneAndUpdate({
                                            _id: me.user
                                        },
                                        {
                                            $push: {
                                                'facebook.ratedByMe': {
                                                    targetid: target._id,
                                                    entries: {
                                                        $push: {
                                                            'facebook.ratedByMe.entries.basic_info': entry
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            safe: true,
                                            upsert: true
                                        },
                                        function (err, model) {

                                            if (err) {
                                                console.log(chalk.red(err));
                                                res.json({message: err});
                                            }

                                            console.log("Model: " + model);


                                            res.json({message: "OK"});
                                        }
                                    );

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
};
