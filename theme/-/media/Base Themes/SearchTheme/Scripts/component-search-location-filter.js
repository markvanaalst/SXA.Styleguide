/**
 * Location filter component functionality
 * @module locationfilter
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with location filter
*/
XA.component.search.locationfilter = (function ($, document) {

    "use strict";
  /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:locationfilter
    */
    var api = {},
        locationFilters = [],
        views = [],
        queryModel,
        urlHelperModel,
        initialized = false,
        scriptsLoaded = false,
        mapsConnector = XA.connector.mapsConnector,
        LocationFilterModel,
        LocationFilterView,
        initialize;
	/**
     * @memberOf module:locationfilter
     * @alias module:locationfilter.initialize
     * For each location filter component on a page creates instance of 
     * ["LocationFilterModel"]{@link module:locationfilter.LocationFilterModel} and 
     * ["LocationFilterView"]{@link module:locationfilter.LocationFilterView} 
     * @private
     */
    initialize = function() {
        var i, view;
        for (i = 0; i < locationFilters.length; i++) {
            //creates Backbone.js views - one view per component on the page
            view = new LocationFilterView({el: locationFilters[i], model: new LocationFilterModel()});
        }
    };
	/**
    * @name module:locationfilter.LocationFilterModel
    * @constructor
    * @augments Backbone.Model
    */
    LocationFilterModel = Backbone.Model.extend(
	        /** @lends module:locationfilter.LocationFilterModel.prototype **/
	{
		/**
        * Default model options
        * @default
        */
        defaults: {
            dataProperties: {},
            sig: []
        },
		/**
        * Initializes ["Bloodhound"]{@link https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md}
        * suggestion engine with dataProperties data
        * @memberof module:locationfilter.LocationFilterModel
        * @alias module:locationfilter.LocationFilterModel#initAutocompleteEngine
        */
        initAutocompleteEngine : function() {
            var _this = this,
                searchEngine;

            //initializes predictive only when number of predictions is not zero
            if(_this.get("dataProperties").p > 0){
                    searchEngine = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace("name"),
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        limit :  _this.get("dataProperties").p,
                        remote : {
                            url : "-",
                            replace : function(){
                                return Date.now().toString();
                            },
                            transport : function(options, onSuccess, onError){
                                var queryParams =  _this.get("queryParams");
                                if(!queryParams.text){
                                    onSuccess([]);
                                    return;
                                }
                                mapsConnector.locationAutocomplete(queryParams,
                                    function (results) { //success
                                        var simplifiedResults = results.map(function(result) {
                                            if (result.hasOwnProperty("text")) {
                                                return result.text;
                                            }
                                            return result;
                                        });

                                        onSuccess(simplifiedResults);
                                    },
                                    function(){ //fail
                                        onError("Could not autocomplete");
                                    });
                            }
                        }
                });
                searchEngine.initialize();
                this.set({"searchEngine" : searchEngine});
            }
        }
    });
    /**
    * @name module:locationfilter.LocationFilterView
    * @constructor
    * @augments Backbone.View
    */
    LocationFilterView = XA.component.search.baseView.extend(
	    /** @lends module:locationfilter.LocationFilterView.prototype **/
	{
		/**
        * Initially sets data to model, initializes typeahead.js, and watches events on which
        * view should be updated
        * @memberof module:locationfilter.LocationFilterView
        */
        initialize: function () {
            var inst = this,
                dataProperties = this.$el.data(),
                $textBox = this.$el.find(".location-search-box-input"),
                signatures = dataProperties.properties.searchResultsSignature.split(',');

            if (dataProperties.properties.searchResultsSignature === null) {
                dataProperties.properties.searchResultsSignature = "";
            }

            this.model.set({ dataProperties: dataProperties.properties });
            this.model.set({ sig: signatures});
            this.model.set({ queryParams: { maxResults: dataProperties.p, text: "" } });
            this.model.initAutocompleteEngine();

            var autocompleteEngine = this.model.get("searchEngine");

            if(autocompleteEngine){
                $textBox.typeahead({
                    hint : true,
                    minLength : 2
                },
                {
                    source : autocompleteEngine.ttAdapter(),
                    templates : {
                        suggestion : function(data) {
                            return '<div class="suggestion-item">' + data + '</div>';
                        }
                    }
                }).on("typeahead:selected",function(args, selected){
                    inst.translateUserLocation(selected);
                    $textBox.typeahead("val", selected);
                });
            }

            this.addressLookup(true);

            XA.component.search.vent.on("hashChanged", function(hash) {
                var address = hash[signatures.length > 0 && signatures[0] !== "" ? signatures[0] + "_a" : "a"];
                if (typeof address !== "undefined" && address !== null && address !== "") {
                    $textBox.val(address);
                }
            });
        },
		/**
        * list of events for Backbone View
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#events
        */
        events: {
            "click .location-search-box-button": "addressLookup",
            "keypress .location-search-box-input": "searchTextChanges",
            "keyup .location-search-box-input" : "autocomplete"
        },
		/**
        * Looks for an address based on a value that is specified by user
        * in input
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#addressLookup
        */
        addressLookup: function(isInitialRender){
            var properties = this.model.get("dataProperties"),
                lookupQuery = {
                    text: this.getAddress(isInitialRender),
                    maxResults: 1
                },
                hashObj;

            if (lookupQuery.text === "") {
                hashObj = this.createHashObject("", "", "");
                this.updateHash(hashObj, properties);
            }

            switch (properties.mode) {
                case "Location": {
                    //Uses browser to detect location
                    this.detectLocation();
                    break;
                }
                case "UserProvided": {
                    //Takes address entered by user and tries to convert it to latitude and longitude
                    this.translateUserLocation(lookupQuery);
                    break;
                }
                case "Mixed": {
                    //Uses user address or tries to detect location by browser
                    if (typeof(lookupQuery.text) === "undefined" || lookupQuery.text === "") {
                        this.detectLocation();
                    } else {
                        this.translateUserLocation(lookupQuery);
                    }
                    break;
                }
            }
        },
		/**
        * Get Address from input or from hash 
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#getAddress
        * @returns {String} address from input or hash 
        */
        getAddress: function (isInitialRender) {
            var $textBox = this.$el.find(".location-search-box-input.tt-input"),
                text = $textBox.length !== 0 ? $textBox.val() : this.$el.find(".location-search-box-input").val(),
                hash = queryModel.parseHashParameters(window.location.hash),
                signatures = this.model.get("sig"),
                address;

            if (isInitialRender !== true && (text === "" || typeof text === "undefined")) {
                return "";
            }

            if (text === "" || typeof text === "undefined") {
                address = hash[signatures.length > 0 && signatures[0] !== "" ? signatures[0] + "_a" : "a"];
                if (address !== "") {
                    text = address;
                }
                if (typeof text === "undefined") {
                    text = "";
                }
            }

            return text;
        },
		/**
        * Gets text selected from typeahead suggestion and sets to model
        * @param {Event} args Event object
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#autocomplete
        */
        autocomplete : function(args){
            var $textBox,
                queryParams,
                properties = this.model.get("dataProperties");

            args.stopPropagation();
            if (args.keyCode === 13) {
                return;
            }

            $textBox = this.$el.find(".location-search-box-input.tt-input");

            queryParams = {
                text : $textBox.length !== 0 ? $textBox.val() : this.$el.find(".location-search-box-input").val(),
                maxResults : properties.p
            };
            this.model.set({queryParams : queryParams});
        },
		/**
        * If enter was pressed, method calls ["addressLookup"]{@link module:locationfilter.addressLookup}
        * @param {Event} e Event object
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#searchTextChanges
        * @returns {Boolean}  False if pressed enter. All other cases: True
        */
        searchTextChanges: function(e) {
            e.stopPropagation();
            if (e.keyCode === 13) {
                this.addressLookup(false);
                return false;
            }
            return true;
        },
		/**
        * Looks for an address and calls ["XA.connector.mapsConnector.addressLookup"]{@link module:XA.connector.mapsConnector.addressLookup}
        * @param {jQuery<DomElement>} lookupQuery Element where stored text for search location
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#translateUserLocation
        */
        translateUserLocation: function(lookupQuery) {
            var that = this,
                properties = this.model.get("dataProperties"),
                text = typeof lookupQuery.text !== "undefined" ? lookupQuery.text : lookupQuery,
                $textBox = this.$el.find(".location-search-box-input.tt-input"),
                hashObj = {};

            if (text === "") {
                return;
            }

            mapsConnector.addressLookup({ text: text }, function(data) {
                hashObj = that.createHashObject(data[0] + "|" + data[1], properties.f + ",Ascending");
                that.updateHash(hashObj, properties);
            }, function () {
                console.error("Error while getting '" + text + "' location");
            });
            $textBox.blur();
            if ($textBox.val() === "") {
                $textBox.val(text);
            }
        },
		/**
        * Call ["locationService.addressLookup"]{@link module:locationService.detectLocation}
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#detectLocation
        */
        detectLocation: function () {
            var properties = this.model.get("dataProperties"),
                $textBox = this.$el.find(".location-search-box-input"),
                sig = this.model.get("sig"),
                hash = queryModel.parseHashParameters(window.location.hash),
                param,
                hashObj = {},
                that = this;

            XA.component.locationService.detectLocation(
                function (location) {                    
                    hashObj = that.createHashObject(location[0] + "|" + location[1], properties.f + ",Ascending");
                    that.updateHash.call(that, hashObj, properties);
                    if ($textBox.length > 0) {
                        $textBox.attr("placeholder", properties.myLocationText);
                    }
                },
                function (errorMessage) {
                    //Do not update the hash in any way when the location is not available
                    console.log(errorMessage);
                }
            );
        },
		/**
        * Updates hash according to setup of component and selected values by user
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#updateHash
        */
        updateHash: function (params, properties) {
            var sig = this.model.get("sig"),
                signature,
                searchModels = typeof XA.component.search !== "undefined" ? XA.component.search.results.searchResultModels : [],
                $textBox = this.$el.find(".location-search-box-input.tt-input"),
                text = $textBox.length !== 0 ? $textBox.val() : this.$el.find(".location-search-box-input").val(),
                i, j;

            //Clears load more offset in each of search results with the same signature when location is changed
            //Now, this is needed to clear offset but should be handle in search service in the future
            for (i = 0; i < searchModels.length; i++) {
                for (j = 0; j < sig.length; j++) {
                    signature = sig[j];
                    if (searchModels[i].get("dataProperties").sig === signature) {
                        searchModels[i].set("loadMoreOffset", 0);
                    }
                }
            }

            if (text !== null && text !== "") {
                for (i = 0; i < sig.length; i++) {
                    signature = sig[i];
                    params[signature !== "" ? signature + "_a" : "a"] = text;
                }
            }

            queryModel.updateHash(params, properties.targetUrl);
            for (i = 0; i < sig.length; i++) {
                XA.component.search.vent.trigger("my-location-coordinates-changed", {
                    sig: sig[i],
                    coordinates: params[sig[i] !== "" ? sig[i] + "_g" : "g"].split("|")
                });
            }
        },
		/**
        * Updates hash according to setup of component and selected values by user
        * @memberof module:locationfilter.LocationFilterView
        * @alias module:locationfilter.LocationFilterView#updateHash
        * @param {String} g location
        * @param {String} o facet name and sort method
        * @returns {Object} hash as an object
        */
        createHashObject: function(g, o, a) {
            var sig = this.model.get("sig"),
                signature, 
                hashObj = {},
                i;

            for (i = 0; i < sig.length; i++) {
                signature = sig[i];
                hashObj[signature !== "" ? signature + "_g" : "g"] = g;
                hashObj[signature !== "" ? signature + "_o" : "o"] = o;
                if (typeof a !== "undefined") {
                    hashObj[signature !== "" ? signature + "_a" : "a"] = a;
                }
            }

            return hashObj;
        }
    });
   /**
    * Fills locationFilters variable with location filter components,
    * and loads script for proper map provider
    * @memberOf module:locationfilter
    * @alias module:locationfilter.init
    */
    api.init = function() {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;
        urlHelperModel = XA.component.search.url;

        var components = $(".location-filter:not(.initialized)");
        _.each(components, function(elem) {
            var $el = $(elem),
                properties = $el.data("properties");

            //Collects all found components - we will use them later to create views
            locationFilters.push($el);

            //Loads google or bing scripts in order to properly use address lookup functionality but only
            //when we are not in Location mode (in this mode we are taking location from the browser)
            if (!scriptsLoaded && properties.mode !== "Location") {
                mapsConnector.loadScript(properties.key, XA.component.search.locationfilter.scriptsLoaded);
            } else {
                initialize();
            }

            $el.addClass("initialized");
        });
        initialized = true;
    };
	/**
     * Calls ['initialize']{@link module:locationfilter.initialize} if it wasn`t 
     * loaded previously and marked as loaded
     * @memberOf module:locationfilter
     * @alias module:locationfilter.scriptsLoaded
    */
    api.scriptsLoaded = function() {
        if (!scriptsLoaded) {
            console.log("Maps api loaded");
            scriptsLoaded = true;
            initialize();
        }
    };

    return api;

}(jQuery, document));

XA.register("locationfilter", XA.component.search.locationfilter);
