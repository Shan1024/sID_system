var facebook = require('../../config/facebook.js');

var chalk = require('chalk');

var mongoose = require('mongoose');

var rest = require('restler');
var http = require('http');

var User = require('../models/user');
var Facebook = require('../models/facebook');
var Entry = require("../models/entry");
var LinkedIn = require("../models/linkedin");

//var rest = require('restler');
//var http = require('http');
//var request = require('request');
//.defaults({jar: true});
//request = request.defaults({jar: true});


module.exports = function (app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function (req, res) {

        //req.user.userDetails.local.email

        if (req.user) {
            res.redirect('/home');
        } else {
            res.render('index.ejs', {
                user: req.user,
                message: req.flash('error')
            });
        }

    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function (req, res) {
        //User.findById(req.user._id)
        //    //.populate('userDetails.facebook')
        //    //.populate('facebook.ratedByMe')
        //    .exec(function (error, user) {
        //        console.log(JSON.stringify(user, null, "\t"));
        //    });

        User.findById(req.user._id)
            .populate('userDetails.facebook')
            .populate('userDetails.linkedin')
            //.populate('facebook.ratedByMe')
            .exec(function (error, user) {
                console.log(JSON.stringify(user, null, "\t"));
                res.render('profile.ejs', {
                    user: user
                });

                //res.render('partials/profile', {user: user});
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
        res.render('login.ejs', {message: req.flash('loginMessage')});
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
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email, user_friends'}));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/home',
            failureRedirect: '/',
            failureFlash: 'Facebook account is not linked to any local user account. Please create a local user account and link the Facebook account to use the login with Facebook.'
        })
    );

    app.get('/auth/linkedin', passport.authenticate('linkedin'));

    app.get('/auth/linkedin/callback',
        passport.authenticate('linkedin', {
            successRedirect: '/home',
            failureRedirect: '/',
            failureFlash: 'LinkedIn account is not linked to any local user account. Please create a local user account and link the LinkedIn account to use the login with LinkedIn.'
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
    app.get('/connect/local', function (req, res) {
        res.render('connect-local.ejs', {message: req.flash('loginMessage')});
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authenticate('facebook-authz', {failureRedirect: '/failed'}));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',


        //passport.authorize('facebook-authz', {
        //    successRedirect: '/okk',
        //    failureRedirect: '/failed'
        //}),
        //function (req, res) {
        //    var user = req.user;
        //
        //    console.log(chalk.blue("facebook-authz: " + JSON.stringify(user, null, "\t")));
        //
        //    if (user) {
        //        return ;
        //    }
        //}

        passport.authenticate('facebook-authz', {
            successRedirect: '/profile',
            failureRedirect: '/failure'
        })
    );

    app.get('/connect/linkedin', passport.authenticate('linkedin-authz', {
        res: ['r_basicprofile', 'r_fullprofile', 'r_emailaddress']
    }));

    // the callback after google has authorized the user
    app.get('/connect/linkedin/callback',
        passport.authenticate('linkedin-authz', {
            successRedirect: '/profile',
            failureRedirect: '/failure'
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function (req, res) {
        var user = req.user;
        user.userDetails.local.email = undefined;
        user.userDetails.local.password = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

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
                user: req.user
            });

        });

        // res.redirect('/profile');

    });

    app.get('/home', isLoggedIn, function (req, res) {
        res.render('home.ejs', {user: req.user});
    });

    app.get('/myratings', isLoggedIn, function (req, res) {
        res.render('myratings.ejs', {user: req.user});
    });

    app.get('/history', isLoggedIn, function (req, res) {
        res.render('history.ejs', {user: req.user});
    });

    app.get('/rateafriend', isLoggedIn, function (req, res) {

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
    });

    app.get('/usersummary', function (req, res) {
        rest.post('http://localhost:8080/claimRating', {
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
            .populate('userDetails.facebook')
            .populate('userDetails.linkedin')
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
                        res.render('profile.ejs', {
                            user: user
                        });
                    });
                } else {
                    console.log('passwords dont match');
                    req.flash('loginMessage', 'Passwords do not match.');
                    res.render('login.ejs', {message: req.flash('loginMessage')});
                }

                //res.render('partials/profile', {user: user});
            });


    });

    //app.get('/facebook', isLoggedIn,  function (req, res) {
    //console.log("");
    //    res.render('facebook.ejs', { url: req.query.url});
    //});

    //app.get('/facebook', function (req, res) {
    //        rest.post('https://www.facebook.com/login.php',
    //            {
    //                data: {
    //                    lsd: 'AVokR4fq',
    //                    email: 'tharangaseetee@gmail.com',
    //                    pass: 'abc',
    //                    persistent: '1',
    //                    default_persistent: '0',
    //                    timezone: -330,
    //                    lgndim: 'eyJ3IjoxMzY2LCJoIjo3NjgsImF3IjoxMzY2LCJhaCI6NzI4LCJjIjoyNH0=',
    //                    lgnrnd: '093552_Umbh',
    //                    lgnjs: '1446485752',
    //                    locale: 'en_US',
    //                    qsstamp: 'W1tbMjIsMzAsNTYsODIsOTgsMTA0LDExNSwxMTksMTIwLDEzMSwxMzIsMTc2LDE3OCwxODIsMTg1LDE4OCwxOTAsMjIxLDIyMiwyMjMsMjQ2LDI1OSwyNzEsMjk0LDMwMywzMDUsMzI3LDMzNCwzMzksMzQwLDQwNiw0MTcsNDIyLDQ0Nyw0NTQsNDg5LDQ5NSw1MTUsNTIzLDU1NCw1NzYsNzQ2XV0sIkFabDItdHlranBDMG5uV1B2WHQzY3EyRWZOZDU4VV93X2V3YnZvTU0xMDhwVE1ESVdyYk0zNGZjZUdDZmN1azJwSGpVcndncUJrcXFKVmlGTXJPMnE0eXNJMDBpMWtHM2hDZDBGSWxHYlh6Zy1jenhkWVRCNExkeWJXM1UtbHZPN084U25IQkh1MVZxYzJkaGlzRmQycExSbVlMTjQ4ZllHdDhpQnFQdEUzSUtzZU5fYWdDazRTOURzYmczMDdxMkFMMzA3eW5tMmpjZnRTelJNTnBzVVJFcVBKNF9lR3BtQ1Qxb1hNb25tOGxQb1EiXQ== '
    //                }
    //
    //            }).on('complete', function (data, response) {
    //
    //                console.log(data);
    //                // var http = require('http');
    //                // var options = {method: 'HEAD', host: 'facebook.com', port: 80, path: '/10204567012270391'};
    //                // // var req = http.request(options, function(res) {
    //                // //     console.log(JSON.stringify(res.headers));
    //                // //     console.log(JSON.stringify(res.statusCode));
    //                // //   }
    //                // http.get(options, function(res) {
    //                //   console.log("Got response: " + res.statusCode);
    //                //
    //                //   for(var item in res.headers) {
    //                //     console.log(item + ": " + res.headers[item]);
    //                //   }
    //                // }).on('error', function(e) {
    //                //   console.log("Got error: " + e.message);
    //                // });
    //
    //
    //                // rest.get('https://www.facebook.com/10204567012270391',{
    //                //     method: 'HEAD'
    //                // }).on('complete', function(data) {
    //                //     console.log(data); // auto convert to object
    //                // });
    //
    //                // rest.head('https://www.facebook.com/10204567012270391').on('complete', function(data, response) {
    //                //     console.log(data); // auto convert to object
    //                //     // console.log(response);
    //                //
    //                //     console.log(response);
    //                //
    //                //     res.send(200);
    //                // });
    //
    //
    //                //rest.get('https://www.facebook.com/10204567012270391').on('complete', function(data, response) {
    //                //    console.log(data);
    //                //    console.log(response); // auto convert to object
    //                //});
    //
    //            });
    //    }
    //);


    //app.get("/facebook", function (req, res) {
    //
    //    //var j = request.jar();
    //    //var cookie = request.cookie('key1=value1');
    //    var url = "https://www.facebook.com/login.php?login_attempt=1&lwv=110";
    //    //j.setCookie(cookie, url);
    //
    //    var j = request.jar(new FileCookieStore('cookies.json'));
    //
    //    request({
    //        url: url,
    //        method: "POST",
    //        form: {//we can use 'qs' here for queries
    //            "email": "tharangaseetee@gmail.com",
    //            "pass": "abc"
    //        },
    //        headers: {
    //            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36'
    //        }
    //    }, function (error, response, html) {
    //        console.log("OK");
    //        //Checking for errors
    //        if (!error) {
    //
    //            console.log(html);
    //            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
    //            //var $ = cheerio.load(html);
    //            //
    //            //// Variables we're going to capture
    //            //var $code = $('#code');
    //            //
    //            ////Extract the id
    //            //var id = $code.text();
    //            //
    //            ////If id available
    //            //if(id){
    //            //    console.log(chalk.yellow("ID Found: " + id));
    //            //    res.json({"app_id": req.params.id, "user_id": $code.text()});
    //            //}else{
    //            //    console.log(chalk.red("ID Not Found"));
    //            //    res.json({"app_id": req.params.id, "user_id": "Not Found"});
    //            //}
    //        } else {
    //            console.log(chalk.red('Error occured: ' + error));
    //        }
    //        res.send(200);
    //    });
    //});

    //app.get('/facebooklog', function (req, res) {
    //    rest.post('https://www.facebook.com/?_rdr=p', {
    //        data: {email: 'tharangaseetee@gmail.com', pass: 'abc'},
    //    }).on('complete', function (data, response) {
    //
    //        console.log("OK");
    //        // var http = require('http');
    //        // var options = {method: 'HEAD', host: 'facebook.com', port: 80, path: '/10204567012270391'};
    //        // // var req = http.request(options, function(res) {
    //        // //     console.log(JSON.stringify(res.headers));
    //        // //     console.log(JSON.stringify(res.statusCode));
    //        // //   }
    //        // http.get(options, function(res) {
    //        //   console.log("Got response: " + res.statusCode);
    //        //
    //        //   for(var item in res.headers) {
    //        //     console.log(item + ": " + res.headers[item]);
    //        //   }
    //        // }).on('error', function(e) {
    //        //   console.log("Got error: " + e.message);
    //        // });
    //
    //
    //        // rest.get('https://www.facebook.com/10204567012270391',{
    //        //     method: 'HEAD'
    //        // }).on('complete', function(data) {
    //        //     console.log(data); // auto convert to object
    //        // });
    //
    //        // rest.head('https://www.facebook.com/10204567012270391').on('complete', function(data, response) {
    //        //     console.log(data); // auto convert to object
    //        //     // console.log(response);
    //        //
    //        //     console.log(response);
    //        //
    //        //     res.send(200);
    //        // });
    //
    //
    //        rest.get('https://www.facebook.com/10204567012270391').on('complete', function (data, response) {
    //            console.log(data.statusCode);
    //            console.log(response.statusCode); // auto convert to object
    //        });
    //
    //    });
    //});

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {

    console.log("isAuthenticated: " + req.isAuthenticated());

    console.log(chalk.green("User: " + req.user));

    //console.log("Token: " + req.user.token);

    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
