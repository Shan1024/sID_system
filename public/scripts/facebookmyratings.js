/**
 * Created by Shan on 11/10/2015.
 */
$(function () {

    var $contentArea = $('.contentArea');

    var template = "<div class=\"myChart well row\">" +
        "<div class=\"col-xs-6 text\"></div>" +
        "<div class=\"col-xs-6\"><canvas class=\"canvas\" width=\"100\" height=\"100\"></canvas></div>" +
        "</div>";


    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "/rate/facebook/getAllRatedClaims",
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

        //for (var i = 0; i < response.data.length; i++) {
        //    $contentArea.append('<div class=\"row\"><div class=\"well\">  Claim: ' + response.data[i].claim + ' , Yes: ' + response.data[i].yes + ' , Not Sure: ' + response.data[i].notSure + ' , No: ' + response.data[i].no + '</div></div></div>');
        //}

        if (response) {


            for (var i = 0; i < response.data.length; i++) {
                $contentArea.append(template);
            }

            var charts = document.getElementsByClassName("myChart");
            console.log("Length: " + charts.length);

            for (i = 0; i < charts.length; i++) {

                var temp = charts[i].getElementsByClassName("text")[0];
                console.log(temp);
                temp.innerHTML = temp.innerHTML + response.data[i].claim;
                var canvas = charts[i].getElementsByClassName("canvas")[0];

                console.log(canvas);

                var ctx = canvas.getContext("2d");

                var myNewChart = new Chart(ctx).Pie([
                    {
                        value: response.data[i].yes,
                        color: "#46bf7d",//33cc33
                        highlight: "#5ad391",//85e085
                        label: "Yes"
                    },
                    {
                        value: response.data[i].notSure,
                        color: "#fdb45c",//ffff00
                        highlight: "#ffc870",//ffff66
                        label: "No Sure"
                    },
                    {
                        value: response.data[i].no,
                        color: "#f7464a",//ff0000
                        highlight: "#ff5a5e",//ff6666
                        label: "No"
                    }
                ], {
                    animationEasing: "easeInQuart"
                });
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
