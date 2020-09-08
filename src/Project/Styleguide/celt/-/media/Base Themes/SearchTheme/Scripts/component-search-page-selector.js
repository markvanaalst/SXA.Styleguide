/**
 * Facet page selector component functionality
 * @module searchPageSelector
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with component page selector
*/
XA.component.search.pageSelector = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchPageSelector
    */
    var api = {},
        queryModel,
        initialized = false;
    facetName = "e";
    /**
    * @name module:searchPageSelector.SearchPageSelectorModel
    * @constructor
    * @augments Backbone.Model
    */
    var SearchPageSelectorModel = Backbone.Model.extend(
        /** @lends module:searchPageSelector.SearchPageSelectorModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                dataProperties: {},
                resultsCount: 0,
                offset: 0,
                selectedValue: 1,
                pageSize: 0,
                repeatRequest: false,
                template: "<ul class='page-selector-list'> " +
                    "<li class='page-selector-item-first'><a href='#'><%= data.first %></a></li>" +
                    "<li class='page-selector-item-previous'><a href='#'><%= data.previous %></a></li>" +
                    "<% var beforePage = 0; %>" +
                    "<% _.each(data.pages, function(page){ %>" +
                    "<% if((beforePage+1) != page.number){ %>" +
                    "<li><span class='page-selector-more'>...</span></li>" +
                    "<% } %>" +
                    "<% beforePage = page.number; %>" +
                    "<% if(data.selectedValue === page.number){ %>" +
                    "<% active = 'active'; %>" +
                    "<% }else { active = '' } %>" +
                    "<li><a class='page-selector-item-link <%= active %>' data-offset='<%= page.offset %>' data-itemNumber='<%= page.number %>' href='#'><%= page.number %></a></li>" +
                    "<% }); %>" +
                    "<li class='page-selector-item-next'><a href='#'><%= data.next %></a></li>" +
                    "<li class='page-selector-item-last'><a href='#'><%= data.last %></a></li>" +
                    "</ul>",
                sig: [],
                timeStamp: new Date().getTime()
            }
        });
    /**
     * @name module:searchPageSelector.SearchPageSelectorView
     * @constructor
     * @augments Backbone.View
     */
    var SearchPageSelectorView = XA.component.search.baseView.extend(
        /** @lends module:searchPageSelector.SearchPageSelectorView **/
        {
            /**
           * Initially sets data to model and watches events on which
           * view should be updated
           * @listens module:searchPageSelector.SearchPageSelectorView~event:change
           * @listens module:XA.component.search.vent~event:results-loaded
           * @memberof module:searchPageSelector.SearchPageSelectorView
           * @alias module:searchPageSelector.SearchPageSelectorView#initialize
           */
            initialize: function () {
                var dataProp = this.$el.data();

                if (dataProp.properties.searchResultsSignature === null) {
                    dataProp.properties.searchResultsSignature = "";
                }

                this.model.set("dataProperties", dataProp);
                this.model.set("sig", this.translateSignatures(dataProp.properties.searchResultsSignature, facetName));
                this.model.on("change", this.render, this);

                XA.component.search.vent.on("results-loaded", this.handleLoadedData.bind(this));

                //check whether page is opened from disc - if yes then we are in Creative Exchange mode and lets mock some content
                if (window.location.href.startsWith("file://")) {
                    this.model.set({
                        "resultsCount": 10,
                        "pageSize": 2,
                        "selectedValue": 2
                    });
                }
            },
            /**
             * list of events for Backbone View
             * @memberof module:searchPageSelector.SearchPageSelectorView
             * @alias module:searchPageSelector.SearchPageSelectorView#events
             */
            events: {
                'click .page-selector-item-link': "updateSelectedValue",
                'click .page-selector-item-first a': "showFirstPage",
                'click .page-selector-item-last a': "showLastPage",
                'click .page-selector-item-previous a': "showPrevPage",
                'click .page-selector-item-next a': "showNextPage"
            },
            /**
            * Updates model values with selectedValue
            * and data object from server response
            * @param {Object} data Data that contains component properties
            * @param {Number} selectedValue number of selected page 
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#updateModelAfterSearch
            */
            updateModelAfterSearch: function (data, selectedValue) {
                this.model.set({
                    "pageSize": parseInt(data.pageSize),
                    "resultsCount": parseInt(data.dataCount),
                    "offset": parseInt(data.offset),
                    "selectedValue": parseInt(selectedValue)
                });
                this.model.set("timeStamp", new Date().getTime());
                this.updateElementCssClass(data);
            },
            /**
            * Function that based on selected component values sets css class
            * page-selector-empty or page-selector-single-page
            * @param {Object} data Data that contains component properties
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#updateElementCssClass
            */
            updateElementCssClass: function (data) {
                this.el.classList.remove("page-selector-empty")
                this.el.classList.remove("page-selector-single-page")
                if (data.dataCount === 0) {
                    this.el.classList.add("page-selector-empty")
                } else if (data.pageSize > data.dataCount || data.offset > data.dataCount) {
                    this.el.classList.add("page-selector-single-page")
                }
            },
            /**
            * Updates hash according to changed component value
            * @param {Event} event Event object that contains target with selected component value
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#updateSelectedValue
            */
            updateSelectedValue: function (event) {
                event.preventDefault();

                var sig = this.model.get("sig"),
                    dataProp = $(event.target).data();

                queryModel.updateHash(this.updateSignaturesHash(sig, dataProp.offset, {}));
            },
            /**
            * Switches page selector to the first page and updates hash parameters
            * @param {Event} event Event object that contains target with selected component value
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#showFirstPage
            */
            showFirstPage: function (event) {
                event.preventDefault();

                var sig = this.model.get("sig"),
                    dataProp = $(event.target).data();

                queryModel.updateHash(this.updateSignaturesHash(sig, 0, {}));
            },
            /**
            * Switches page selector to the last page and updates hash parameters
            * @param {Event} event Event object that contains target with selected component value
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#showLastPage
            */
            showLastPage: function (event) {
                event.preventDefault();
                var lastPageItems = this.model.get("resultsCount") % this.model.get("pageSize"),
                    offset = this.model.get("resultsCount") - ((lastPageItems === 0) ? this.model.get("pageSize") : lastPageItems),
                    sig = this.model.get("sig");

                queryModel.updateHash(this.updateSignaturesHash(sig, offset, {}));
            },
            /**
            * Switches page selector to the next page and updates hash parameters
            * @param {Event} event Event object that contains target with selected component value
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#showNextPage
            */
            showNextPage: function (event) {
                event.preventDefault();

                var offset = this.model.get("offset"),
                    sig = this.model.get("sig");

                if ((offset + this.model.get("pageSize")) < this.model.get("resultsCount")) {
                    offset += this.model.get("pageSize");
                }

                queryModel.updateHash(this.updateSignaturesHash(sig, offset, {}));
            },
            /**
            * Switches page selector to the precious page and updates hash parameters
            * @param {Event} event Event object that contains target with selected component value
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#showPrevPage
            */
            showPrevPage: function (event) {
                event.preventDefault();

                var offset = this.model.get("offset"),
                    dataProp = $(event.target).data(),
                    sig = this.model.get("sig");

                if ((offset - this.model.get("pageSize")) >= 0) {
                    offset -= this.model.get("pageSize");
                }

                queryModel.updateHash(this.updateSignaturesHash(sig, offset, {}));
            },
            /**
            * Renders view
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#render
            */
            render: function () {
                var inst = this,
                    dataProp = this.model.get("dataProperties").properties,
                    resultsCount = this.model.get("resultsCount"),
                    pageSize = this.model.get("pageSize"),
                    selectedValue = this.model.get("selectedValue"),
                    pagesCount = Math.ceil(resultsCount / pageSize),
                    pages = [],
                    rangeStart = selectedValue - dataProp.treshold / 2,
                    rangeEnd = selectedValue + dataProp.treshold / 2,
                    templateObj;

                if (rangeStart < 0) {
                    rangeEnd += Math.abs(rangeStart);
                }

                if (rangeEnd > pagesCount) {
                    rangeStart -= (rangeEnd - pagesCount);
                }

                if (dataProp.treshold >= pagesCount) {
                    for (var i = 0; i < pagesCount; i++) {
                        pages.push({ number: i + 1, offset: i * pageSize });
                    }
                }
                else {
                    for (var i = 1; i <= pagesCount; i++) {
                        if ((i === 1) || (i === pagesCount)) {
                            pages.push({ number: i, offset: (i - 1) * pageSize });
                        }
                        else if ((i >= rangeStart) && (i <= rangeEnd)) {
                            pages.push({ number: i, offset: (i - 1) * pageSize });
                        }
                    }
                }

                templateObj = {
                    previous: dataProp.previous,
                    first: dataProp.first,
                    next: dataProp.next,
                    last: dataProp.last,
                    pages: pages,
                    selectedValue: selectedValue
                };
                var template = _.template(inst.model.get("template"));
                var templateResult = template({ data: templateObj });
                this.$el.html(templateResult);

                this.handleButtonState(selectedValue, pagesCount);
            },
            /**
            * Sets up page selectors buttons state depending on selected values
            * @param {Number} selectedPage number of selected page
            * @param {Number} pageCount number of pages
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#handleButtonState
            */
            handleButtonState: function (selectedPage, pageCount) {
                this.$el.find(".page-selector-item-last, .page-selector-item-next").removeClass("inactive");
                this.$el.find(".page-selector-item-first, .page-selector-item-previous").removeClass("inactive");


                if (pageCount == 0) {
                    this.$el.find(".page-selector-item-first, .page-selector-item-previous").addClass("inactive");
                    this.$el.find(".page-selector-item-last, .page-selector-item-next").addClass("inactive");
                }
                else {
                    if (selectedPage == 1) {
                        this.$el.find(".page-selector-item-first, .page-selector-item-previous").addClass("inactive");
                    }
                    if (selectedPage == pageCount) {
                        this.$el.find(".page-selector-item-last, .page-selector-item-next").addClass("inactive");
                    }
                }
            },
            /**
            * Updates hash and model based on data object
            * @param {Object} data Data that contains component properties
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#handleLoadedData
            */
            handleLoadedData: function (data) {
                var that = this,
                    sig = this.model.get("dataProperties").properties.searchResultsSignature.split(','),
                    hash = queryModel.parseHashParameters(window.location.hash),
                    newSelectedValue,
                    param,
                    hashObj,
                    i;

                if (typeof data.offset === 'undefined') {
                    data.offset = 0;
                }

                for (i = 0; i < sig.length; i++) {
                    if (encodeURIComponent(sig[i]) === data.searchResultsSignature) {
                        if (data.pageSize > data.dataCount || data.offset > data.dataCount) {
                            //When we have less results then page size then show first page
                            this.updateModelAfterSearch(data, 1);
                            //Wait till all requests are done and go to first page
                            setTimeout(function () {
                                //queryModel.updateHash({e: 0}); //- this will work, but doesn't give us proper browser history
                                hashObj = queryModel.parseHashParameters(window.location.hash);
                                param = data.searchResultsSignature !== "" ? data.searchResultsSignature + "_e" : "e";
                                if (hash[param] !== "0") {
                                    hashObj[param] = 0;
                                    Backbone.history.navigate(that.createFirstPageUrlHash(hashObj), { trigger: true, replace: true });
                                }
                            }, 100);
                        } else {
                            newSelectedValue = Math.ceil(data.offset / data.pageSize) + 1;
                            this.updateModelAfterSearch(data, newSelectedValue);
                        }
                    }
                }
            },
            /**
            * Calculates hash parameters for first page
            * @param {Object} data Data that contains component properties
            * @memberOf module:searchPageSelector.SearchPageSelectorView
            * @alias module:searchPageSelector.SearchPageSelectorView#createFirstPageUrlHash
            * @returns {String} hash parameter for first page
            */
            createFirstPageUrlHash: function (hashObj) {
                var hashStr = "";

                var i = 0;
                _.each(hashObj, function (item, key) {
                    if (i > 0) {
                        hashStr += "&";
                    }
                    i++;
                    hashStr += key + "=" + item;
                });

                return hashStr;
            }
        });

    /**
    * For each page selector on a page creates instance of 
    * ["SearchPageSelectorModel"]{@link module:searchPageSelector.SearchPageSelectorModel} and 
    * ["SearchPageSelectorView"]{@link module:searchPageSelector.SearchPageSelectorView} 
    * @memberOf module:searchPageSelector
    * @alias module:searchPageSelector.SearchPageSelectorView.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;

        var searchPageSelector = $(".page-selector");
        _.each(searchPageSelector, function (elem) {
            new SearchPageSelectorView({ el: $(elem), model: new SearchPageSelectorModel });
        });

        initialized = true;
    };

    return api;

}(jQuery, document));

XA.register('searchPageSelector', XA.component.search.pageSelector);
