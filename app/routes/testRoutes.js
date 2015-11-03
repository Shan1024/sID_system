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

            var username = req.body.username;
            var password = req.body.password;

            var user = new User({
                userDetails: {
                    local: {
                        username: username,
                        password: password,
                        verified: false
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

    app.use('/test', testRouter);
};
