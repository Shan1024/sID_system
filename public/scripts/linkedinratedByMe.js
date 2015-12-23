/**
 * Created by Shan on 11/10/2015.
 */
$(function () {

    var $contentArea = $('.contentArea');

    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "/rate/linkedin/getAllRatingsByUser",
        "method": "POST",
        "headers": {
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded"
        },
        "data": {
            "limit": "10",
            "order": "-1"
        }
    }

    $.ajax(settings).done(function (response) {
        console.log(response);

        console.log("response.data.length: " + response.data.length);

        for (var i = 0; i < response.data.length; i++) {

            console.log("response.data[i].entries.length: " + response.data[i].entries.length);

            console.log("Entry[0]: " + JSON.stringify(response.data[i].entries[0], null, "\t"));



            for (var j = 0; j < response.data[i].entries.length; j++) {

                console.log(response.data[i].entries[j].claim);

                var type;

                if(response.data[i].entries[j].rating==1){
                    type ="alert alert-success";
                }else   if(response.data[i].entries[j].rating==-1){
                    type ="alert alert-danger";
                }else{
                    type ="alert alert-warning";
                }

                $contentArea.append('<div class=\"row\"><div class=\"'+type+'\" > User: '+'<a href="https://www.linkedin.com/profile/view?id='+response.data[i].entries[j].targetid.uid+'">'+response.data[i].entries[j].targetid.name+'</a>'+' Claim: ' + response.data[i].entries[j].claim +' , Rating: ' + response.data[i].entries[j].rating + ' , Time: ' + response.data[i].entries[j].lastUpdated + '</div></div></div>');
            }
        }
    });

    //var $ratings = $('.ratings');
    //var uid = $ratings.attr('data-id');
    ////$ratings.append('Hello');
    //console.log("uid: " + uid);
    //
    ////var template = "<div class=\"row\">" +
    ////    "<div class=\"well\">" +
    ////    "Data: " + data + " , Yes: " + trusted + " , Not Sure: " + notSure + " , No: " + no +
    ////    "</div></div>";
    ////'<div class=\"row\"><div class=\"well\"> ClaimID: ' + value.claimid + ' , Data: ' + value.data + ' , Yes: ' + response.trusted + ' , Not Sure: ' + response.notSure + ' , No: ' + response.no + '</div></div></div>'
    //if (uid) {
    //    $.ajax({
    //        "async": true,
    //        "crossDomain": true,
    //        "url": "/test/myAllRatedClaims",
    //        "method": "POST",
    //        "data": {
    //            "uid": uid
    //        }
    //    }).done(function (response) {
    //        console.log(response);
    //
    //        $.each(response, function (i, value) {
    //
    //            $.ajax({
    //                "async": true,
    //                "crossDomain": true,
    //                "url": "/test/ratedByOthersCounts",
    //                "method": "POST",
    //                "data": {
    //                    "uid": uid,
    //                    "claimid": value.claimid
    //                }
    //            }).done(function (response) {
    //                console.log(JSON.stringify(response, null, "\t"));
    //                //$ratings.append(Mustache.render(template,response));
    //                $ratings.append('<div class=\"row\"><div class=\"well\"> ClaimID: ' + value.claimid + ' , Data: ' + value.data + ' , Yes: ' + response.trusted + ' , Not Sure: ' + response.notSure + ' , No: ' + response.no + '</div></div></div>');
    //            });
    //
    //        });
    //    });
    //}
});
