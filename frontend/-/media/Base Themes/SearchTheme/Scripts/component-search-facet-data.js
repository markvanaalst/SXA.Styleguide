/**
 * Includes functionality for manipulating facet data
 * @module FacetData
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {FacetDataModel} FacetDataModel api
*/
XA.component.search.facet.data = (function ($, document) {
    /**
      * @name module:FacetData.FacetDataModel
      * @constructor
      * @augments Backbone.Model
      */
    var FacetDataModel = Backbone.Model.extend(
        /** @lends module:FacetData.FacetDataModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
            },
            /**
           * @memberof module:FacetData.FacetDataModel.prototype
           */
            initialize: function () {
            },
            /**
            * Gets facet data by calling 
            * ["search.ajax.getData"]{@link module:ajax.ApiModel#getData} method
            * @memberof module:FacetData.FacetDataModel
            * @alias module:FacetData.FacetDataModel#getInitialFacetData
            */
            getInitialFacetData: function () {
                var facetRequestData = this.getFacetRequestData(),
                    data = facetRequestData.data,
                    facetNames = [],
                    language;

                for (var signature in data) {
                    if (data.hasOwnProperty(signature)) {
                        //here we don't have any params after hash in the url, we are getting all data at once
                        facetNames = facetNames.concat(data[signature].normalFiltering);
                        facetNames = facetNames.concat(data[signature].partialFiltering);

                        //get language settings form Search Results rendering
                        language = this.getSearchResultsLanguage(signature);

                        if (facetNames.length > 0) {
                            XA.component.search.ajax.getData({
                                callback: function (data) {
                                    XA.component.search.vent.trigger("facet-data-loaded", data);
                                },
                                url: XA.component.search.url.createMultiFacetUrl({
                                    endpoint: facetRequestData.endpoint,
                                    s: facetRequestData.s,
                                    l: language
                                }, facetNames, signature)
                            });
                        }
                    }
                }
            },
            /**
            * Filter facet data
            * ["search.ajax.getData"]{@link module:ajax.ApiModel#getData} method and 
            * triggered event '' on callback with sending response from server
            * @memberof module:FacetData.FacetDataModel
            * @param {Object} hashObj Object with hashes from url
            * @fires XA.component.search.vent#facet-data-filtered
            * @fires XA.component.search.vent#facet-data-partial-filtered
            * @alias module:FacetData.FacetDataModel#filterFacetData
            */
            filterFacetData: function (hashObj) {
                var facetRequestData = this.getFacetRequestData(hashObj),
                    data = facetRequestData.data,
                    requestData,
                    language,
                    scope,
                    searchModel,
                    itemId;

                for (var signature in data) {
                    if (data.hasOwnProperty(signature)) {
                        //Gets language settings form Search Results rendering
                        language = this.getSearchResultsLanguage(signature);
                        //Gets scope settings form Search Results rendering
                        scope = this.getSearchResultsScope(signature);

                        searchModel = this.getSearchResultsModelBySignature(signature),
                            itemId = searchModel.get('dataProperties').itemid;

                        //Makes one request for data for facet controls with all hash params
                        if (data[signature].normalFiltering.length > 0) {
                            requestData = $.extend({ endpoint: facetRequestData.endpoint, s: scope, l: language }, hashObj);
                            XA.component.search.ajax.getData({
                                callback: function (data) {
                                    XA.component.search.vent.trigger("facet-data-filtered", data);
                                },
                                url: XA.component.search.url.createMultiFacetUrl(requestData, data[signature].normalFiltering, signature, itemId)
                            });
                        }

                        //Makes as many requests as many controls that require partial filtering we have
                        //We will take all params from url hash without control facet name so controls won't collapse
                        if (data[signature].partialFiltering.length > 0) {
                            _.each(data[signature].partialFiltering, function (facetName) {
                                var hash = $.extend({}, hashObj);

                                //Ensures removal of facet (despite lower case or not) from hash object in case of partial filtering  
                                delete hash[signature !== "" ? signature + "_" + facetName : facetName];
                                delete hash[signature !== "" ? signature + "_" + facetName.toLowerCase() : facetName.toLowerCase()];

                                requestData = $.extend({ endpoint: facetRequestData.endpoint, s: scope, l: language }, hash);

                                XA.component.search.ajax.getData({
                                    callback: function (data) {
                                        XA.component.search.vent.trigger("facet-data-partial-filtered", data);
                                    },
                                    url: XA.component.search.url.createMultiFacetUrl(requestData, [facetName], signature, itemId)
                                });
                            });
                        }
                    }
                }
            },

            /**
            * Gets facet request data from server by calling 
            * getFacetDataRequestInfo method in a loop for all facet components
            * and stores them in returned object
            * @memberof module:FacetData.FacetDataModel
            * @param {Object} hashObj Object with hashes from url
            * @returns {facetRequestData} request data from each facet component stored in object
            * @alias module:FacetData.FacetDataModel#getFacetRequestData
            */
            getFacetRequestData: function (hashObj) {
                var that = this, data = [], requestData = {}, facetControl, control, endpoint, facetName;

                for (facetControl in XA.component.search.facet) {
                    control = XA.component.search.facet[facetControl];
                    if (typeof (control.getFacetDataRequestInfo) === "function") {
                        data = control.getFacetDataRequestInfo();
                        _.each(data, function (controlData) {
                            facetName = controlData.signature !== "" ? controlData.signature + "_" + controlData.facetName : controlData.facetName;

                            if (!requestData.hasOwnProperty(controlData.signature)) {
                                that.initRequestObject(requestData, controlData);
                            }

                            if (!controlData.filterWithoutMe || (hashObj !== undefined && !hashObj.hasOwnProperty(facetName) && !hashObj.hasOwnProperty(facetName.toLowerCase()))) {
                                //If the control does not require partial filtering or control facet name is not in the hash, add it to "one request" list.
                                requestData[controlData.signature].normalFiltering.push(controlData.facetName);
                                endpoint = controlData.endpoint;
                            } else {
                                requestData[controlData.signature].partialFiltering.push(controlData.facetName);
                                endpoint = controlData.endpoint;
                            }
                        });
                    }
                }
                return {
                    endpoint: endpoint,
                    data: requestData
                };
            },
            /**
            * On initialization fullfils requestData argument with
            * right structure
            * @memberof module:FacetData.FacetDataModel
            * @param {Object} requestData Object with request data
            * @param {Object} controlData Object data taked from facet
            * @alias module:FacetData.FacetDataModel#initRequestObject
            */
            initRequestObject: function (requestData, controlData) {
                requestData[controlData.signature] = {};
                requestData[controlData.signature].normalFiltering = [];
                requestData[controlData.signature].partialFiltering = [];
            },
            /**
            * Returns language of search result
            * @memberof module:FacetData.FacetDataModel
            * @param {String} signature - signature of search result
            * @alias module:FacetData.FacetDataModel#getSearchResultsLanguage
            * @returns {String} search result language
            */
            getSearchResultsLanguage: function (signature) {
                var searchResultsModel = this.getSearchResultsModelBySignature(signature);
                if (typeof searchResultsModel !== "undefined") {
                    return searchResultsModel.get("dataProperties").l;
                }
                return "";
            },
            /**
            * Returns search result scope
            * @memberof module:FacetData.FacetDataModel
            * @param {String} signature - signature of search result
            * @alias module:FacetData.FacetDataModel#getSearchResultsScope
            * @returns {String} search result scope
            */
            getSearchResultsScope: function (signature) {
                var searchResultsModel = this.getSearchResultsModelBySignature(signature);
                if (typeof searchResultsModel !== "undefined") {
                    return searchResultsModel.get("dataProperties").s;
                }
                return "";
            },
            /**
            * Returns search result model by signature
            * @memberof module:FacetData.FacetDataModel
            * @param {String} signature - signature of search result
            * @alias module:FacetData.FacetDataModel#getSearchResultsModelBySignature
            * @returns {BackboneModel} search result model
            */
            getSearchResultsModelBySignature: function (signature) {
                var searchResultModels = XA.component.search.results.searchResultModels,
                    model = searchResultModels.filter(function (element) {
                        return element.get("dataProperties").sig === signature;
                    })[0];

                return model;
            }
        });

    return new FacetDataModel();

}(jQuery, document));