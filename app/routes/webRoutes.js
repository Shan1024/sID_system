var chalk = require('chalk');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var rest = require('restler');
var http = require('http');

var facebook = require('../../config/facebook.js');

var User = require('../models/user');
var Facebook = require('../models/facebook');
var Entry = require("../models/entry");
var Claim = require("../models/claim");
var LinkedIn = require("../models/linkedin");
var OrgUser = require("../models/orgUser");

var controller = require('../controllers/controllers');

//var rest = require('restler');
//var http = require('http');
var request = require('request');
//.defaults({jar: true});
//request = request.defaults({jar: true});


module.exports = function (app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function (req, res) {

        //req.user.userDetails.local.email

        if (req.isAuthenticated()) {
            res.redirect('/home');
        } else {
            res.render('index.ejs', {
                user: req.user,
                signUpVisible: false,
                failureFlash: req.flash('error'),
                successFlash: req.flash('success'),
                message: req.flash('loginMessage')
            });
        }

    });

    /**
     * @api {post} /authenticate Authenticate an user
     * @apiName /authenticate
     * @apiGroup BaseRouter
     *
     * @apiParam {String} username Users email address.
     * @apiParam {String} password Users password.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       success: true,
     *       linked: true,
     *       fbappid: facebook.id,
     *       fbid: facebook.uid,
     *       token: {TOKEN}
     *     }
     *
     */
    app.post('/authenticate', function (req, res) {


        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        var username = req.body.username;
        var password = req.body.password;

        if (username) {
            console.log(chalk.yellow('Username: ' + username));
            // find the user

            if (password) {
                console.log(chalk.yellow('Password: ---------'));

                User.findOne({
                    'userDetails.local.email': username
                }, function (err, user) {

                    if (err) throw err;

                    if (!user) {
                        res.json({
                            success: false,
                            message: 'Authentication failed. User not found.'
                        });
                    } else if (user) {

                        console.log(chalk.blue('User: ' + user));

                        var hash = user.generateHash(password);
                        console.log(chalk.green('Hash: ' + hash));

                        // check if password matches
                        if (!user.validPassword(password)) {
                            res.json({
                                success: false,
                                message: 'Authentication failed. Wrong password.'
                            });
                        } else {

                            console.log(chalk.green('Password correct'));

                            var apiSecret = app.get('apiSecret');

                            console.log(chalk.yellow('apiSecret: ' + apiSecret));
                            // if user is found and password is right
                            // create a token

                            console.log("Searching facebook profile....");
                            Facebook.findOne({
                                _id: user.userDetails.facebook
                            }, function (err, facebook) {
                                if (err) {

                                    console.log("Error occurred");
                                    return res.status(400).json({
                                        success: false,
                                        message: 'Error occurred.'
                                    });

                                } else {
                                    var tempUser;
                                    if (facebook) {
                                        tempUser = {
                                            iss: 'sID',
                                            context: {
                                                username: user.userDetails.local.username,
                                                id: facebook.id,
                                                uid: facebook.uid
                                            }
                                        };
                                    } else {
                                        tempUser = {
                                            iss: 'sID',
                                            context: {
                                                username: user.userDetails.local.username,
                                            }
                                        };
                                    }
                                    var token = jwt.sign(tempUser, apiSecret, {
                                        expiresInMinutes: 1440 // expires in 24 hours
                                    });

                                    if (facebook) {

                                        console.log(chalk.blue("Facebook: " + JSON.stringify(facebook, null, "\t")));

                                        // return the information including token as JSON
                                        var linked = false;

                                        if (facebook.token) {
                                            linked = true;
                                        }

                                        return res.json({
                                            success: true,
                                            linked: linked,
                                            fbappid: facebook.id,
                                            fbid: facebook.uid,
                                            token: token
                                        });
                                    } else {
                                        return res.json({
                                            success: true,
                                            token: token
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            } else {
                console.log(chalk.red('Authentication failed. Password required.'));
                res.status(400).json({
                    success: false,
                    message: 'Authentication failed. Password required.'
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'Authentication failed. Username required.'
            });
        }
    });

    app.get('/verify', function (req, res) {
        console.log("/verify called");
        controller.verifyEmail(req, res);
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function (req, res) {
        //User.findById(req.user._id)
        //    //.populate('userDetails.facebook')
        //    //.populate('facebook.ratedByMe')
        //    .exec(function (error, user) {
        //        console.log(JSON.stringify(user, null, "\t"));
        //    });

        //User.findById(req.user._id)
        //    .populate('userDetails.facebook')
        //    .populate('userDetails.linkedin')
        //    //.populate('facebook.ratedByMe')
        //    .exec(function (error, user) {
        //        console.log(JSON.stringify(user, null, "\t"));
        //        res.render('profile.ejs', {
        //            user: user,
        //            errorMessage: req.flash('passwordChangeError'),
        //            successMessage: req.flash('passwordChangeSuccess')
        //        });
        //
        //        //res.render('partials/profile', {user: user});
        //    });

        res.render('home.ejs', {
            user: req.user,
            errorMessage: req.flash('passwordChangeError'),
            successMessage: req.flash('passwordChangeSuccess')
        });

    });

    // LOGOUT ==============================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function (req, res) {
        res.render('index.ejs', {
            signUpVisible: false,
            message: req.flash('loginMessage'),
            successFlash: req.flash('success'),
            failureFlash: req.flash('error')
        });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function (req, res) {
        res.render('index.ejs', {
            signUpVisible: true,
            message: req.flash('signupMessage'),
            failureFlash: req.flash('error'),
            successFlash: req.flash('success')
        });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/login', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        successFlash: "Account created successfully. Please login.",
        failureFlash: "Error occurred while creating an account. Please try again." // allow flash messages
    }));

    //#######################################################
    //################### Facebook Auth #####################
    //#######################################################

    // send to facebook to do the authentication
    app.get('/auth/facebook', function (req, res) {
        if (req.protocol == 'http') {
            res.redirect('/auth/facebookHTTP');
        } else if (req.protocol == 'https') {
            res.redirect('/auth/facebookHTTPS');
        }
    });

    app.get('/auth/facebookHTTP', passport.authenticate('facebook-auth-http', {
        scope: 'email, user_friends',
        failureRedirect: '/login',
        failureFlash: 'Authentication failed.'
    }));

    app.get('/auth/facebookHTTPS', passport.authenticate('facebook-auth-https', {
        scope: 'email, user_friends',
        failureRedirect: '/login',
        failureFlash: 'Authentication failed.'
    }));

    // handle the callback after facebook has authorized the user
    app.get('/auth/facebookHTTP/callback',
        passport.authenticate('facebook-auth-http', {
            successRedirect: '/home',
            failureRedirect: '/login',
            failureFlash: 'Authentication failed.'
        })
    );

    app.get('/auth/facebookHTTPS/callback',
        passport.authenticate('facebook-auth-https', {
            successRedirect: '/home',
            failureRedirect: '/login',
            failureFlash: 'Authentication failed.'
        })
    );

    //app.get('/auth/plugin/facebook', passport.authenticate('facebook-auth-plugin-https', {scope: 'email, user_friends'}));
    //
    //app.get('/auth/plugin/facebookHTTPS/callback',
    //    passport.authenticate('facebook-auth-plugin-https', {
    //        scope: 'email, user_friends',
    //        successRedirect: 'https://www.facebook.com',
    //        failureRedirect: 'https://www.facebook.com'
    //    })
    //);

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //+++++++++++++++++++ LinkedIn Auth +++++++++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++
    app.get('/auth/linkedin', passport.authenticate('linkedin-auth'));

    app.get('/auth/linkedin/callback',
        passport.authenticate('linkedin-auth', {
            successRedirect: '/home',
            failureRedirect: '/login',
            failureFlash: 'Authentication failed.'
        })
        //,
        //function (req, res) {
        //    // Successful authentication, redirect home.
        //    res.redirect('/success');
        //}
    );

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
    //app.get('/connect/local', function (req, res) {
    //    res.render('connect-local.ejs', {message: req.flash('loginMessage')});
    //});
    //app.post('/connect/local', passport.authenticate('local-signup', {
    //    successRedirect: '/profile', // redirect to the secure profile section
    //    failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
    //    failureFlash: true // allow flash messages
    //}));


    //#######################################################
    //################# Facebook Connect ####################
    //#######################################################

    // send to facebook to do the authentication
    app.get('/connect/facebook', isLoggedIn, function (req, res) {
        if (req.protocol == 'http') {
            res.redirect('/connect/facebookHTTP');
        } else if (req.protocol == 'https') {
            res.redirect('/connect/facebookHTTPS');
        }
    });

    app.get('/connect/facebookHTTP', passport.authenticate('facebook-connect-http', {
        failureRedirect: '/',
        failureFlash: 'Authentication failed.'
    }));

    app.get('/connect/facebookHTTPS', passport.authenticate('facebook-connect-https', {
        failureRedirect: '/',
        failureFlash: 'Authentication failed.'
    }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebookHTTP/callback',
        passport.authenticate('facebook-connect-http', {
            successRedirect: '/profile',
            failureRedirect: '/failure'
        })
    );

    app.get('/connect/facebookHTTPS/callback',
        passport.authenticate('facebook-connect-https', {
            successRedirect: '/profile',
            failureRedirect: '/failure'
        })
    );


    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //+++++++++++++++++ LinkedIn Connect ++++++++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++
    app.get('/connect/linkedin', passport.authenticate('linkedin-connect'));
    //, {
    //    res: ['r_basicprofile', 'r_fullprofile', 'r_emailaddress']
    //}

    // the callback after google has authorized the user
    app.get('/connect/linkedin/callback',
        passport.authenticate('linkedin-connect', {
            successRedirect: '/profile',
            failureRedirect: '/failure'
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    //// local -----------------------------------
    //app.get('/unlink/local', isLoggedIn, function (req, res) {
    //    var user = req.user;
    //    user.userDetails.local.email = undefined;
    //    user.userDetails.local.password = undefined;
    //    user.save(function (err) {
    //        res.redirect('/profile');
    //    });
    //});

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function (req, res) {

        Facebook.findOne({
            _id: req.user.userDetails.facebook
        }, function (err, facebook) {
            facebook.token = undefined;
            facebook.save(function (err) {
                res.redirect('/profile');
            });


        });
    });

    app.get('/unlink/linkedin', isLoggedIn, function (req, res) {
        LinkedIn.findOne({
            _id: req.user.userDetails.linkedin
        }, function (err, linkedin) {
            linkedin.token = undefined;
            linkedin.save(function (err) {
                res.redirect('/profile');
            });


        });
    });
    // FRIENDS SECTION =========================
    app.get('/facebook/friends', isLoggedIn, function (req, res) {

        if (req.user.userDetails.facebook) {
            if (req.user.userDetails.facebook.token) {
                facebook.getFbData(req, '/me/friends', function (data) {
                    console.log(data);
                    console.log("-------------------------------------");
                    var jsonPretty = JSON.stringify(JSON.parse(data), null, 2);
                    console.log(jsonPretty);

                    obj = JSON.parse(data);

                    console.log("obj.data: " + obj);
                    console.log(JSON.stringify("obj.data: " + JSON.parse(data), null, 2));

                    res.render('friends.ejs', {
                        friends: obj.data,
                        user: req.user,
                        errorMessage: ''
                    });

                });
            } else {
                res.render('friends.ejs', {
                    friends: '',
                    user: req.user,
                    errorMessage: 'FB account is not linked.'
                });
            }
        } else {
            res.render('friends.ejs', {
                friends: '',
                user: req.user,
                errorMessage: 'FB account is not linked.'
            });
        }
        // res.redirect('/profile');

    });


    app.get('/home', isLoggedIn, function (req, res) {
        if (typeof req.user.orgid !== 'undefined') {
            res.json({message: "organization user is found!", user: req.user});
        } else {
            res.render('home.ejs', {user: req.user});
        }
    });

    app.get('/morrisroute', function (req, res) {
        // res.json([
        //   {label: "Download Sales", value: 100},
        //   {label: "In-Store Sales", value: 30},
        //   {label: "Mail-Order Sales", value: 20}
        // ]);
        res.redirect('http://192.168.8.100:8080/getAllRatingsCount');
    });

    app.get('/facebookmyratings', isLoggedIn, function (req, res) {
        res.render('facebookmyratings.ejs', {user: req.user});
    });

    app.get('/facebookratedByMe', isLoggedIn, function (req, res) {
        res.render('facebookratedByMe.ejs', {user: req.user});
    });

    app.get('/linkedinmyratings', isLoggedIn, function (req, res) {
        res.render('linkedinmyratings.ejs', {user: req.user});
    });

    app.get('/linkedinratedByMe', isLoggedIn, function (req, res) {
        res.render('linkedinratedByMe.ejs', {user: req.user});
    });

    app.get('/history', isLoggedIn, function (req, res) {
        res.render('history.ejs', {user: req.user});
    });

    app.get('/organizations/:orgid', function (req, res) {
        var orgid = req.params.orgid;

        if (req.user && req.user.orgid) {
            OrgUser.findOne({
                orgid: orgid
            }, function (err, organization) {
                if (err) {
                    console.log("Unexpected error while getting org user");
                    res.render('home.ejs', {user: req.user});
                }
                if (organization) {
                    res.render('organizationEdit.ejs', {org: organization});
                } else {
                    console.log("Cannot get organization from given id: " + orgid);
                    res.render('home.ejs', {user: req.user});
                }
            });
        } else {
            if (!orgid) {
                console.error("invalid organization id");
                res.render('home.ejs', {user: req.user});
            }
            OrgUser.findOne({
                orgid: orgid
            }, function (err, organization) {
                if (err) {
                    console.log("Unexpected error while getting org user");
                    res.render('home.ejs', {user: req.user});
                }
                if (organization) {
                    res.render('organization.ejs', {org: organization});
                } else {
                    console.log("Cannot get organization from given id: " + orgid);
                    res.render('home.ejs', {user: req.user});
                }
            });
        }
    });

    app.get('/rateafriend', isLoggedIn, function (req, res) {

        if (req.user.userDetails.facebook) {
            facebook.getFbData(req, '/me/friends', function (data) {
                console.log(data);
                console.log("-------------------------------------");
                var jsonPretty = JSON.stringify(JSON.parse(data), null, 2);
                console.log(jsonPretty);

                obj = JSON.parse(data);

                console.log("obj.data: " + obj);
                console.log(JSON.stringify("obj.data: " + JSON.parse(data), null, 2));

                res.render('rateafriend.ejs', {
                    friends: obj.data,
                    user: req.user
                });

            });
        } else {
            res.render('rateafriend.ejs', {
                friends: undefined,
                user: req.user
            });
        }
    });

    app.get('/allFacebookUsersRatedByMe', isLoggedIn, function (req, res) {
        res.render('allFacebookUsersRatedByMe.ejs', {user: req.user});
    });

    app.get('/usersummary', function (req, res) {
        console.log('sender: ');
        rest.post(req.protocol + '://' + req.get('host') + '/claimRating', {
            data: {sender: 'Pubudu', target: 'Dodangoda', cClass: 'cClassTest', claimId: 334},
        }).on('complete', function (data, response) {
            //if (response.statusCode == 201) { // you can get at the raw response like this...
            var summary = [];
            //summary.push({'positive': data.positive, 'negative': data.negative, 'uncertain': data.uncertain});
            summary.push({
                    "label": 'positive',
                    "value": data.positive,
                    "color": "#33CC33"
                },
                {
                    "label": 'negative',
                    "value": data.negative,
                    "color": "#FF0000"
                },
                {
                    "label": 'uncertain',
                    "value": data.uncertain,
                    "color": "#FF9900"
                }
            );
            //console.log(summary);
            res.render('usersummary.ejs', {user: req.user, summary: summary});
            //}
        });
    });

    app.post('/changepassword', isLoggedIn, function (req, res) {

        User.findById(req.user._id)
            //.populate('userDetails.facebook')
            //.populate('userDetails.linkedin')
            //.populate('facebook.ratedByMe')
            .exec(function (error, user) {
                //console.log(JSON.stringify(user, null, "\t"));
                if (user.validPassword(req.body.oldpassword)) {
                    console.log('passwords match');
                    user.userDetails.local.password = user.generateHash(req.body.password);
                    user.save(function (err) {
                        if (err) {
                            return done(err);
                        }
                        req.flash('passwordChangeSuccess', 'Password changed successfully.');
                        res.redirect('/profile');
                        //res.render('profile.ejs', {
                        //    user: user,
                        //    errorMessage: req.flash('passwordChangeError'),
                        //    successMessage: req.flash('passwordChangeSuccess')
                        //});
                    });
                } else {
                    console.log('passwords dont match');
                    req.flash('passwordChangeError', 'Current password that you have entered is incorrect. Please try again.');
                    res.redirect('/profile');
                }

                //res.render('partials/profile', {user: user});
            });


    });

    app.get("/facebook", isLoggedIn, function (req, res) {

        controller.getUserID('100000211592969', function (error, sid) {

            if (!error) {
                console.log("sid: " + sid);
            } else {
                console.log("ERROR");
            }
            res.send(200);
        });

    });


    var sendSuggestions = function (req, res) {

        var name = req.query.name || req.body.name;
        var id = req.query.id || req.body.id;

        console.log("/overview: " + name + ", " + id);

        if (!name) {
            name = 'a';
        }

        if (!id) {
            // res.json({success: false, id: "id not defined", name: name});
            rest.post(req.protocol + '://' + req.get('host') + '/other/getSuggestions', {
                data: {text: name},
            }).on('complete', function (data, response) {
                console.log("Data: " + data);
                console.log("response: " + response);
                res.render('usersummarysuggestions.ejs', {user: req.user, suggestions: data});
            });
        } else {
            User.findOne({
                _id: id
            }, function (err, user) {
                if (err) {
                    console.log("Error occurred");
                    res.render('usersummaryoverall.ejs', {user: req.user, name: name, facebook: [], linkedin: []});
                } else {
                    if (user) {

                        console.log("User found");

                        var facebookData = [];
                        var linkedinData = [];

                        if (user.userDetails.facebook) {
                            console.log("Facebook found");
                            Facebook.findOne({
                                _id: user.userDetails.facebook
                            }, function (err, facebook) {
                                if (err) {
                                    console.log("Error occurred");
                                    res.render('usersummaryoverall.ejs', {
                                        user: req.user,
                                        name: name,
                                        facebook: facebookData,
                                        linkedin: linkedinData
                                    });
                                } else {
                                    if (facebook) {

                                        Claim.find({
                                            myid: facebook.uid
                                        }, function (err, claims) {

                                            if (err) {
                                                console.log("Error occurred");
                                                res.render('usersummaryoverall.ejs', {
                                                    user: req.user,
                                                    name: name,
                                                    facebook: facebookData,
                                                    linkedin: linkedinData
                                                });
                                            } else {
                                                if (claims) {

                                                    console.log("Claims found");

                                                    var yes = 0, no = 0, notSure = 0;

                                                    for (var i = 0; i < claims.length; i++) {
                                                        yes += claims[i].yes;
                                                        no += claims[i].no;
                                                        notSure += claims[i].notSure;
                                                    }
                                                    facebookData = [
                                                        {label: "Yes", value: yes},
                                                        {label: "No", value: no},
                                                        {label: "Not Sure", value: notSure}
                                                    ];
                                                    console.log("facebookData: " + facebookData);

                                                    if (user.userDetails.linkedin) {
                                                        console.log("Linkedin found");
                                                        LinkedIn.findOne({
                                                            _id: user.userDetails.linkedin
                                                        }, function (err, linkedin) {
                                                            if (err) {
                                                                console.log("Error occurred");
                                                                res.render('usersummaryoverall.ejs', {
                                                                    user: req.user,
                                                                    name: name,
                                                                    facebook: facebookData,
                                                                    linkedin: linkedinData
                                                                });
                                                            } else {
                                                                if (linkedin) {

                                                                    Claim.find({
                                                                        myid: linkedin.uid
                                                                    }, function (err, claims) {

                                                                        if (err) {
                                                                            console.log("Error occurred");
                                                                            res.render('usersummaryoverall.ejs', {
                                                                                user: req.user,
                                                                                name: name,
                                                                                facebook: facebookData,
                                                                                linkedin: linkedinData
                                                                            });
                                                                        } else {
                                                                            if (claims) {

                                                                                console.log("Claims found");
                                                                                yes = 0;
                                                                                no = 0;
                                                                                notSure = 0;

                                                                                for (var i = 0; i < claims.length; i++) {
                                                                                    yes += claims[i].yes;
                                                                                    no += claims[i].no;
                                                                                    notSure += claims[i].notSure;
                                                                                }

                                                                                linkedinData = [
                                                                                    {
                                                                                        label: "Yes",
                                                                                        value: yes
                                                                                    },
                                                                                    {
                                                                                        label: "No",
                                                                                        value: no
                                                                                    },
                                                                                    {
                                                                                        label: "Not Sure",
                                                                                        value: notSure
                                                                                    }
                                                                                ];
                                                                                console.log("linkedinData: " + linkedinData);

                                                                                res.render('usersummaryoverall.ejs', {
                                                                                    user: req.user,
                                                                                    name: name,
                                                                                    facebook: facebookData,
                                                                                    linkedin: linkedinData
                                                                                });

                                                                            } else {
                                                                                console.log("No claims found");
                                                                                res.render('usersummaryoverall.ejs', {
                                                                                    user: req.user,
                                                                                    name: name,
                                                                                    facebook: facebookData,
                                                                                    linkedin: linkedinData
                                                                                });
                                                                            }
                                                                        }
                                                                    });
                                                                } else {
                                                                    console.log("No linkedin found");
                                                                    res.render('usersummaryoverall.ejs', {
                                                                        user: req.user,
                                                                        name: name,
                                                                        facebook: facebookData,
                                                                        linkedin: linkedinData
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    } else {
                                                        console.log("No linkedin account linked");

                                                        res.render('usersummaryoverall.ejs', {
                                                            user: req.user,
                                                            name: name,
                                                            facebook: facebookData,
                                                            linkedin: linkedinData
                                                        });
                                                    }

                                                } else {
                                                    console.log("No claims found");
                                                    res.render('usersummaryoverall.ejs', {
                                                        user: req.user,
                                                        name: name,
                                                        facebook: facebookData,
                                                        linkedin: linkedinData
                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        console.log("No facebook found");
                                        res.render('usersummaryoverall.ejs', {
                                            user: req.user,
                                            name: name,
                                            facebook: facebookData,
                                            linkedin: linkedinData
                                        });
                                    }
                                }
                            });
                        }
                    } else {
                        console.log("No user found");
                        res.render('usersummaryoverall.ejs', {user: req.user, name: name, facebook: [], linkedin: []});
                    }
                }
            });
        }
    };

    app.post("/overview", function (req, res) {
        sendSuggestions(req, res);
    }).get("/overview", function (req, res) {
        sendSuggestions(req, res);
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    console.log("isAuthenticated: " + req.isAuthenticated());
    console.log(chalk.green("User: " + req.user));
    //console.log("Token: " + req.user.token);
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}
