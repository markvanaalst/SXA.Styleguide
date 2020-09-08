/**
 * Page size component functionality
 * @module searchPageSize
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with component page size
*/
XA.component.search.pageSize = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchPageSize
    */
    var api = {},
        queryModel,
        queryParameters,
        searchResultModels,
        initialized = false,
        facetName = "p";
    /**
    * @name module:searchPageSize.SearchPageSizeModel
    * @constructor
    * @augments Backbone.Model
    */
    var SearchPageSizeModel = Backbone.Model.extend(
        /** @lends module:searchPageSize.SearchPageSizeModel.prototype **/
        {
            /**
            * Default model options
            */
            defaults: {
                sig: []
            }
        });
    /**
     * @name module:searchPageSize.SearchPageSizeView
     * @constructor
     * @augments Backbone.View
     */
    var SearchPageSizeView = XA.component.search.baseView.extend(
        /** @lends module:searchPageSize.SearchPageSizeView **/
        {
            clicks: 0,
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:XA.component.search.vent~event:hashChanged
            * @memberof module:searchPageSize.SearchPageSizeView
            * @alias module:searchPageSize.SearchPageSizeView#initialize
            */
            initialize: function () {
                var inst = this,
                    pageSize = this.getCurrentPageSize(),
                    dataProperties = this.$el.data().properties;


                this.model.set("sig", this.translateSignatures(dataProperties.searchResultsSignature, facetName));

                this.selectOption(pageSize);

                if (typeof pageSize === 'undefined' && dataProperties.defaultPageSize !== "") {
                    inst.selectOption(dataProperties.defaultPageSize);
                }

                XA.component.search.vent.on("hashChanged", function (hash) {
                    var sig = inst.model.get("sig"), i;
                    for (i = 0; i < sig.length; i++) {
                        if (hash.hasOwnProperty(sig[i])) {
                            inst.selectOption(hash[sig[i]]);
                        }
                    }
                });
            },
            /**
             * list of events for Backbone View
             * @memberof module:searchPageSize.SearchPageSizeView
             * @alias module:searchPageSize.SearchPageSizeView#events
             */
            events: {
                'click select': 'updatePageSizeClick',
                'change select': 'updatePageSizeSelect'
            },
            /**
            * Get page size value from hash
            * @memberOf module:searchPageSize.SearchPageSizeView
            * @alias module:searchPageSize.SearchPageSizeView#getCurrentPageSize
            * @returns {String} value of current page size
            */
            getCurrentPageSize: function () {
                var hashObj = queryModel.parseHashParameters(window.location.hash),
                    sig = this.model.get("sig"),
                    i;

                for (i = 0; i < sig.length; i++) {
                    if (hash.hasOwnProperty(sig[i])) {
                        return hash[sig[i]];
                    }
                }
            },
            /**
            * Manage 'selected' attribute for options 
            * @param {String} pageSize active page 
            * @memberOf module:searchPageSize.SearchPageSizeView
            * @alias module:searchPageSize.SearchPageSizeView#selectOption
            */
            selectOption: function (pageSize) {
                if (pageSize !== undefined) {
                    var selectedOption = this.$el.find("select option[value='" + pageSize + "']");
                    selectedOption.siblings().removeAttr('selected');
                    selectedOption.attr('selected', 'selected');
                }
            },
            /**
            * Updates page size according to value of selected option
            * @param {Event} event active page 
            * @memberOf module:searchPageSize.SearchPageSizeView
            * @alias module:searchPageSize.SearchPageSizeView#updatePageSizeClick
            */
            updatePageSizeClick: function (event) {
                this.clicks++;
                if (this.clicks === 2) {
                    var pageSize = $(event.target).find("option:selected").val();
                    if (pageSize !== undefined) {
                        this.updatePageSize(pageSize);
                    }
                    this.clicks = 0;
                }
            },
            /**
           * Updates hash with selected page value
           * @param {String} pageSize active page 
           * @memberOf module:searchPageSize.updatePageSize
           * @alias module:searchPageSize.SearchPageSizeView#updatePageSize
           */
            updatePageSize: function (pageSize) {
                var sig = this.model.get("sig");
                queryParameters.updateHash(this.updateSignaturesHash(sig, pageSize, {}));
            },
            /**
            * Calls ['updatePageSize']{@link module:searchPageSize.SearchPageSizeView#updatePageSize}
            *  with select page as a parameter
            *  @param {Event} param event object with target element
            * @memberOf module:searchPageSize.updatePageSize
            * @alias module:searchPageSize.SearchPageSizeView#updatePageSizeSelect
            */
            updatePageSizeSelect: function (param) {
                var pageSize = param.currentTarget.value;
                this.updatePageSize(pageSize);
            }
        });

    /**
    * For each page size component on a page creates instance of 
    * ["SearchPageSizeModel"]{@link module:searchPageSize.SearchPageSizeModel} and 
    * ["SearchPageSizeView"]{@link module:searchPageSize.SearchPageSizeView} 
    * @memberOf module:searchPageSelector
    * @alias module:searchPageSize.SearchPageSizeView.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;
        queryParameters = XA.component.search.parameters;
        searchResultModels = XA.component.search.results.searchResultModels;

        var searchPageSize = $(".page-size");
        _.each(searchPageSize, function (elem) {
            var view = new SearchPageSizeView({ el: $(elem), model: new SearchPageSizeModel() });
        });

        initialized = true;
    };
    /**
   * Returns default page size 
   * @memberOf module:searchPageSize
   * @alias module:searchPageSize.getDefaultPageSizes
   * @returns {Array|Number} array with signature and page sizes or -1
   */
    api.getDefaultPageSizes = function () {
        var pageSizeComponents = $(".page-size"),
            data,
            i,
            defaultPageSize,
            searchResultsSignatures,
            pageSize,
            result = [];

        if (pageSizeComponents.length > 0) {
            for (i = 0; i < pageSizeComponents.length; i++) {
                pageSize = $(pageSizeComponents[i]);
                data = pageSize.data();
                searchResultsSignatures = data.properties.searchResultsSignature.split(',')
                defaultPageSize = data.properties.defaultPageSize;
                result.push({
                    signatures: searchResultsSignatures,
                    defaultPageSize: defaultPageSize !== '' ? defaultPageSize : pageSize.find("select option:first-child").val()
                });
            }
            return result;
        }

        return -1;
    }

    return api;

}(jQuery, document));

XA.register('searchPageSize', XA.component.search.pageSize);