/**
 * Created by Shan on 11/4/2015.
 */
var chalk = require('chalk');
var cheerio = require('cheerio');
var jwt = require('jsonwebtoken');
var nodemailer = require("nodemailer");
var request = require('request');

var config = require('../../config/config');
var User = require('../models/user');

var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.username,
        pass: config.password
    }
});

module.exports.sendEmail = function (req, res) {

    var email = req.body.email;

    console.log("Sending confirmation to: " + email);

    if (email) {

        var tempUser = {
            iss: 'sID',
            context: {
                email: email
            }
        };

        var apiSecret = config.apiSecret;

        console.log("Api secret read from config");

        var token = jwt.sign(tempUser, apiSecret, {
            expiresInMinutes: 1440 // expires in 24 hours
        });

        console.log("Token generated");

        var host = config.host;

        console.log("Host: " + host);

        var mailOptions = {
            from: 'sID <' + config.username + '>', // sender address
            to: email, // list of receivers
            subject: 'sID Account Verification', // Subject line
            // text: 'Hello world', // plaintext body
            // html body
            html: 'Your account has been created. Please click the following link to verify the account<br><br>' + host + '/verify?token=' + token
        };

        console.log("sending email...");

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(chalk.red(error));
                //res.json({
                //    message: error
                //});

            } else {
                console.log(chalk.yellow('Email sent: ' + info.response));
                //res.json({
                //    success: true,
                //    message: 'Email sent successfully'
                //});

            }
        });

    } else {
        console.log(chalk.red('Email required.'));
        //res.json({
        //    success: false,
        //    message: 'Email required.'
        //});

    }
    // transporter.sendMail({
    //   from: 'fyp.social.id@gmail.com',
    //   to: 'gambit1024@gmail.com',
    //   subject: 'hello',
    //   text: 'hello world!'
    // });
};


module.exports.verifyEmail = function (req, res) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    console.log("token: " + token);

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, config.apiSecret, function (err, decoded) {
            if (err) {
                //return res.json({
                //    success: false,
                //    message: 'Failed to authenticate token.'
                //});
                req.flash('error', 'Token is not valid.');
                res.redirect('/');
                console.log('token is not valid');
            } else {
                // if everything is good, save to request for use in other routes
                // req.decoded = decoded;

                var email = decoded.context.email;

                console.log(chalk.yellow('decoded: ' + decoded));
                console.log(chalk.magenta('Email: ' + email));

                User.findOne({
                    'userDetails.local.email': email
                }, function (err, user) {
                    if (err) {
                        //res.status(403).json({
                        //    success: false,
                        //    message: 'Error occured - ' + err
                        //});
                        req.flash('error', 'Invalid Token.');
                        res.redirect('/');
                        console.log(chalk.red('Error: ' + err));
                    } else {

                        if (user) {

                            if (user.userDetails.local.verified === true) {
                                //res.json({
                                //    success: false,
                                //    message: username + ' already verified'
                                //});
                                req.flash('success', 'Email already verified.');
                                res.redirect('/');
                                console.log(chalk.red(email + ' already verified'));
                            } else {
                                user.userDetails.local.verified = true;

                                console.log(chalk.cyan('User: ' + user));

                                user.save(function (err) {
                                    if (err) {
                                        //res.status(403).json({
                                        //    success: false,
                                        //    message: 'Error occured - ' + err
                                        //});
                                        req.flash('error', 'Error occurred. Please try again.');
                                        res.redirect('/');
                                        console.log(chalk.red('Error: ' + err));
                                    } else {
                                        //res.json({
                                        //    success: true,
                                        //    message: username + ' verified'
                                        //});
                                        req.flash('success', 'Email verified successfully.');
                                        res.redirect('/');
                                        console.log(chalk.green(email + ' verified'));
                                    }
                                });
                            }
                        } else {
                            //res.status(403).json({
                            //    success: false,
                            //    message: 'Username not found'
                            //});
                            console.log(chalk.red('Email, ' + email + ' not found'));
                            req.flash('error', 'Invalid email address.');
                            res.redirect('/');
                        }
                    }
                });
            }
        });
    } else {
        // if there is no token
        // return an error
        //return res.status(403).send({
        //    success: false,
        //    message: 'No token provided.'
        //});
        res.redirect('/');
    }

};


module.exports.getID = function (id, callback) {

    console.log(chalk.yellow("ID lookup for " + id + " requested"));
    console.log(chalk.yellow("Searching . . ."));
    //Send a POST request with the fb app id
    request({
        url: "https://lookup-id.com",
        method: "POST",
        form: {//we can use 'qs' here for queries
            "fburl": "https://www.facebook.com/" + id,
            "check": "Lookup"
        }
    }, function (error, response, html) {

        //Checking for errors
        if (!error) {

            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
            var $ = cheerio.load(html);

            // Variables we're going to capture
            var $code = $('#code');

            //Extract the id
            var id = $code.text();

            //If id available
            if (id) {
                console.log(chalk.yellow("ID Found: " + id));
                //res.json({"app_id": req.params.id, "user_id": $code.text()});
                callback(null, $code.text());
            } else {
                console.log(chalk.red("ID Not Found"));
                //res.json({"app_id": req.params.id, "user_id": "Not Found"});
                callback('ID not found', null);
            }

        } else {
            console.log(chalk.red('Error occurred: ' + error));
            callback(error, null);
        }
    });

};


module.exports.getUserID = function (uid, callback) {
    //var j = request.jar();
    //var cookie = request.cookie('key1=value1');
    var url = "https://www.facebook.com/100000211592969";
    //j.setCookie(cookie, url);

    request({
        url: url,
        method: "GET",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36'
        }
    }, function (error, response, html) {
        console.log("OK");
        //Checking for errors
        if (!error) {

            console.log("PATH: " + response.req.path);
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
            //var $ = cheerio.load(html);
            //
            //// Variables we're going to capture
            //var $code = $('#code');
            //
            ////Extract the id
            //var id = $code.text();
            //
            ////If id available
            //if(id){
            //    console.log(chalk.yellow("ID Found: " + id));
            //    res.json({"app_id": req.params.id, "user_id": $code.text()});
            //}else{
            //    console.log(chalk.red("ID Not Found"));
            //    res.json({"app_id": req.params.id, "user_id": "Not Found"});
            //}

            callback(null, response.req.path);
        } else {
            console.log(chalk.red('Error occured: ' + error));
            callback(error, null);
        }
        //res.json({path: response.req.path});
    });

};