/**
 * Created by Shan on 11/2/2015.
 */




$(function () {
    console.log("Hello World");

    //var $url = $('#url');
    //var id = $url.attr('data-id');
    //
    //console.log("id: " + id);
    //
    //
    //
    //$.ajax ({
    //    type: 'GET',
    //    url: "https://www.facebook.com",
    //    //'https://www.facebook.com/'+id,
    //    success: function(page){
    //        console.log('success', page);
    //        //$.each(page, function(i, s){
    //        //
    //        //});
    //    },
    //    error: function(){
    //        alert('Error loading data');
    //    }
    //});





    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://www.facebook.com/",
        "method": "GET",
        "headers": {
            "cache-control": "no-cache",
            "postman-token": "ca2235ac-4f84-517c-0128-859bcaeb97bb"
        }
    }

    $.ajax(settings).done(function (response) {
        console.log(response);
    });











    //var url = 'https://www.facebook.com/'+id;

    //$.ajax({
    //    type: 'GET',
    //    url: url,
    //    async: false,
    //    jsonpCallback: 'jsonCallback',
    //    contentType: "application/json",
    //    dataType: 'jsonp',
    //    success: function(json) {
    //        console.dir(json.sites);
    //    },
    //    error: function(e) {
    //        console.log(e.message);
    //    }
    //});

    //$.ajax({
    //    url: url,
    //    dataType: 'jsonp',
    //    success: function(dataWeGotViaJsonp){
    //        console.log(dataWeGotViaJsonp)
    //        //var text = '';
    //        //var len = dataWeGotViaJsonp.length;
    //        //for(var i=0;i<len;i++){
    //        //    twitterEntry = dataWeGotViaJsonp[i];
    //        //    text += '<p><img src = "' + twitterEntry.user.profile_image_url_https +'"/>' + twitterEntry['text'] + '</p>'
    //        //}
    //        //$('#twitterFeed').html(text);
    //    }
    //});


    //$.get("localhost:8080/?url=www.google.com", function(response) {
    //    alert(response)
    //});

//    $.ajax({
//
//        // The 'type' property sets the HTTP method.
//        // A value of 'PUT' or 'DELETE' will trigger a preflight request.
//        type: 'GET',
//
//        // The URL to make the request to.
//        url: 'https://www.google.com',
//
//        // The 'contentType' property sets the 'Content-Type' header.
//        // The JQuery default for this property is
//        // 'application/x-www-form-urlencoded; charset=UTF-8', which does not trigger
//        // a preflight. If you set this value to anything other than
//        // application/x-www-form-urlencoded, multipart/form-data, or text/plain,
//        // you will trigger a preflight request.
//        contentType: 'text/plain',
//
//        xhrFields: {
//            // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
//            // This can be used to set the 'withCredentials' property.
//            // Set the value to 'true' if you'd like to pass cookies to the server.
//            // If this is enabled, your server must respond with the header
//            // 'Access-Control-Allow-Credentials: true'.
//            withCredentials: false
//        },
//
//        headers: {
//            // Set any custom headers here.
//            // If you set any non-simple headers, your server must include these
//            // headers in the 'Access-Control-Allow-Headers' response header.
//        },
//
//        success: function() {
//            // Here's where you handle a successful response.
//            console.log("OK");
//        },
//
//        error: function() {
//            // Here's where you handle an error response.
//            // Note that if the error was due to a CORS issue,
//            // this function will still fire, but there won't be any additional
//            // information about the error.
//            console.log("error");
//        }
//    });
//
});



//// Create the XHR object.
//function createCORSRequest(method, url) {
//    var xhr = new XMLHttpRequest();
//    if ("withCredentials" in xhr) {
//        // XHR for Chrome/Firefox/Opera/Safari.
//        xhr.open(method, url, true);
//    } else if (typeof XDomainRequest != "undefined") {
//        // XDomainRequest for IE.
//        xhr = new XDomainRequest();
//        xhr.open(method, url);
//    } else {
//        // CORS not supported.
//        xhr = null;
//    }
//    return xhr;
//}
//
//// Helper method to parse the title tag from the response.
//function getTitle(text) {
//    return text.match('<title>(.*)?</title>')[1];
//}
//
//// Make the actual CORS request.
//function makeCorsRequest() {
//    // All HTML5 Rocks properties support CORS.
//    var url = 'https://www.facebook.com';
//
//    var xhr = createCORSRequest('GET', url);
//    if (!xhr) {
//        alert('CORS not supported');
//        return;
//    }
//
//    // Response handlers.
//    xhr.onload = function() {
//        var text = xhr.responseText;
//        var title = getTitle(text);
//        alert('Response from CORS request to ' + url + ': ' + title);
//    };
//
//    xhr.onerror = function() {
//        alert('Woops, there was an error making the request.');
//    };
//
//    xhr.send();
//}
//
//var url = 'https://www.google.com';
//var xhr = createCORSRequest('GET', url);
//xhr.send();