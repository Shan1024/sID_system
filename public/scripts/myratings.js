/**
 * Created by Shan on 11/10/2015.
 */
$(function () {
    var $ratings = $('.ratings');
    var uid = $ratings.attr('data-id');
    //$ratings.append('Hello');
    console.log("uid: " + uid);

    if (uid) {
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": "/test/myAllRatedClaims",
            "method": "POST",
            "data": {
                "uid": uid
            }
        }).done(function (response) {
            console.log(response);

            $.each(response, function (i, value) {

                $.ajax({
                    "async": true,
                    "crossDomain": true,
                    "url": "/test/ratedByOthersCounts",
                    "method": "POST",
                    "data": {
                        "uid": uid,
                        "claimid": value.claimid
                    }
                }).done(function (response) {
                    console.log(JSON.stringify(response, null, "\t"));
                    $ratings.append('<div class=\"row\"><div class=\"well\"> ClaimID: ' + value.claimid + ' , Data: ' + value.data + ' , Yes: ' + response.yes + ' , Not Sure: ' + response.notSure + ' , No: ' + response.no + '</div></div></div>');
                });

            });
        });
    }
});
