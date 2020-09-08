/**
 * Search sorting component functionality
 * @module searchSort
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with search sort component
*/
XA.component.search.sort = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchSort
    */
    var api = {},
        initialized = false,
        queryModel,
        queryParameters,
        getSignature;
    /**
    * @name module:searchSort.SortModel
    * @constructor
    * @augments Backbone.Model
    */
    var SortModel = Backbone.Model.extend(
        /** @lends module:searchSort.SortModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                updateOrder: false,
                sig: []
            }
        });
    /**
    * @name module:searchSort.SortView
    * @constructor
    * @augments Backbone.View
    */
    var SortView = XA.component.search.baseView.extend(
        /** @lends module:searchSort.SortView.prototype **/
        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:XA.component.search.vent~event:hashChanged
            * @memberof module:searchSort.SortView
            * @alias module:searchSort.SortView#initialize
            */
            initialize: function () {
                var dataProperties = this.$el.data();

                if (this.model) {
                    this.model.set("sig", this.translateSignatures(dataProperties.properties.sig, "o"));
                }

                XA.component.search.vent.on("hashChanged", this.updateComponent.bind(this));
            },
            /**
             * list of events for Backbone View
            * @memberof module:searchSort.SortView
            * @alias module:searchSort.SortView#events
             */
            events: {
                'click .sort-results-group a': 'sortSearchResultsLink',
                'change select': 'sortSearchResultsSelect'
            },
            /**
             * prevents default event and calls
             * ['sortSearchResults']{@link module:searchSort.SortView.sortSearchResults}
             * method
             * @param {Event} event
             * @memberof module:searchSort.SortView
            * @alias module:searchSort.SortView#sortSearchResultsLink
             */
            sortSearchResultsLink: function (event) {
                event.preventDefault();
                this.sortSearchResults($(event.currentTarget).parent());
            },
            /**
             * call 
             * ['sortSearchResults']{@link module:searchSort.SortView.sortSearchResults}
             * method
             * @param {Event} event
             * @memberof module:searchSort.SortView
            * @alias module:searchSort.SortView#sortSearchResultsSelect
             */
            sortSearchResultsSelect: function (event) {
                this.sortSearchResults($(event.currentTarget[event.currentTarget.options.selectedIndex]));
            },
            /**
            * Updates hash with sorting value
            * @param {DomElement} element Element that contains data that is needed for sorting
            * @memberof module:searchSort.SortView
            * @alias module:searchSort.SortView#sortSearchResults
            */
            sortSearchResults: function (element) {
                var attributes = element.data(),
                    sig = this.model.get("sig"),
                    attrString = attributes.facet + ',' + attributes.direction;

                if (attributes.direction !== "") {
                    queryParameters.updateHash(this.updateSignaturesHash(sig, attrString, {}));
                } else {
                    queryParameters.updateHash(this.updateSignaturesHash(sig, "", {}));
                }
            },
            /**
            * Updates component selected value according to hash value
            * @param {Object} hash Hash value stores as an object
            * @memberof module:searchSort.SortView
            * @alias module:searchSort.SortView#updateComponent
            */
            updateComponent: function (hash) {
                var optionToSelect, sortData,
                    sig = this.model.get("sig"),
                    i;

                for (i = 0; i < sig.length; i++) {
                    if (hash.hasOwnProperty(sig[i])) {
                        sortData = hash[sig[i]].split(',');
                        optionToSelect = this.$el.find("[data-facet='" + sortData[0] + "'][data-direction='" + sortData[1] + "']");
                    } else {
                        optionToSelect = this.$el.find("[data-facet][data-direction]:first");
                    }
                }

                this.$el.find("[data-facet][data-direction]").removeAttr("selected");
                optionToSelect.attr("selected", "selected");
            }
        });
    /**
        * For each search sorting component on a page creates instance of 
        * ["SortModel"]{@link module:searchSort.SortModel} and 
        * ["SortView"]{@link module:searchSort.SortView} 
        * @memberOf module:searchSort
        * @alias module:searchSort.init
        */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;
        queryParameters = XA.component.search.parameters;

        var sort = $(".sort-results");
        _.each(sort, function (elem) {
            var sortModel = new SortModel(),
                view = new SortView({ el: $(elem), model: sortModel });
        });

        initialzied = true;
    };
    /**
    * Returns direction of sorting
    * @param {String} signature component signature
    * @memberOf module:searchSort
    * @alias module:searchSort.getFirstSortingOption
    * @retruns {String|Number} return string "facetName,direction" or -1
    */
    api.getFirstSortingOption = function (signature) {
        var sortResults = $(".sort-results"),
            firstSort,
            attributes,
            attrString,
            thisSignatures,
            data,
            i, j;

        for (i = 0; i < sortResults.length; i++) {
            if (typeof (signature) !== "undefined") {
                data = $(sortResults[i]).data();
                thisSignatures = data.properties.sig.split(',');

                for (j = 0; j < thisSignatures.length; j++) {
                    if (thisSignatures[j] === signature) {
                        firstSort = $(sortResults[i]).find("[data-facet][data-direction]");
                        attributes = firstSort.data();
                        if (attributes.direction !== "") {
                            attrString = attributes.facet + ',' + attributes.direction;
                            return attrString;
                        }
                    }
                }
            }
        }

        return -1;
    };

    return api;

}(jQuery, document));

XA.register('searchSort', XA.component.search.sort);
