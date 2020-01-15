/**
 * Search result component functionality
 * @module searchResults
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with component search result
*/
XA.component.search.results = (function ($, document) {

    "use strict";
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchResults
    */
    var api = {},
        searchResultViews = [],
        searchResultModels = [],
        urlHelperModel,
        queryModel,
        apiModel,
        initialized = false;
    /**
    * @name module:searchResults.SearchResultModel
    * @constructor
    * @augments Backbone.Model
    */
    var SearchResultModel = Backbone.Model.extend(
        /** @lends module:searchResults.SearchResultModel.prototype **/
        {
            defaults: {
                template: "<% if(!results.length){ %><div class='no-results'><%= noResultsText %></div> <% }else { %>" +
                    "<ul class='search-result-list'> " +
                    "<% _.forEach(results, function(result){ %>" +
                    "<li " + "<% if(result.Geospatial){%>data-id='<%= result.Id %>' data-longitude='<%= result.Geospatial.Longitude %>' data-latitude='<%= result.Geospatial.Latitude %>'<% } %>" + "><%= result.Html %></li>" +
                    "<% }); %>" +
                    "</ul>" +
                    "<% } %>" +
                    "<div class='search-result-overlay'>",
                templateItems: "<% _.forEach(results, function(result){ %>" +
                    "<li " + "<% if(result.Geospatial){%>data-id='<%= result.Id %>' data-longitude='<%= result.Geospatial.Longitude %>' data-latitude='<%= result.Geospatial.Latitude %>'<% } %>" + "><%= result.Html %></li>" +
                    "<% }); %>",
                dataProperties: {},
                blockNextRequest: false,
                noResultsText: "",
                resultData: {},
                loadingInProgress: false,
                loadingMoreInProgress: false,
                resultDataMore: {},
                loadMoreOffset: 0,
                loadMore: false
            },
            /**
             * Listens for changes on data from server
            * @listens module:XA.component.search.vent~event:facet-data-loaded
            * @listens module:XA.component.search.vent~event:results-loading
            */
            initialize: function () {
                var hashObj = queryModel.parseHashParameters(window.location.hash),
                    signature = encodeURIComponent(this.get("dataProperties").sig),
                    offsetKey = "e_" + signature;

                //If there is "e" in hash object, then one of page selectors on the page is global (not assigned to any of the
                //search results - in such case it will paginate all search results without signature
                if (hashObj.hasOwnProperty("e") && signature === '') {
                    this.set("loadMoreOffset", parseInt(hashObj.e));
                }

                //checks if there is page selector assigned to this specific search results
                if (hashObj.hasOwnProperty(offsetKey)) {
                    this.set("loadMoreOffset", parseInt(hashObj[offsetKey]));
                }

                XA.component.search.vent.on("results-loaded", this.resultsLoaded.bind(this));
                XA.component.search.vent.on('results-loading', this.resultsLoading.bind(this));
            },
            /**
             * Sets value of blockNextRequest variable
             * @param {String} value new value of blockNextRequest variable
             * @memberof module:searchResults.SearchResultModel
             * @alias module:searchResults.SearchResultModel#blockRequests
             */
            blockRequests: function (value) {
                this.set("blockNextRequest", value);
            },
            /**
            * Returns value of blockNextRequest variable
            * @memberof module:searchResults.SearchResultModel
            * @alias module:searchResults.SearchResultModel#checkBlockingRequest
            * @returns {String} value of blockNextRequest variable
            */
            checkBlockingRequest: function () {
                return this.get("blockNextRequest");
            },
            /**
            * Returns value of component offset from hash parameters
            * @memberof module:searchResults.SearchResultModel
            * @alias module:searchResults.SearchResultModel#getMyOffset
            * @returns {String|0} value of offset
            */
            getMyOffset: function () {
                var hash = queryModel.parseHashParameters(window.location.hash),
                    signature = encodeURIComponent(this.get("dataProperties").sig);
                if (hash.hasOwnProperty("e_" + signature)) {
                    return hash["e_" + signature];
                }
                return 0;
            },
            /**
            * Updates model with new data from resultData parameter
            * @param {Object} resultsData new component data
            * @memberof module:searchResults.SearchResultModel
            * @alias module:searchResults.SearchResultModel#resultsLoaded
            */
            resultsLoaded: function (resultsData) {
                var signature = encodeURIComponent(this.get("dataProperties").sig);

                if (signature === resultsData.searchResultsSignature) {
                    if (this.get("loadMore")) {
                        this.set({ resultDataMore: resultsData });
                        this.set({ loadingMoreInProgress: false });
                        this.unset("loadMore", { silent: true });
                    } else {
                        this.set({ resultData: resultsData });
                        this.set({ loadingInProgress: false });
                    }
                    this.blockRequests(false);
                }
            },
            /**
            * Manages loadingMoreInProgress model variable
            * @param {Object} cid component id
            * @memberof module:searchResults.SearchResultModel
            * @alias module:searchResults.SearchResultModel#resultsLoading
            */
            resultsLoading: function (cid) {
                if (this.cid == cid) {
                    if (this.get("loadMore")) {
                        this.set({ loadingMoreInProgress: true });
                    } else {
                        this.set({ loadingInProgress: true });
                    }
                }
            }
        });
    /**
    * @name module:searchResults.SearchResultView
    * @constructor
    * @augments Backbone.View
    */
    var SearchResultView = Backbone.View.extend(
        /** @lends module:searchResults.SearchResultView.prototype **/
        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:searchResults.SearchResultModel~event:change:loadingInProgress
            * @listens module:searchResults.SearchResultModel~event:change:loadingMoreInProgress
            * @listens module:searchResults.SearchResultModel~event:change:resultData
            * @listens module:searchResults.SearchResultModel~event:change:resultDataMore
            * @listens module:XA.component.search.vent~event:add-variant-class
            * @listens module:XA.component.search.vent~event:loadMore
            * @listens module:XA.component.search.vent~event:my-location-coordinates-changed
            * @memberof module:searchResults.SearchResultView
            * @alias module:searchResults.SearchResultView#initialize
            */
            initialize: function () {
                var dataProperties = this.$el.data(),
                    noResultsText = this.$el.find(".no-results").html(),
                    maxHeight = 0,
                    inst = this;

                if (dataProperties.properties.sig === null) {
                    dataProperties.properties.sig = "";
                }

                if (this.model) {
                    this.model.set({ dataProperties: dataProperties.properties, noResultsText: noResultsText });
                }

                this.model.on("change:loadingInProgress", this.loading, this);
                this.model.on("change:loadingMoreInProgress", this.loadingMore, this);
                this.model.on("change:resultData", this.render, this);
                this.model.on("change:resultDataMore", this.renderPart, this);

                XA.component.search.vent.on("add-variant-class", function (data) {
                    var signature = inst.model.get("dataProperties").sig;
                    if (data.sig === signature) {
                        inst.$el.removeClass(inst.$el.attr("data-class-variant"));
                        inst.$el.attr("data-class-variant", data.classes);
                        inst.$el.addClass(data.classes);
                    }
                });

                XA.component.search.vent.on("loadMore", function (data) {
                    var signature = inst.model.get("dataProperties").sig;
                    if (data.sig === signature) {
                        XA.component.search.service.getData({
                            loadMore: "true",
                            p: inst.model.get("dataProperties").p,
                            singleRequestMode: signature
                        });
                    }
                });

                XA.component.search.vent.on("my-location-coordinates-changed", function (data) {
                    if (data.sig === inst.model.get("dataProperties").sig && inst.model.get("loadMore")) {
                        inst.$el.find(".search-result-list").html("");
                    }
                });

                this.render();
            },
            /**
            * list of events for Backbone View
            * @memberof module:searchResults.SearchResultView
            * @alias module:searchResults.SearchResultView#events
            */
            events: {
                'click .search-result-list > li[data-longitude][data-latitude]': "poiClick"
            },
            /**
             * Manage 'loading-in-progress' css class
            * @memberof module:searchResults.SearchResultView
            * @alias module:searchResults.SearchResultView#loading
            */
            loading: function () {
                if (this.model.get("loadingInProgress")) {
                    this.$el.addClass("loading-in-progress");
                } else {
                    this.$el.removeClass("loading-in-progress");
                }
            },
            /**
             * Manage 'loading-more-in-progress' css class
            * @memberof module:searchResults.SearchResultView
            * @alias module:searchResults.SearchResultView#loadingMore
            */
            loadingMore: function () {
                if (this.model.get("loadingMoreInProgress")) {
                    this.$el.addClass("loading-more-in-progress");
                } else {
                    this.$el.removeClass("loading-more-in-progress");
                }
            },
            /**
            * Renders search result list
            * @memberof module:searchResults.SearchResultView
            * @alias module:searchResults.SearchResultView#renderPart
            */
            renderPart: function () {
                var template = _.template(this.model.get("templateItems"));
                var templateResult = template({ results: this.model.get("resultDataMore").data });
                this.$el.find(".search-result-list").append(templateResult);
            },
            /**
             * Renders view
             * @memberof module:searchResults.SearchResultView
             * @alias module:searchResults.SearchResultView#render
             */
            render: function () {
                var inst = this,
                    maxHeight = 0,
                    results = inst.model.get("resultData").data;

                //checks if page is opened from disc - if yes then we are in Creative Exchange mode
                if (window.location.href.startsWith("file://")) {
                    return;
                }

                if (typeof results === "undefined") {
                    results = [];
                }

                var template = _.template(inst.model.get("template"));
                var templateResult = template({ results: results, noResultsText: inst.model.get("noResultsText") });
                this.$el.html(templateResult);
            },
            /**
             * Renders view
             * @param {Event} e Event object that contains target poi elment
             * @fires XA.component.search.vent#center-map
             * @memberof module:searchResults.SearchResultView
             * @alias module:searchResults.SearchResultView#poiClick
             */
            poiClick: function (e) {
                var li = $(e.currentTarget);

                XA.component.search.vent.trigger("center-map", {
                    sig: this.model.get("dataProperties").sig,
                    coordinates: [li.data('latitude'), li.data('longitude')],
                    id: li.data('id')
                });
            }
        });
    /**
    * For each search result component on a page creates instance of 
    * ["SearchResultModel"]{@link module:searchResults.SearchResultModel} and 
    * ["SearchResultView"]{@link module:searchResults.SearchResultView} 
    * @memberOf module:searchResults
    * @alias module:searchResults.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        urlHelperModel = XA.component.search.url;
        queryModel = XA.component.search.query;
        apiModel = XA.component.search.ajax;

        var searchResults = $(".search-results");
        _.each(searchResults, function (elem) {
            var resultsModel = new SearchResultModel();
            searchResultModels.push(resultsModel);
            searchResultViews.push(new SearchResultView({ el: $(elem), model: resultsModel }));
        });

        initialized = true;
    };
    /**
       *Extends API methods with searchResultModels
       * @alias module:searchResults.searchResultViews
       */
    api.searchResultViews = searchResultViews;
    /**
   * Extends API methods with searchResultModels
   * @memberOf module:searchResults
   * @alias module:searchResults.searchResultModels
   */
    api.searchResultModels = searchResultModels;

    return api;

}(jQuery, document));

XA.register('searchResults', XA.component.search.results);