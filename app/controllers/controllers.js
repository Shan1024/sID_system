/**
 * Created by Shan on 11/4/2015.
 */
var chalk = require('chalk');
var jwt = require('jsonwebtoken');
var nodemailer = require("nodemailer");

var config = require('../../config/config');

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

        console.log("Host: "+host);

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
