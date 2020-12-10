/**
 * Model for search services
 * @module SearchServiceModel
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {SearchServiceModel} instance of search service model
*/
XA.component.search.service = (function ($, document) {

    'use strict';

    var searchResultsModels = XA.component.search.results.searchResultModels,
        urlHelperModel = XA.component.search.url,
        queryModel = XA.component.search.query,
        queryParameters = XA.component.search.parameters,
        apiModel = XA.component.search.ajax,
        SearchServiceModel;
    /**
     * @name module:SearchServiceModel.SearchServiceModel
     * @constructor
     * @augments Backbone.Model
     */
    SearchServiceModel = Backbone.Model.extend(
        /** @lends module:SearchServiceModel.SearchServiceModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
            },
            /**
            * Watches for event 'orderChanged' and trigger
            * ['getData']{@link module:SearchServiceModel.SearchServiceModel#getData}
            * @listens module:XA.component.search.vent~event:orderChanged
            * @memberof module:SearchServiceModel.SearchServiceModel
            */
            initialize: function () {
                var that = this;
                XA.component.search.vent.on('orderChanged', function (data) {
                    that.getData(data);
                });
            },
            /**
            * If search result model created call
            * ['getSearchResultsData']{@link module:SearchServiceModel.SearchServiceModel#getSearchResultsData}
            * in other case call 
            * ['getEndpointAndSearch']{@link module:SearchServiceModel.SearchServiceModel#getEndpointAndSearch} 
            * @param {Object} overrideProps new properties fro overriding
            * @memberof module:SearchServiceModel.SearchServiceModel
            * @alias module:SearchServiceModel.SearchServiceModel#getData
            */
            getData: function (overrideProps) {
                if (searchResultsModels.length > 0) {
                    this.getSearchResultsData(overrideProps);
                } else {
                    this.getEndpointAndSearch(overrideProps);
                }
            },
            /**
            * Processes search result data
            * @param {Object} overrideProps properties for overriding
            * @memberof module:SearchServiceModel.SearchServiceModel
            * @alias module:SearchServiceModel.SearchServiceModel#getSearchResultsData
            */
            getSearchResultsData: function (overrideProps) {
                var hash = queryModel.parseHashParameters(window.location.hash),
                    that = this,
                    defaultSortOrder,
                    offsetSignature,
                    searchResultsDefaultPageSize,
                    searchResultsDefaultVariant,
                    signature,
                    mergedProps,
                    url;

                _.each(searchResultsModels, function (searchModel) {
                    signature = searchModel.get('dataProperties').sig !== null
                        ? encodeURIComponent(searchModel.get('dataProperties').sig)
                        : "";
                    offsetSignature = signature !== '' ? signature + "_e" : "e";

                    if (!searchModel.get('dataProperties').autoFireSearch) {
                        //If hash is not present or no criteria with search model signature is present in hash, then do not fire search
                        if (!hash || !queryModel.isSignaturePresentInHash(hash, signature)) {
                            return;
                        }
                    }

                    defaultSortOrder = searchModel.get('dataProperties').defaultSortOrder;
                    searchResultsDefaultPageSize = searchModel.get('dataProperties').p;
                    searchResultsDefaultVariant = searchModel.get('dataProperties').v;

                    //if we have singleRequestMode with signature, then we are getting data just for that signature
                    if (typeof overrideProps !== "undefined" &&
                        overrideProps.hasOwnProperty("singleRequestMode") &&
                        overrideProps["singleRequestMode"] != signature) {
                        return;
                    }

                    //if there is no page size param in the query, but we have page size component on the page, then take
                    //default page size or first (if default isn't set)
                    hash = that.getDefaultDefaultPageSize(signature, searchResultsDefaultPageSize, hash);

                    //in case of facet that filters items by language
                    //when someone is filtering by certain language, and removes that filter, then without
                    //this if statement, search results language parameter would not be considered - because l="" from hash object
                    //will override default language from dataProperties
                    if (hash.hasOwnProperty('l') && hash.l === '') {
                        hash.l = searchModel.get('dataProperties').l;
                    }

                    mergedProps = $.extend({}, searchModel.get('dataProperties'), hash);
                    mergedProps = $.extend(mergedProps, overrideProps);

                    if (mergedProps.hasOwnProperty('loadMore')) {
                        searchModel.set('loadMore', true);
                        delete mergedProps.loadMore;

                        var newOffset = searchModel.get('loadMoreOffset') + mergedProps.p;
                        searchModel.set('loadMoreOffset', newOffset);
                        mergedProps[offsetSignature] = newOffset;
                    }
                    else if (searchModel.get('loadMoreOffset')) { //if results reload is caused by variant change, loadMoreOffset should be considered in request, so after changing variant, the same number of results will be visible
                        if (mergedProps.p !== 0) {
                            mergedProps.p = mergedProps.p * (1 + searchModel.get('loadMoreOffset') / mergedProps.p);
                            mergedProps[offsetSignature] = 0;
                            searchModel.set('loadMoreOffset', 0);
                        }
                        delete mergedProps.variantChanged;
                    }

                    mergedProps = that.getSortOrder(signature, mergedProps, defaultSortOrder);
                    mergedProps = that.setVariant(signature, mergedProps, searchResultsDefaultVariant);

                    url = urlHelperModel.createSearchUrl(mergedProps, signature);
                    if (!url) {
                        return;
                    }

                    if (!searchModel.checkBlockingRequest()) {
                        searchModel.blockRequests(true);
                        XA.component.search.vent.trigger('results-loading', searchModel.cid);
                        apiModel.getData({
                            callback: function (data) {
                                data.Signature = data.Signature !== null ? data.Signature : '';
                                XA.component.search.vent.trigger('results-loaded', {
                                    dataCount: data.Count,
                                    data: data.Results,
                                    pageSize: data.Signature !== '' && mergedProps.hasOwnProperty(data.Signature + '_p') ? mergedProps[data.Signature + '_p'] : mergedProps.p,
                                    offset: data.Signature !== '' && mergedProps.hasOwnProperty(data.Signature + '_e') ? mergedProps[data.Signature + '_e'] : mergedProps.e,
                                    searchResultsSignature: data.Signature,
                                    loadMore: searchModel.get('loadMore')
                                });
                            },
                            url: url
                        });
                    }
                });
            },
            /**
            * Processes search result data. Call for apiModel.getData
            * @param {Object} overrideProps properties for overriding
            * @fires XA.component.search.vent#results-loaded
            * @listens module:XA.component.search.vent~event:orderChanged
            * @memberof module:SearchServiceModel.SearchServiceModel
            * @alias module:SearchServiceModel.SearchServiceModel#getSearchData
            */
            getSearchData: function (overrideProps) {
                var hash = queryModel.parseHashParameters(window.location.hash),
                    mergedProps = $.extend({}, hash, mergedProps, overrideProps),
                    signatures = [],
                    firstSortingOption,
                    url,
                    i;


                mergedProps = this.getDefaultDefaultPageSize("", 0, mergedProps);


                //if there is no sort param in the query, but we have sort results component on the page, then take first sorting option
                if (!mergedProps.hasOwnProperty('o') && typeof XA.component.search.sort !== 'undefined') {
                    firstSortingOption = XA.component.search.sort.getFirstSortingOption();
                    if (firstSortingOption !== -1) {
                        mergedProps.o = firstSortingOption;
                    }
                }

                //currently we are taking endpoint from Map component (atm it's only which can handle showing of search results)
                mergedProps.endpoint = XA.component.map.getSearchEndpoint();
                //the same with signature
                signatures = XA.component.map.getSignatures();

                for (i = 0; i < signatures.length; i++) {
                    mergedProps.sig = signatures[i];
                    url = urlHelperModel.createSearchUrl(mergedProps, signatures[i]);

                    if (!url) {
                        return;
                    }

                    apiModel.getData({
                        callback: function (data) {
                            data.Signature = data.Signature !== null ? data.Signature : '';
                            XA.component.search.vent.trigger('results-loaded', {
                                dataCount: data.Count,
                                data: data.Results,
                                pageSize: mergedProps.p,
                                offset: 0,
                                searchResultsSignature: data.Signature
                            });
                        },
                        url: url
                    });
                }
            },
            /**
           * Checks if map component exists and getSearchEndpoint returns not undefined value. If yes
           * call ["getSearchData"]{@link module:SearchServiceModel.SearchServiceModel#getSearchData}
           * @memberof module:SearchServiceModel.SearchServiceModel
           * @alias module:SearchServiceModel.SearchServiceModel#getEndpointAndSearch
           */
            getEndpointAndSearch: function () {
                if (XA.component.map && typeof (XA.component.map.getSearchEndpoint()) !== 'undefined') {
                    this.getSearchData();
                } else {
                    setTimeout(this.getEndpointAndSearch.bind(this), 100);
                }
            },
            /**
            * Sorts search result due to selected properties
            * @param {String} signature component signature
            * @param {Object} mergedProps 
            * @param {String} searchResultsDefaultSortOrder default sorting order
            * @memberof module:SearchServiceModel.SearchServiceModel
            * @alias module:SearchServiceModel.SearchServiceModel#getSortOrder
            * @returns {Object} merged properties
            */
            getSortOrder: function (signature, mergedProps, searchResultsDefaultSortOrder) {
                var firstSortingOption = XA.component.search.sort.getFirstSortingOption(signature),
                    paramName = signature !== '' ? signature + '_o' : 'o',
                    obj = {},
                    defaultSortOrder = "",
                    defaultSigned = {};


                if (firstSortingOption !== -1) {
                    defaultSortOrder = firstSortingOption;
                } else if (searchResultsDefaultSortOrder !== "") {
                    defaultSortOrder = searchResultsDefaultSortOrder;
                }

                if (!mergedProps.hasOwnProperty(paramName) && defaultSortOrder !== "") {
                    delete mergedProps.defaultSortOrder;
                    delete mergedProps.o;

                    mergedProps[paramName] = defaultSortOrder;
                    obj[paramName] = defaultSortOrder;
                }
                defaultSigned[paramName] = defaultSortOrder;
                queryParameters.registerDefault(defaultSigned);

                return mergedProps;
            },

            /**
            * Sets default page size into hash
            * @param {String} signature component signature
            * @param {Number} searchResultsDefaultPageSize  default page size
            * @param {Object} hash hash represented as an object
            * @memberof module:SearchServiceModel.SearchServiceModel
            * @alias module:SearchServiceModel.SearchServiceModel#getDefaultDefaultPageSize
            * @returns {Object} hash object
            */
            getDefaultDefaultPageSize: function (signature, searchResultsDefaultPageSize, hash) {
                var defaultPageSizes = XA.component.search.pageSize.getDefaultPageSizes(),
                    paramName = signature !== "" ? signature + "_p" : "p",
                    pageSizes;

                if (!hash.hasOwnProperty(paramName) && typeof XA.component.search.pageSize !== 'undefined') {
                    if (defaultPageSizes !== -1) {
                        pageSizes = defaultPageSizes.filter(function (x) {
                            return x.signatures.indexOf(signature) !== -1;
                        });
                        if (pageSizes.length > 0) {
                            hash[paramName] = pageSizes[0].defaultPageSize;
                        }
                    }
                }

                if (!hash.hasOwnProperty(paramName) && searchResultsDefaultPageSize != 0) {
                    hash[paramName] = searchResultsDefaultPageSize;
                }

                var defaultParam = {};
                defaultParam[paramName] = searchResultsDefaultPageSize;
                queryParameters.registerDefault(defaultParam);
                return hash;
            },
            /**
            * Sets variant of view search result based on variant selector component
            * @param {String} signature component signature
            * @param {Number} searchResultsDefaultPageSize  default page size
            * @param {Object} hash hash represented as an object
            * @memberof module:SearchServiceModel.SearchServiceModel
            * @alias module:SearchServiceModel.SearchServiceModel#setVariant
            * @returns {Object} hash object
            */
            setVariant: function (signature, mergedProps, searchResultsDefaultVariant) {
                var variantMappings = XA.component.search.variantFilter.getVariantMappings(signature),
                    paramName = signature !== "" ? signature + "_v" : "v",
                    variantIndex;

                if (signature === "" && $.isEmptyObject(variantMappings)) {
                    //there is no signature, and no variant selector on the page, therefore, do nothing - mergedPropes should have v param
                } else if (signature === "" && mergedProps.hasOwnProperty(paramName) && variantMappings.hasOwnProperty(mergedProps[paramName])) {
                    //there is no signature, but there is variant selector on the page, and it was clicked
                    mergedProps[paramName] = variantMappings[mergedProps[paramName]].id;
                } else if (signature === "" && variantMappings.hasOwnProperty(0)) {
                    //there is no signature, but there is variant selector on the page, therefore take its first variant
                    mergedProps[paramName] = variantMappings[0].id;
                } else {
                    delete mergedProps.v;
                    if (mergedProps.hasOwnProperty(paramName)) {
                        //variant switcher was clicked
                        mergedProps[paramName] = variantMappings[mergedProps[paramName]].id;
                    } else {
                        //if there is variant selector on the page, take first variant form the component, otherwise use search results default variant
                        if (variantMappings.hasOwnProperty(0)) {
                            mergedProps[paramName] = variantMappings[0].id;
                        } else {
                            mergedProps[paramName] = searchResultsDefaultVariant;
                        }
                    }
                }

                var defaultVariant = {};
                defaultVariant[paramName] = 0;
                queryParameters.registerDefault(defaultVariant);

                return mergedProps;
            }
        });

    return new SearchServiceModel();

}(jQuery, document));
