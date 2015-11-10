module.exports = function (app, express) {

    /*DUMMY FUNCTION TO GET RATING SPECIFIC TO A CLAIM*/
    app.post('/claimRating', function (req, res) {
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
    app.post('/claimScore', function (req, res) {
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
    app.post('/profRating', function (req, res) {
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

	/*DUMMY FUNCTION TO recieve a claim rating*/
    app.post('/rateClaim', function (req, res) {
        console.log("add new rating to a claim");
        console.log(req.body.claimId + " " + req.body.targetId +" " + req.body.myId);
        var claimId = req.body.claimId;
		var targetId = req.body.targetId;
		var myId = req.body.myId;
		
		/*do something*/
		
        var reply = claimId+ " "+targetId+ " "+myId;

        res.status(200).json({
            rate: reply
        });
    });

};
