var storedId;
var storedName;

var facebookSuggestions = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    // prefetch: '/pre.json',
    // remote: {
    //   // url: '../data/films/queries/%QUERY.json',
    //   url: 'http://localhost:8080/other/getSuggestions?text=%QUERY',
    //   wildcard: '%QUERY'
    // }
    remote: {
        url: "/other/getSuggestionsFacebook?text=%QUERY",
        filter: function (x) {
            return $.map(x.values, function (item) {
                return {value: item.name, id: item.user, fbid: item.id};
            });
        },
        wildcard: "%QUERY"
    }
});

var linkedinSuggestions = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    // prefetch: '/pre.json',
    // remote: {
    //   // url: '../data/films/queries/%QUERY.json',
    //   url: 'http://localhost:8080/other/getSuggestions?text=%QUERY',
    //   wildcard: '%QUERY'
    // }
    remote: {
        url: "/other/getSuggestionsLinkedIn?text=%QUERY",
        filter: function (x) {
            return $.map(x.values, function (item) {
                return {value: item.name, id: item.user, photoUrl: item.photo};
            });
        },
        wildcard: "%QUERY"
    }
});

var typeahead = $('#sidusersearch');

typeahead.typeahead({
    highlight: true
}, {
    name: 'facebook-suggestions',
    display: 'value',
    source: facebookSuggestions,
    templates: {
        header: '<h3 class="facebook-name">Facebook</h3>',
        // // suggestion: Handlebars.compile('{{value}}')
        // suggestion: '<% value %> <img src="https://graph.facebook.com/v2.3/<% fbid %>/picture"/>'
        suggestion: Handlebars.compile('<div><strong>{{value}}</strong> – <img class="typeahead_photo" src="https://graph.facebook.com/v2.3/{{fbid}}/picture"/></div>')
    }
}, {
    name: 'linkedin-suggestions',
    display: 'value',
    source: linkedinSuggestions,
    templates: {
        header: '<h3 class="linkedin-name">LinkedIn</h3>',
        suggestion: Handlebars.compile('<div><strong>{{value}}</strong> – <img class="typeahead_photo" src="{{photoUrl}}" height="50" width="50"/></div>')
    }
});

var idSelectedHandler = function (eventObject, suggestionObject, suggestionDataset) {
    // alert(suggestionObject.id);
    storedId = suggestionObject.id;
    $("#sidusersearchform").submit();
};

typeahead.on('typeahead:selected', idSelectedHandler);

$("#sidusersearchform").submit(function (eventObj) {
    $('<input />').attr('type', 'hidden')
        .attr('name', "id")
        .attr('value', storedId)
        .appendTo('#sidusersearchform');
    return true;
});
