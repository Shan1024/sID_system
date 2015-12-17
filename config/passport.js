// load all the things we need
var chalk = require('chalk');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

var rest = require('restler');

// load the auth variables
var configAuth = require('./auth');

// load up the user model
var User = require('../app/models/user');
var Facebook = require('../app/models/facebook');
var Entry = require("../app/models/entry");
var LinkedIn = require("../app/models/linkedin");

var controller = require('../app/controllers/controllers');

module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and deserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        //console.log("From Serializer: " + user);
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        //User.findById(id, function (err, user) {
        //    done(err, user);
        //});

        console.log("Deserializing user");

        User.findOne({
                _id: id
            })
            .populate('userDetails.facebook')
            .populate('userDetails.linkedin')
            //.populate('facebook.ratedByMe')
            .exec(function (error, user) {
                console.log(JSON.stringify(user, null, "\t"));
                if(user){
                    done(error, user);
                }else{
                    done(error);
                }


                //res.render('partials/profile', {user: user});
            });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, email, password, done) {
            if (email) {
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
            }
            // asynchronous
            process.nextTick(function () {
                User.findOne({'userDetails.local.email': email}, function (err, user) {
                    // if there are any errors, return the error
                    if (err) {
                        return done(err);
                    }
                    // if no user is found, return the message
                    if (!user) {
                        return done(null, false, req.flash('loginMessage', 'No user found.'));
                    }
                    if (!user.validPassword(password)) {
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                    }
                    // all is well, return user
                    else {
                        return done(null, user);
                    }
                });
            });

        }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, email, password, done) {
            if (email) {
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
            }
            // asynchronous
            process.nextTick(function () {
                // if the user is not already logged in:
                if (!req.user) {
                    User.findOne({'userDetails.local.email': email}, function (err, user) {
                        // if there are any errors, return the error
                        if (err) {
                            return done(err);
                        }
                        // check to see if theres already a user with that email
                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'Email that you have entered is already used to create an account.'));
                        } else {

                            // create the user
                            var newUser = new User();

                            //firstname, lastname added
                            newUser.userDetails.local.firstname = req.body.firstname;
                            newUser.userDetails.local.lastname = req.body.lastname;
                            newUser.userDetails.local.email = email;
                            newUser.userDetails.local.password = newUser.generateHash(password);

                            controller.sendEmail(req);


                            newUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }

                                return done(null, newUser);
                            });
                        }

                    });
                    // if the user is logged in but has no local account...
                } else if (!req.user.userDetails.local.email) {
                    // ...presumably they're trying to connect a local account
                    // BUT let's check if the email used to connect a local account is being used by another user
                    User.findOne({'userDetails.local.email': email}, function (err, user) {
                        if (err) {
                            return done(err);
                        }
                        if (user) {
                            return done(null, false, req.flash('loginMessage', 'Email that you have entered is already used to create an account.'));
                            // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                        } else {
                            var tempUser = req.user;//User already used above
                            tempUser.userDetails.local.email = email;
                            var newUser = new User();
                            tempUser.userDetails.local.password = newUser.generateHash(password);
                            tempUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                return done(null, tempUser);
                            });
                        }
                    });
                } else {
                    // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                    return done(null, req.user);
                }

            });

        }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================

    //This function is used for facebook authentication
    var facebookAuth = function (req, token, refreshToken, profile, done) {

        console.log(chalk.yellow("TOKEN1: " + JSON.stringify(token, null, "\t")));
        //console.log(chalk.blue("TOKEN SECRET: " + JSON.stringify(tokenSecret, null, "\t")));
        console.log(chalk.yellow("PROFILE1: " + JSON.stringify(profile, null, "\t")));

        // asynchronous
        process.nextTick(function () {

            // check if the user is already logged in
            if (!req.user) {

                Facebook.findOne({
                    id: profile.id
                }, function (err, facebook) {
                    if (err) {
                        return done(err);
                    }
                    if (facebook) {

                        if (!facebook.token) {
                            facebook.token = token;
                            facebook.name = profile.displayName;
                            facebook.email = (profile.emails[0].value || '').toLowerCase();

                            //console.log("USER: "+user);

                            var newUser = new User({
                                'userDetails.facebook': facebook._id
                            });

                            facebook.user = newUser._id;

                            facebook.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                newUser.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, newUser);
                                });

                            });
                        } else {

                            User.findById(facebook.user, function (err, user) {
                                if (err) {
                                    return done(err);
                                }
                                return done(null, user);
                            });
                        }

                    } else {
                        return done(null);
                    }
                });

            } else {
                return done(null);
            }
        });
    };

    //facebook authenticate http strategy
    passport.use('facebook-auth-http', new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL_auth_http,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

        },
        function (req, token, refreshToken, profile, done) {
            facebookAuth(req, token, refreshToken, profile, done);
        })
    );

    //facebook authenticate https strategy
    passport.use('facebook-auth-https', new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL_auth_https,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

        },
        function (req, token, refreshToken, profile, done) {
            facebookAuth(req, token, refreshToken, profile, done);
        })
    );

    //facebook authenticate https strategy
    passport.use('facebook-auth-plugin-https', new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL_auth_plugin_https,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, token, refreshToken, profile, done) {


            console.log("ID: " + profile.id);
            //return done(null, {_id: profile.id});
            facebookAuth(req, token, refreshToken, profile, done);
        })
    );

    //This function is used for facebook connect
    var facebookConnect = function (req, token, refreshToken, profile, done) {

        console.log(chalk.blue("TOKEN: " + JSON.stringify(token, null, "\t")));
        //console.log(chalk.blue("TOKEN SECRET: " + JSON.stringify(tokenSecret, null, "\t")));
        console.log(chalk.blue("PROFILE: " + JSON.stringify(profile, null, "\t")));

        // asynchronous
        process.nextTick(function () {

            // check if the user is already logged in
            if (!req.user) {
                return done(null);
            } else {
                // user already exists and is logged in, we have to link accounts
                var newUser = req.user; // pull the user out of the session

                Facebook.findOne({
                    id: profile.id
                }, function (err, fbUser) {

                    if (fbUser) {

                        fbUser.token = token;

                        var oldUserId = fbUser.user;

                        fbUser.user = newUser._id;

                        fbUser.save(function (err) {
                            if (err) {
                                return done(err);
                            }
                            newUser.userDetails.facebook = fbUser._id;

                            newUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                //Content merging

                                //User.findOne({
                                //    _id: oldUserId
                                //}, function (err, oldUser) {
                                //    User.update(
                                //        {_id: newUser._id},
                                //        {$addToSet: {'facebook.ratedByMe': {$each: oldUserId.facebook.ratedByMe}}}
                                //    )
                                //    User.update(
                                //        {_id: newUser._id},
                                //        {$addToSet: {'facebook.ratedByOthers': {$each: oldUserId.facebook.ratedByOthers}}}
                                //    )
                                //});


                                return done(null, newUser);
                            });
                        });

                    } else {

                        var facebook = new Facebook();

                        facebook.id = profile.id;
                        facebook.token = token;
                        facebook.name = profile.displayName;
                        facebook.email = (profile.emails[0].value || '').toLowerCase();

                        facebook.user = newUser._id;

                        console.log("++++++++++++++++++++++++++++++++++++++")
                        console.log('getting user ID')
                        controller.getID(profile.id, function (error, uid) {

                            if (!error) {
                                facebook.uid = uid;
                                console.log("UID: " + uid);
                            } else {
                                console.log(error)
                            }

                            facebook.save(function (err) {
                                if (err) {
                                    return done(err);
                                } else {
                                    newUser.userDetails.facebook = facebook._id;

                                    newUser.save(function (err) {
                                        if (err) {
                                            return done(err);
                                        }
                                        return done(null, newUser);
                                    });
                                }
                            });

                        });


                    }
                });
            }
        });
    };

    passport.use('facebook-connect-http', new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL_connect_http,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, token, refreshToken, profile, done) {
            facebookConnect(req, token, refreshToken, profile, done);
        })
    );

    passport.use('facebook-connect-https', new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL_connect_https,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, token, refreshToken, profile, done) {
            facebookConnect(req, token, refreshToken, profile, done);
        })
    );

    passport.use('linkedin-connect', new LinkedInStrategy({
            clientID: configAuth.linkedinAuth.consumerKey,
            clientSecret: configAuth.linkedinAuth.consumerSecret,
            callbackURL: configAuth.linkedinAuth.callbackURL2,
            passReqToCallback: true, // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            state: true,
            profileFields: ['id', 'first-name', 'last-name', 'email-address'],
            scope: ['r_emailaddress', 'r_basicprofile']
        },

        function (req, token, refreshToken, profile, done) {

            //console.log(profile);
            /*console.log(' req    : '+ req);
             console.log(' token  : '+ token);
             console.log(' rtoken : '+ refreshToken);
             console.log(' profile: '+ profile);
             console.log(' done   : '+ done); */

            //linkedin.setLinkedInToken(token);

            console.log(chalk.yellow("User found 564: " + JSON.stringify(profile, null, "\t")));
            console.log(chalk.yellow("Token found  75876: " + JSON.stringify(token, null, "\t")));
            console.log(chalk.yellow("refreshToken found: " + JSON.stringify(refreshToken, null, "\t")));
            // asynchronous
            process.nextTick(function () {

                // check if the user is already logged in
                if (!req.user) {

                    LinkedIn.findOne({
                        uid: profile.id
                    }, function (err, linkedin) {
                        if (err) {
                            return done(err);
                        }
                        if (linkedin) {

                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!linkedin.token) {
                                linkedin.token = token;
                                linkedin.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                                linkedin.email = (profile.emails[0].value || '').toLowerCase();

                                //console.log("USER: "+user);

                                var newUser = new User({
                                    'userDetails.linkedin': linkedin._id
                                });

                                linkedin.user = newUser._id;

                                linkedin.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    newUser.save(function (err) {
                                        if (err) {
                                            return done(err);
                                        }
                                        return done(null, newUser);
                                    });
                                });

                                rest.get('https://api.linkedin.com/v1/people/~?format=json&oauth2_access_token=' + token).on('complete', function (data) {
                                    linkedin.url = data.siteStandardProfileRequest.url;

                                    linkedin.save(function (err) {
                                        if (err) {
                                            return done(err);
                                        }

                                        return done(null, newUser);
                                    });
                                });


                            } else {

                                User.findById(linkedin.user, function (err, user) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, user);
                                });
                            }
                        } else {
                            // if there is no user, create them
                            var newLinkedIn = new LinkedIn();

                            newLinkedIn.uid = profile.id;
                            newLinkedIn.token = token;
                            newLinkedIn.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                            newLinkedIn.email = (profile.emails[0].value || '').toLowerCase();


                            var newLinkedInUser = new User({
                                'userDetails.linkedin': newLinkedIn._id
                            });

                            newLinkedInUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                newLinkedIn.user = newLinkedInUser._id;

                                newLinkedIn.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, newLinkedInUser);
                                });

                                console.log(chalk.blue("sending restler request"));
                                rest.get('https://api.linkedin.com/v1/people/~?format=json&oauth2_access_token=' + token).on('complete', function (data) {
                                    console.log(chalk.yellow("response: " + data));
                                    linkedin.url = data.siteStandardProfileRequest.url;

                                    console.log(chalk.yellow("linkedin.url: " + linkedin.url));

                                    linkedin.save(function (err) {
                                        if (err) {
                                            console.log(chalk.red("Error occurred: " + err))
                                            return done(err);
                                        }

                                        return done(null, newUser);
                                    });
                                });
                            });
                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var newUser = req.user; // pull the user out of the session


                    LinkedIn.findOne({
                        uid: profile.id
                    }, function (err, linkedinUser) {

                        if (linkedinUser) {

                            linkedinUser.token = token;

                            var oldUserId = linkedinUser.user;

                            linkedinUser.user = newUser._id;

                            linkedinUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                newUser.userDetails.linkedin = linkedinUser._id;

                                newUser.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    //Content merging

                                    //User.findOne({
                                    //    _id: oldUserId
                                    //}, function (err, oldUser) {
                                    //    User.update(
                                    //        {_id: newUser._id},
                                    //        {$addToSet: {'facebook.ratedByMe': {$each: oldUserId.facebook.ratedByMe}}}
                                    //    )
                                    //    User.update(
                                    //        {_id: newUser._id},
                                    //        {$addToSet: {'facebook.ratedByOthers': {$each: oldUserId.facebook.ratedByOthers}}}
                                    //    )
                                    //});


                                    return done(null, newUser);
                                });
                            });

                        } else {

                            var linkedin = new LinkedIn();

                            linkedin.uid = profile.id;
                            linkedin.token = token;
                            linkedin.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                            linkedin.email = (profile.emails[0].value || '').toLowerCase();

                            linkedin.user = newUser._id;

                            linkedin.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                newUser.userDetails.linkedin = linkedin._id;

                                console.log(chalk.blue("sending restler request"));
                                rest.get('https://api.linkedin.com/v1/people/~?format=json&oauth2_access_token=' + token).on('complete', function (data) {
                                    console.log(chalk.yellow("response: " + data));
                                    linkedin.url = data.siteStandardProfileRequest.url;

                                    console.log(chalk.yellow("linkedin.url: " + linkedin.url));

                                    linkedin.save(function (err) {
                                        if (err) {
                                            console.log(chalk.red("Error occurred: " + err))
                                            return done(err);
                                        }

                                        return done(null, newUser);
                                    });
                                });

                                newUser.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, newUser);
                                });
                            });
                        }
                    });
                }
            });
        }));

    passport.use(new LinkedInStrategy({
            clientID: configAuth.linkedinAuth.consumerKey,
            clientSecret: configAuth.linkedinAuth.consumerSecret,
            callbackURL: configAuth.linkedinAuth.callbackURL,
            passReqToCallback: true, // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            state: true,
            profileFields: ['id', 'first-name', 'last-name', 'email-address'],
            scope: ['r_emailaddress', 'r_basicprofile']
        },

        function (req, token, refreshToken, profile, done) {

            //console.log(profile);
            /*console.log(' req    : '+ req);
             console.log(' token  : '+ token);
             console.log(' rtoken : '+ refreshToken);
             console.log(' profile: '+ profile);
             console.log(' done   : '+ done); */

            //linkedin.setLinkedInToken(token);

            console.log(chalk.yellow("User found: " + JSON.stringify(profile, null, "\t")));
            console.log(chalk.yellow("Token found 3232: " + JSON.stringify(token, null, "\t")));
            console.log(chalk.yellow("refreshToken found b53453: " + JSON.stringify(refreshToken, null, "\t")));
            // asynchronous
            process.nextTick(function () {

                // check if the user is already logged in
                if (!req.user) {

                    LinkedIn.findOne({
                        uid: profile.id
                    }, function (err, linkedin) {
                        if (err) {
                            return done(err);
                        }
                        if (linkedin) {

                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!linkedin.token) {
                                linkedin.token = token;
                                linkedin.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                                linkedin.email = (profile.emails[0].value || '').toLowerCase();

                                //console.log("USER: "+user);

                                var newUser = new User({
                                    'userDetails.linkedin': linkedin._id
                                });

                                linkedin.user = newUser._id;

                                linkedin.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }

                                    console.log(chalk.blue("sending restler request"));
                                    rest.get('https://api.linkedin.com/v1/people/~?format=json&oauth2_access_token=' + token).on('complete', function (data) {
                                        console.log(chalk.yellow("response: " + data));
                                        linkedin.url = data.siteStandardProfileRequest.url;

                                        console.log(chalk.yellow("linkedin.url: " + linkedin.url));

                                        linkedin.save(function (err) {
                                            if (err) {
                                                console.log(chalk.red("Error occurred: " + err))
                                                return done(err);
                                            }

                                            return done(null, newUser);
                                        });
                                    });

                                    newUser.save(function (err) {
                                        if (err) {
                                            return done(err);
                                        }
                                        return done(null, newUser);
                                    });
                                });

                            } else {

                                User.findById(linkedin.user, function (err, user) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, user);
                                });
                            }
                        } else {
                            // if there is no user, create them
                            var newLinkedIn = new LinkedIn();

                            newLinkedIn.uid = profile.id;
                            newLinkedIn.token = token;
                            newLinkedIn.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                            newLinkedIn.email = (profile.emails[0].value || '').toLowerCase();


                            var newLinkedInUser = new User({
                                'userDetails.linkedin': newLinkedIn._id
                            });

                            newLinkedInUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                newLinkedIn.user = newLinkedInUser._id;

                                newLinkedIn.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, newLinkedInUser);
                                });

                                console.log(chalk.blue("sending restler request"));
                                rest.get('https://api.linkedin.com/v1/people/~?format=json&oauth2_access_token=' + token).on('complete', function (data) {
                                    console.log(chalk.yellow("response: " + data));
                                    linkedin.url = data.siteStandardProfileRequest.url;

                                    console.log(chalk.yellow("linkedin.url: " + linkedin.url));

                                    linkedin.save(function (err) {
                                        if (err) {
                                            console.log(chalk.red("Error occurred: " + err))
                                            return done(err);
                                        }

                                        return done(null, newUser);
                                    });
                                });
                            });

                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var newUser = req.user; // pull the user out of the session


                    LinkedIn.findOne({
                        uid: profile.id
                    }, function (err, linkedinUser) {

                        if (linkedinUser) {

                            linkedinUser.token = token;

                            var oldUserId = linkedinUser.user;

                            linkedinUser.user = newUser._id;

                            linkedinUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                newUser.userDetails.linkedin = linkedinUser._id;

                                newUser.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    //Content merging

                                    //User.findOne({
                                    //    _id: oldUserId
                                    //}, function (err, oldUser) {
                                    //    User.update(
                                    //        {_id: newUser._id},
                                    //        {$addToSet: {'facebook.ratedByMe': {$each: oldUserId.facebook.ratedByMe}}}
                                    //    )
                                    //    User.update(
                                    //        {_id: newUser._id},
                                    //        {$addToSet: {'facebook.ratedByOthers': {$each: oldUserId.facebook.ratedByOthers}}}
                                    //    )
                                    //});


                                    return done(null, newUser);
                                });
                            });

                        } else {

                            var linkedin = new LinkedIn();

                            linkedin.uid = profile.id;
                            linkedin.token = token;
                            linkedin.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                            linkedin.email = (profile.emails[0].value || '').toLowerCase();

                            linkedin.user = newUser._id;

                            linkedin.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                newUser.userDetails.linkedin = linkedin._id;

                                newUser.save(function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, newUser);
                                });
                            });
                        }
                    });
                }
            });
        }));
};
