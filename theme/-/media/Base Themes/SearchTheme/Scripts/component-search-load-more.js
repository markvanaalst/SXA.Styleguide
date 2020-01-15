/**
 * Loads more component functionality
 * @module searchLoadMore
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with load more component
*/
XA.component.search.loadMore = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchFacetRangeSlider
    */
    var api = {},
        initialized = false,
        SearchLoadMoreModel,
        SearchLoadMoreView;
    /**
    * @name module:searchLoadMore.SearchLoadMoreModel
    * @constructor
    * @augments Backbone.Model
    */
    SearchLoadMoreModel = Backbone.Model.extend(
        /** @lends module:searchLoadMore.SearchLoadMoreModel.prototype **/

        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                dataProperties: {},
                sig: []
            }
        });
    /**
    * @name module:searchLoadMore.SearchLoadMoreView
    * @constructor
    * @augments Backbone.View
    */
    SearchLoadMoreView = Backbone.View.extend(
        /** @lends module:searchLoadMore.SearchLoadMoreView.prototype **/
        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:XA.component.search.vent~event:results-loaded
            * @memberof module:searchLoadMore.SearchLoadMoreView
            */
            initialize: function () {
                var dataProperties = this.$el.data(),
                    that = this;

                if (dataProperties.properties.searchResultsSignature === null) {
                    dataProperties.properties.searchResultsSignature = "";
                }

                if (this.model) {
                    this.model.set('sig', dataProperties.properties.searchResultsSignature.split(','));
                }

                XA.component.search.vent.on("results-loaded", function (results) {
                    var sig = that.model.get('sig'),
                        i;

                    for (i = 0; i < sig.length; i++) {
                        if (results.pageSize >= results.dataCount) //when results.offset and/or results.searchResultsSignature are undefined
                        {
                            that.$el.hide();
                        } else {
                            if (sig[i] === results.searchResultsSignature)
                                if (results.offset + results.pageSize >= results.dataCount) {
                                    that.$el.hide();
                                } else {
                                    that.$el.show();
                                }
                        }
                    }
                });
            },
            /**
            * list of events for Backbone View
            * @memberof module:searchLoadMore.SearchLoadMoreView
            * @alias module:searchLoadMore.SearchLoadMoreView#events
            */
            events: {
                'mousedown input': 'loadMore'
            },
            /**
           * Load more search results
           * @fires  XA.component.search.vent~event:loadMore
           * @listens module:XA.component.search.vent~event:results-loaded
           * @memberof module:searchLoadMore.SearchLoadMoreView 
           * @alias module:searchLoadMore.SearchLoadMoreView#loadMore 
           */
            loadMore: function () {
                var sig = this.model.get('sig'),
                    i;

                for (i = 0; i < sig.length; i++) {
                    XA.component.search.vent.trigger('loadMore', {
                        sig: sig[i]
                    });
                }
            }
        });
    /**
    * For each search facet range slider component on a page creates instance of 
    * ["SearchLoadMoreModel"]{@link module:searchLoadMore.SearchLoadMoreModel} and 
    * ["SearchLoadMoreView"]{@link module:searchLoadMore.SearchLoadMoreView} 
    * @memberOf module:searchLoadMore
    * @alias module:searchLoadMore.init
    */
    api.init = function () {
        if ($('body').hasClass('on-page-editor') || initialized) {
            return;
        }

        var searchLoadMore = $('.load-more');
        _.each(searchLoadMore, function (elem) {
            new SearchLoadMoreView({ el: $(elem), model: new SearchLoadMoreModel() });
        });

        initialized = true;
    };

    return api;

}(jQuery, document));

XA.register('searchLoadMore', XA.component.search.loadMore);
