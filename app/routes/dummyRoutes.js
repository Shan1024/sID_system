module.exports = function (app, express) {

    var baseRouter = express.Router();

    /*DUMMY FUNCTION TO GET RATING SPECIFIC TO A CLAIM*/
    baseRouter.route('/claimRating')
        .post(function (req, res) {
            console.log("get Rating api call received by DUMMY METHOD");
            console.log(req.body.sender);
            console.log(req.body.target);
            console.log(req.body.cClass);
            console.log(req.body.claimId);
            res.status(200).json({
                positive: 123,
                negative: 12,
                uncertain: 27
            });
        });

    /*DUMMY FUNCTION TO GET OVERALL RATING of a profile*/
    baseRouter.route('/claimScore')
        .post(function (req, res) {
            console.log("get claim score called");
            console.log(req.body.targetUser);
            console.log(req.body.claimID);

            var targetUser = req.body.targetUser;
            var claimID = req.body.claimID;

            var score;

            hash = targetUser % claimID;

            var hash = hash % 3;
            if (hash === 1) {
                score = "T"; //True		Green
            } else if (hash === 2) {
                score = "R"; //Reject	Red
            } else {
                score = "C"; //Uncertain Yellow
            }

            res.status(200).json({
                rating: score
            });
        });

    /*DUMMY FUNCTION TO GET OVERALL RATING of a profile*/
    baseRouter.route('/profRating')
        .post(function (req, res) {
            console.log("get overall Rating api call received by DUMMY METHOD");
            console.log(req.body.targetUser);
            var targetUser = req.body.targetUser;
            var rate;

            targetUser = targetUser % 3;
            if (targetUser === 1) {
                rate = "T"; //True		Green
            } else if (targetUser === 2) {
                rate = "R"; //Reject	Red
            } else {
                rate = "C"; //Uncertain Yellow
            }
            res.status(200).json({
                rating: rate
            });
        });

    app.use('/', baseRouter);

};
