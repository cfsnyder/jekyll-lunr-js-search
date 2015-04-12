(function($) {

  var debounce = function(fn) {
    var timeout;
    var slice = Array.prototype.slice;

    return function() {
      var args = slice.call(arguments),
          ctx = this;

      clearTimeout(timeout);

      timeout = setTimeout(function () {
        fn.apply(ctx, args);
      }, 100);
    };
  };
  
  // parse a date in yyyy-mm-dd format
  var parseDate = function(input) {
    var parts = input.match(/(\d+)/g);
    return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
  };
  
  var LunrSearch = (function() {
    function LunrSearch(elem, options) {
      this.$elem = elem;      
      this.results = [];
      this.indexDataUrl = options.indexUrl;
      this.initialize();
    }
        
    LunrSearch.prototype.initialize = function() {
      var self = this;
      this.loadIndexData(function(data) {
        self.entries = $.map(data.docs, self.createEntry);
        self.index = lunr.Index.load(data.index);
        self.populateSearchFromQuery();
        self.bindKeypress();
      });
    };
    
    // load the search index data
    LunrSearch.prototype.loadIndexData = function(callback) {
      $.getJSON(this.indexDataUrl, callback);
    };

    LunrSearch.prototype.createEntry = function(raw, index) {
      var entry = $.extend({
        id: index + 1
      }, raw);
      
      // include pub date for posts
      if (raw.date) {
        $.extend(entry, {
          date: parseDate(raw.date),
          pubdate: function() {
            // HTML5 pubdate
            return dateFormat(parseDate(raw.date), 'yyyy-mm-dd');
          },
          displaydate: function() {
            // only for posts (e.g. Oct 12, 2012)
            return dateFormat(parseDate(raw.date), 'mmm dd, yyyy');
          }
        });
      }
      
      return entry;
    };
    
    LunrSearch.prototype.bindKeypress = function() {
      var self = this;
      var oldValue = this.$elem.val();
      this.$elem.bind('keyup', debounce(function() {
        var newValue = self.$elem.val();
        if (newValue !== oldValue) {
          self.search(newValue);
        }
        oldValue = newValue;
      }));
    };
    
    LunrSearch.prototype.search = function(query) {
      var entries = this.entries;
      if (query.length >= 3) {
        this.results = $.map(this.index.search(query), function(result) {
          return $.grep(entries, function(entry) { return entry.id === parseInt(result.ref, 10); })[0];
        });
      }
    };
    
    // Populate the search input with 'q' querystring parameter if set
    LunrSearch.prototype.populateSearchFromQuery = function() {
      var uri = new URI(window.location.search.toString());
      var queryString = uri.search(true);
      if (queryString.hasOwnProperty('q')) {
        this.$elem.val(queryString.q);
        this.search(queryString.q.toString());
      }
    };
    
    return LunrSearch;
  })();

  $.fn.lunrSearch = function(options) {
    // apply default options
    options = $.extend({}, $.fn.lunrSearch.defaults, options);      

    // create search object
    return new LunrSearch(this, options);
  };
  
  $.fn.lunrSearch.defaults = {
    indexUrl  : '/js/index.json',   // Url for the .json file containing search index data
  };
})(jQuery);
