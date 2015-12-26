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
      return $.map(x.values, function(item){
        return {value: item.name};
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
      return $.map(x.values, function(item){
        return {value: item.name};
      });
    },
    wildcard: "%QUERY"
  }
});

$('#sidusersearch').typeahead({
  highlight: true
}, {
  name: 'facebook-suggestions',
  display: 'value',
  source: facebookSuggestions,
  templates: {
    header: '<h3 class="facebook-name">Facebook</h3>'
  }
},{
  name: 'linkedin-suggestions',
  display: 'value',
  source: linkedinSuggestions,
  templates: {
    header: '<h3 class="linkedin-name">LinkedIn</h3>'
  }
});
