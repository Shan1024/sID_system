var chalk = require('chalk');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var nodemailer = require("nodemailer");
var fs = require('fs');
var passport = require('passport');

var User = require('../models/user'); // get our mongoose model

module.exports = function (app, express) {
    /*
     Here we are configuring our SMTP Server details.
     STMP is mail server which is responsible for sending and recieving email.
     */
    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: app.get('username'),
            pass: app.get('password')
        }
    });

    var baseRouter = express.Router();


    /**
     * @api {post} /setup Create a new user account
     * @apiName /setup
     * @apiGroup Base Router
     *
     * @apiParam {String} username Users email address.
     * @apiParam {String} password Users password.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "success": true,
     *       "message": "User created"
     *     }
     *
     */
    baseRouter.route('/setup')
        .post(function (req, res) {

            var username = req.body.username;
            var password = req.body.password;

            if (username) {
                console.log(chalk.yellow('Username: ' + username));
                if (password) {
                    console.log(chalk.yellow('Password: [password omitted]'));

                    User.findOne({
                        'user.local.username': username
                    }, function (err, user) {
                        if (err) {
                            console.log(chalk.red('Error'));
                            res.json({
                                success: false,
                                message: 'Error'
                            });
                        } else {
                            if (user) {
                                console.log(chalk.red('User already exists'));
                                res.json({
                                    success: false,
                                    message: 'User already exists'
                                });
                            } else {

                                var newUser = new User();

                                newUser.user.local.username = username;
                                newUser.user.local.password = newUser.generateHash(password);
                                newUser.user.local.verified = false;

                                console.log(chalk.yellow('Hashed Password: ' + newUser.user.local.password));

                                // save the sample user
                                newUser.save(function (err) {
                                    if (err) {
                                        console.log(chalk.red('Error'));
                                        res.json({
                                            success: false,
                                            message: 'Error'
                                        });
                                    }
                                    console.log(chalk.green('User created'));
                                    res.status(200).json({
                                        success: true,
                                        message: 'User created'
                                    });
                                });
                            }
                        }
                    });
                } else {
                    console.log(chalk.red('Setup failed. Password required.'));
                    res.status(400).json({
                        success: false,
                        message: 'Authentication failed. Password required.'
                    });
                }
            } else {
                console.log(chalk.red('Setup failed. Username required.'));
                res.status(400).json({
                    success: false,
                    message: 'Authentication failed. Username required.'
                });
            }
        });

    /**
     * @api {post} /authenticate Authenticate an user
     * @apiName /authenticate
     * @apiGroup Base Router
     *
     * @apiParam {String} username Users email address.
     * @apiParam {String} password Users password.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "success": true,
     *       "token": "{TOKEN}"
     *     }
     *
     */
    baseRouter.route('/authenticate')
        .post(function (req, res) {

            var username = req.body.username;
            var password = req.body.password;

            if (username) {
                console.log(chalk.yellow('Username: ' + username));
                // find the user

                if (password) {
                    console.log(chalk.yellow('Password: ' + password));

                    User.findOne({
                        'userDetails.local.username': username
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

                                console.log(chalk.yellow('apiSecret' + apiSecret));
                                // if user is found and password is right
                                // create a token

                                Facebook.findOne({}, function (err, facebook) {
                                    if (err) {
                                        res.status(400).json({
                                            success: false,
                                            message: 'Error occurred.'
                                        });
                                    } else {
                                        if (facebook) {
                                            var tempUser = {
                                                iss: 'sID',
                                                context: {
                                                    username: user.userDetails.local.username,
                                                    id: facebook.id,
                                                    uid: facebook.uid
                                                }
                                            };

                                            var token = jwt.sign(tempUser, apiSecret, {
                                                expiresInMinutes: 1440 // expires in 24 hours
                                            });

                                            // return the information including token as JSON
                                            res.json({
                                                success: true,
                                                linked: true,
                                                fbappid: facebook.id,
                                                fbid: facebook.uid,
                                                token: token
                                            });
                                        } else {
                                            res.status(400).json({
                                                success: false,
                                                linked: false,
                                                message: 'No facebook account linked.'
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

    // REGISTER OUR ROUTES -------------------------------
    // routers that do not need a token are here
    app.use('/', baseRouter);
};
