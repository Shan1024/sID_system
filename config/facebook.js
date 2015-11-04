var https = require('https');
var User = require('../app/models/user');

exports.getFbData = function (req, apiPath, callback) {

    User.findById(req.user._id)
        .populate('userDetails.facebook')
        //.populate('userDetails.linkedin')
        //.populate('facebook.ratedByMe')
        .exec(function (error, user) {
            console.log(JSON.stringify(user, null, "\t"));

            if (user.userDetails.facebook) {
                var accessToken = user.userDetails.facebook.token;

                var options = {
                    host: 'graph.facebook.com',
                    port: 443,
                    path: apiPath + '?access_token=' + accessToken, //apiPath example: '/me/friends'
                    method: 'GET'
                };

                var buffer = ''; //this buffer will be populated with the chunks of the data received from facebook
                var request = https.get(options, function (result) {
                    result.setEncoding('utf8');
                    result.on('data', function (chunk) {
                        buffer += chunk;
                    });

                    result.on('end', function () {
                        callback(buffer);
                    });
                });

                request.on('error', function (e) {
                    console.log('error from facebook.getFbData: ' + e.message)
                });
                request.end();
            }
            //res.render('partials/profile', {user: user});
        });
}
