/**
 * Search result count component functionality
 * @module searchResultsCount
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with search result count component
*/
XA.component.search.results.count = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchResultsCount
    */
    var api = {}, initialized = false;
    /**
    * @name module:searchResultsCount.SearchResultCountView
    * @constructor
    * @augments Backbone.View
    */
    var SearchResultCountView = Backbone.View.extend(
        /** @lends module:searchResultsCount.SearchResultCountView.prototype **/
        {
            /**
            * Initially shows fake data for creative exchange mode
            * and watches events on which
            * view should be updated in all modes
            * @listens module:XA.component.search.vent~event:results-loaded
            * @memberof module:searchResultsCount.SearchResultCountView
            */
            initialize: function () {
                var dataProperties = this.$el.data(),
                    resultsCountContainer = this.$el.find(".results-count"),
                    inst = this;

                this.resultsCountText = resultsCountContainer.html();

                //check if page is opened from disc - if yes then we are in Creative Exchange mode so let's show fake results count
                if (window.location.href.startsWith("file://")) {
                    resultsCountContainer.html(inst.resultsCountText.replace('{count}', 1));
                    inst.$el.find(".results-count").show();
                    return;
                }

                XA.component.search.vent.on("results-loaded", function (data) {
                    if (inst.$el.find(".results-count").length > 0) {
                        var signature = inst.$el.data("properties").targetSignature;
                        if (signature != "" && signature != data.searchResultsSignature) {
                            return;
                        }
                        resultsCountContainer.html(inst.resultsCountText.replace('{count}', data.dataCount));
                        inst.$el.find(".results-count").show();
                    }
                });
            }
        });

    /**
    * For each search managed range component on a page creates instance of 
    * ["SearchResultCountView"]{@link module:searchResultsCount.SearchResultCountView} 
    * @memberOf module:searchResultsCount
    * @alias module:searchResultsCount.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        var searchResults = $(".search-results-count");
        _.each(searchResults, function (elem) {
            var searchResultsCountView = new SearchResultCountView({ el: $(elem) });
        });

        initialized = true;
    };

    return api;

}(jQuery, document));

XA.register('searchResultsCount', XA.component.search.results.count);