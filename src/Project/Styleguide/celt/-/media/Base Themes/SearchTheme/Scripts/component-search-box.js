/**
 * Search box component functionality
 * @module searchBox
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with search box
*/
XA.component.search.box = (function ($, document) {
    var api = {},
        searchBoxViews = [],
        searchBoxModels = [],
        queryModel,
        urlHelperModel,
        searchResultModels,
        initialized = false;
    /**
    * @name module:searchBox.SearchBoxModel
    * @constructor
    * @augments Backbone.Model
    */
    var SearchBoxModel = Backbone.Model.extend(
        /** @lends module:searchBox.SearchBoxModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                searchEngine: "",
                typeahead: "",
                dataProperties: {},
                searchQuery: "",
                loadingInProgress: false,
                sig: []
            },
            /**
            * create instance of 
            * ["Bloodhound"]{@link https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md}
            * width necessary options
            * @memberOf module:searchBox.SearchBoxModel
            * @method
            * @alias module:searchBox.SearchBoxModel.initSearchEngine
            */
            initSearchEngine: function () {
                var inst = this,
                    siteName = XA.component.search.ajax.getPrameterByName("sc_site"),
                    searchEngine = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace("name"),
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        limit: inst.get("dataProperties").p,
                        remote: {
                            url: urlHelperModel.createSiteUrl(inst.createSuggestionsUrl($.extend({ l: inst.getLanguage() }, inst.get("dataProperties")), inst.get("searchQuery")), siteName),
                            filter: function (list) {
                                var searchArr = [];
                                return _.map(list.Results, function (item) { return { html: item.Html }; });
                            },
                            replace: function () {
                                var valueProvider = inst.get("valueProvider"),
                                    searchQuery = valueProvider(),
                                    properties = $.extend({ l: inst.getLanguage() }, inst.get("dataProperties"));

                                return urlHelperModel.createSiteUrl(inst.createSuggestionsUrl(properties, searchQuery), siteName);
                            },
                            ajax: {
                                beforeSend: function () {
                                    inst.set({ "loadingInProgress": true });
                                },
                                complete: function () {
                                    inst.set({ "loadingInProgress": false });
                                }
                            }
                        }
                    });

                searchEngine.initialize();
                this.set({ searchEngine: searchEngine });
            },
            /**
            * Creates url from which suggestion should be taken
            * @memberOf module:searchBox.SearchBoxModel
            * @method
            * @param {Object} properties list of properties for suggestion functionality 
            * @param {String} searchQuery text from search box
            * @alias module:searchBox.SearchBoxModel.createSuggestionsUrl
            * @returns {string} search url based on setups
            */
            createSuggestionsUrl: function (properties, searchQuery) {
                var suggestionsMode = this.get("dataProperties").suggestionsMode,
                    resultsEndpoint = this.get("dataProperties").endpoint,
                    suggestionsEndpoint = this.get("dataProperties").suggestionEndpoint;

                switch (suggestionsMode) {
                    case "ShowPredictions": {
                        return urlHelperModel.createPredictiveSearchUrl(suggestionsEndpoint, properties, searchQuery);
                    }
                    default: {
                        return urlHelperModel.createPredictiveSearchUrl(resultsEndpoint, properties, searchQuery);
                    }
                }
            },
            /**
            * get search box signature
            * @memberOf module:searchBox.SearchBoxModel
            * @method
            * @alias module:searchBox.SearchBoxModel.getSignature
            * @returns {string} search box signature
            */
            getSignature: function () {
                var rawSignature = this.get("dataProperties").searchResultsSignature,
                    signatures;

                if (typeof rawSignature === "undefined" || rawSignature === null) {
                    return "";
                }

                signatures = rawSignature.split(',');

                if (rawSignature === "") {
                    return "";
                } else {
                    return signatures[0];
                }
            },
            /**
            * get search box language
            * @memberOf module:searchBox.SearchBoxModel
            * @method
            * @alias module:searchBox.SearchBoxModel.getLanguage
            * @returns {string} selected language
            */
            getLanguage: function () {
                var dataProperties = this.get("dataProperties"),
                    searchResultModels = XA.component.search.results.searchResultModels,
                    languageSource = dataProperties.languageSource,
                    signature = this.getSignature(),
                    model;

                switch (languageSource) {
                    case "CurrentLanguage":
                    case "AllLanguages": {
                        return dataProperties.l;
                    }
                    default: {
                        model = searchResultModels.filter(function (element) {
                            return element.get("dataProperties").sig === signature;
                        })[0];
                        if (typeof model !== "undefined") {
                            return model.get("dataProperties").l;
                        }
                        break;
                    }
                }

                return "";
            }
        });
    /**
    * @name module:searchBox.SearchBoxView
    * @constructor
    * @augments Backbone.View
    */
    var SearchBoxView = XA.component.search.baseView.extend(
        /** @lends module:searchBox.SearchBoxView.prototype **/
        {
            /**
             *Initializes typeahead for view, sets up watchers for change on model
             *and call ["initSearchEngine"]{@link module:searchBox.SearchBoxModel}
            * @memberof module:searchBox.SearchBoxView.prototype
            */
            initialize: function () {
                var inst = this,
                    dataProperties = this.$el.data(),
                    typeahead;

                dataProperties.properties.targetSignature = dataProperties.properties.targetSignature !== null ? dataProperties.properties.targetSignature : "";

                this.model.set({ dataProperties: dataProperties.properties });
                this.model.set("sig", this.translateSignatures(dataProperties.properties.searchResultsSignature, "q"));
                this.model.initSearchEngine();
                this.model.on("change:loadingInProgress", this.loading, this);

                typeahead = this.$el.find(".search-box-input").typeahead({
                    hint: true,
                    minLength: dataProperties.properties.minSuggestionsTriggerCharacterCount
                },
                    {
                        source: inst.model.get("searchEngine").ttAdapter(),
                        displayKey: function () { return inst.$el.find(".search-box-input.tt-input").val(); },
                        templates: {
                            suggestion: function (data) {
                                var suggestionsMode = dataProperties.properties.suggestionsMode,
                                    text = data.html.replace(/(<([^>]+)>)/ig, ""),
                                    suggestionText = text !== "" ? text : data.html;

                                switch (suggestionsMode) {
                                    case "ShowPredictions":
                                    case "ShowSearchResultsAsPredictions": {
                                        return '<div class="sugesstion-item">' + suggestionText + '</div>';
                                    }
                                    default: {
                                        return '<div class="sugesstion-item">' + data.html + '</div>';
                                    }
                                }
                            }
                        }
                    }).on('typeahead:selected', this.suggestionSelected.bind(inst));

                //TODO: Seems like bellow line isn't needed as updateSearchBoxValue() function will be callend when hash will change - to be tested in non/multi signatures cases
                //$searchBox.val(hashObj[this.model.get("sig")] !== undefined ? hashObj[this.model.get("sig")] : "");

                this.model.set({ typeahead: typeahead });
                this.model.set({
                    valueProvider: function () {
                        return inst.$el.find(".search-box-input.tt-input").val();
                    }
                });
                XA.component.search.vent.on("hashChanged", this.updateSearchBoxValue.bind(this));
            },
            /**
             * list of events for Backbone View
             * @memberof module:searchBox.SearchBoxView
             * @alias module:searchBox.SearchBoxView#events
             */
            events: {
                "click .search-box-button": "updateQueryModelClick",
                "click .search-box-button-with-redirect": "updateQueryWithRedirect",
                "keypress .search-box-input.tt-input": "predictiveSearch",
                "keydown .search-box-input.tt-input": "predictiveSearch"
            },
            /**
            * Toggle css class "loading-in-progress"
            * @memberof module:searchBox.SearchBoxView
            * @alias module:searchBox.SearchBoxView#loading
            */
            loading: function () {
                this.$el.toggleClass("loading-in-progress");
            },
            /**
            * Called when selected value from search box and call
            * ["performSearch"]{@link module:performSearch} or re
            * @memberof module:searchBox.SearchBoxView
            * @param {jQuery<Event>} event jQuery event object
            * @param {DomElement} data DOM element that was selected
            * @alias module:searchBox.SearchBoxView#suggestionSelected
            */
            suggestionSelected: function (event, data) {
                event.preventDefault();

                var suggestionsMode = this.model.get("dataProperties").suggestionsMode,
                    text = $(data.html).text(),
                    suggestionText = text != "" ? text : data.html,
                    link;

                switch (suggestionsMode) {
                    case "ShowPredictions":
                    case "ShowSearchResultsAsPredictions": {
                        this.performSearch(suggestionText);
                        break;
                    }
                    default: {
                        link = $(data.html).find("a");
                        if (link.length) {
                            window.location.href = $(link[0]).attr("href");
                        }
                        break;
                    }
                }
            },
            /**
            * Updates hash value and makes redirect based on value from search box
            * @memberof module:searchBox.SearchBoxView
            * @param {jQuery<Event>} event jQuery event object
            * @alias module:searchBox.SearchBoxView#updateQueryWithRedirect
            */
            updateQueryWithRedirect: function (event) {
                event.preventDefault();

                var resultPage = this.model.get("dataProperties").resultPage,
                    targetSignature = this.model.get("dataProperties").targetSignature,
                    searchResultsSignature = this.model.get("dataProperties").searchResultsSignature,
                    query = encodeURIComponent(this.$el.find(".search-box-input.tt-input").val()),
                    sig = this.model.get("sig"),
                    queryWithSignature = {};

                if (targetSignature !== "") {
                    queryWithSignature = this.updateSignaturesHash([targetSignature + "_q"], query, this.createOffsetObject());
                } else {
                    queryWithSignature = this.updateSignaturesHash(sig, query, this.createOffsetObject());
                }

                window.location.href = urlHelperModel.createRedirectSearchUrl(resultPage, queryWithSignature, searchResultsSignature, targetSignature);
            },
            /**
            * Takes search box value as a query value and calls
            * ["updateQueryModel"]{@link module:module:searchBox.SearchBoxView#updateQueryModel}
            * @memberof module:searchBox.SearchBoxView
            * @param {jQuery<Event>} event jQuery event object
            * @alias module:searchBox.SearchBoxView#updateQueryModelClick
            */
            updateQueryModelClick: function (event) {
                event.preventDefault();
                var query = this.$el.find(".search-box-input.tt-input").val();
                this.closeDropdown();
                this.updateQueryModel(query);
            },
            /**
             * Updates hash based on searchValue
             * @memberof module:searchBox.SearchBoxView
             * @param {String} query jQuery event object
             * @alias module:searchBox.SearchBoxView#updateQueryModel
             */
            updateQueryModel: function (query) {
                var searchValue = {},
                    offsetSignatures = this.translateSignatures(this.model.get("dataProperties").searchResultsSignature, "e"),
                    sig = this.model.get("sig"),
                    i;

                for (i = 0; i < sig.length; i++) {
                    searchValue[sig[i]] = query;
                    searchValue[offsetSignatures[i]] = 0;
                }

                queryModel.updateHash(searchValue, this.model.get("dataProperties").targetUrl);
            },
            /**
            * Calls ["performSearch"]{@link module:searchBox.SearchBoxView#performSearch} 
            * by pressing Enter key
            * @memberof module:searchBox.SearchBoxView
            * @param {Event} event Event object
            * @alias module:searchBox.SearchBoxView#predictiveSearch
            */
            predictiveSearch: function (event) {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    this.performSearch(this.$el.find(".search-box-input.tt-input").val());
                }
            },
            /**
             * Makes search
             * @memberof module:searchBox.SearchBoxView
             * @param {String} query value from search box
             * @alias module:searchBox.SearchBoxView#performSearch
             */
            performSearch: function (query) {
                var properties = this.model.get("dataProperties"),
                    targetSignature = properties.targetSignature,
                    searchResultsSignature = properties.searchResultsSignature,
                    resultPage = properties.resultPage,
                    sig = this.model.get("sig"),
                    queryWithSignature = {};

                this.closeDropdown();

                if (resultPage === "") {
                    this.updateQueryModel(query);
                    this.$el.find(".search-box-input.tt-input").blur().val(query);
                } else {
                    query = encodeURIComponent(query);
                    if (targetSignature !== "") {
                        queryWithSignature = this.updateSignaturesHash([targetSignature + "_q"], query, this.createOffsetObject())
                    } else {
                        queryWithSignature = this.updateSignaturesHash(sig, query, this.createOffsetObject())
                    }
                    window.location.href = urlHelperModel.createRedirectSearchUrl(resultPage, queryWithSignature, searchResultsSignature, targetSignature);
                }
            },
            /**
             * Creates object that contain signatures
             * @memberof module:searchBox.SearchBoxView
             * @alias module:searchBox.SearchBoxView#createOffsetObject
             */
            createOffsetObject: function () {
                var sig = this.model.get("sig"),
                    targetSignature = this.model.get("dataProperties").targetSignature,
                    signature = targetSignature !== "" ? targetSignature : this.model.get("dataProperties").searchResultsSignature,
                    offsetSignatures = this.translateSignatures(signature, "e"),
                    offsetObject = {},
                    i;

                for (i = 0; i < sig.length; i++) {
                    offsetObject[offsetSignatures[i]] = 0;
                }

                return offsetObject;
            },
            /**
             * Sets value into search box based on hash 
             * @memberof module:searchBox.SearchBoxView
             * @alias module:searchBox.SearchBoxView#updateSearchBoxValue
             */
            updateSearchBoxValue: function () {
                var hashObj = queryModel.parseHashParameters(window.location.hash),
                    el = this.$el.find(".search-box-input.tt-input"),
                    sig = this.model.get("sig"),
                    i;

                for (i = 0; i < sig.length; i++) {
                    if (hashObj.hasOwnProperty(sig[i])) {
                        el.val(decodeURIComponent(hashObj[sig[i]]));
                    } else {
                        el.val("");
                    }
                }
            },
            /**
             * Closes typeahead drop down
             * @memberof module:searchBox.SearchBoxView
             * @alias module:searchBox.SearchBoxView#closeDropdown
             */
            closeDropdown: function () {
                this.$el.find(".search-box-input").typeahead('close');
            }
        });
    /**
     * For each search box on a page creates instance of 
     * ["searchBoxModel"]{@link module:searchBox.SearchBoxModel} and 
     * ["SearchBoxView"]{@link module:searchBox.SearchBoxView} 
     * @memberOf module:searchBox
     * @alias module:searchBox.init
     */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }
        queryModel = XA.component.search.query;
        searchResultModels = XA.component.search.results.searchResultModels;
        urlHelperModel = XA.component.search.url;

        var searchBox = $(".search-box:not(.initialized)");
        _.each(searchBox, function (elem) {
            var $el = $(elem);
            var boxModel = new SearchBoxModel();
            searchBoxModels.push(boxModel);
            searchBoxViews.push(new SearchBoxView({ el: $el, model: boxModel }));
            $el.addClass("initialized");
        });

        initialized = true;
    };
    /**
    * Extends search box API with 
    * ["searchBoxViews"]{@link module:searchBox.searchBoxViews} 
    * @memberOf module:searchBox
    * @alias module:searchBox.searchBoxViews
    */
    api.searchBoxViews = searchBoxViews;
    /**
* Extends search box API with 
* ["searchBoxModels"]{@link module:searchBox.searchBoxModels} 
* @memberOf module:searchBox
* @alias module:searchBox.searchBoxViews
*/
    api.searchBoxModels = searchBoxModels;

    return api;

}(jQuery, document));

XA.register('searchBox', XA.component.search.box);
