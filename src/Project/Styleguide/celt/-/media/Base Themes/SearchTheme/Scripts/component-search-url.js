
/**
 * Creates instance of urlHelperModel
 * @module searchUrl
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with search url
*/
XA.component.search.url = (function ($, document) {
    /**
     * 
     * @param {String} data 
     * @returns {String}
     */
    var clearIdData = function (data) {
        data = data + "";
        var parts = data.split(','), urlData = [], details;
        _.each(parts, function (part) {
            details = part.split('|');
            if (_.contains(part, '|') && details.length === 3) {
                urlData.push(details[1] + '|' + details[2]);
            } else {
                urlData.push(part);
            }
        });
        return urlData.join(',');
    };

    /**
    * @name module:searchUrl.UrlHelperModel
    * @constructor
    * @augments Backbone.Model
    */
    var UrlHelperModel = Backbone.Model.extend(
        /** @lends module:searchUrl.UrlHelperModel.prototype **/
        {
            /**
             * creates url for search components
             * @param {Object} dataProp component properties stored in data attribute
             * @param {String} signature component signature
             * @returns {String} created url
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#createSearchUrl
             */
            createSearchUrl: function (dataProp, signature) {
                var url = this.setEndpoint(dataProp.endpoint);

                url += (dataProp.l) ? "&l=" + dataProp.l : "";  //language
                url += (dataProp.s) ? "&s=" + dataProp.s : "";  //scope
                url += (dataProp.itemid) ? "&itemid=" + dataProp.itemid : "";
                url += this.getFacetParams(dataProp, signature);
                url = this.fixUrl(url);

                return url;
            },
            /**
             * creates url for search components for redirect
             * @param {String} redirectUrl target url
             * @param {Object} query query for redirect
             * @param {String} targetSignature target component signature
             * @param {String} signature component signature
             * @returns {String} created url
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#createSearchUrl
             */
            createRedirectSearchUrl: function (redirectUrl, query, signature, targetSignature) {
                var originalHash = XA.component.search.query.get("hashObj"),
                    updatedQuery = {},
                    hash = {},
                    index = 0,
                    clearParam,
                    paramSignature,
                    param,
                    url;

                if (signature !== "") {
                    //if signature is provided, then filter only params with the same signature
                    for (param in originalHash) {
                        clearParam = param.substring(param.indexOf('_') + 1);
                        paramSignature = param.substr(0, param.indexOf('_'));
                        if (paramSignature === signature) {
                            hash[param] = originalHash[param];
                        }
                    }
                } else {
                    hash = originalHash;
                }

                query = $.extend({}, hash, query);

                if (targetSignature !== "") {
                    //if target signature is provided, replace signature with target signature in all params
                    for (param in query) {
                        clearParam = param.substring(param.indexOf('_') + 1);
                        paramSignature = param.substr(0, param.indexOf('_'));
                        if (paramSignature === signature) {
                            updatedQuery[targetSignature + "_" + clearParam] = query[param];
                        } else if (paramSignature === targetSignature) {
                            updatedQuery[param] = query[param];
                        }
                    }
                } else {
                    updatedQuery = query;
                }

                url = this.setEndpoint(redirectUrl + "#");

                _.each(updatedQuery, function (item, key) {
                    url += (index === 0 ? "" : "&") + key + "=" + item;
                    index++;
                });

                return url;
            },
            /**
             * creates predictive url for search components
             * @param {String} endpoint target url
             * @param {Object} query query for redirect
             * @param {String} dataProp target component signature
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#createPredictiveSearchUrl
             * @returns {String} url predictive url
             */
            createPredictiveSearchUrl: function (endpoint, dataProp, query) {
                var url = this.setEndpoint(endpoint);

                url += "?q=" + encodeURIComponent(query);
                url += "&v=" + dataProp.v;
                url += "&p=" + dataProp.p;
                url += (dataProp.l) ? "&l=" + dataProp.l : "";
                url += (dataProp.s) ? "&s=" + dataProp.s : "";
                url += (dataProp.itemid) ? "&itemid=" + dataProp.itemid : "";

                return url;
            },
            /**
             * creates facet url for search components
             * @param {Object} query query for redirect
             * @param {String} dataProp target component signature
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#createFacetUrl
             * @returns {String} url for facets
             */
            createFacetUrl: function (dataProp, query) {
                var url = this.setEndpoint(dataProp.endpoint);

                url += "?f=" + dataProp.f.toLowerCase();
                url += (dataProp.s) ? "&s=" + dataProp.s : "";
                url += (dataProp.l) ? "&l=" + dataProp.l : "";
                url += (query) ? "&q=" + encodeURIComponent(query) : "";

                url += this.getFacetParams(dataProp);

                return url;
            },
            /**
             * creates facet url for search components when enabled multifacet search
             * @param {String} dataProp target component signature
             * @param {Array} facetList list of existing facets
             * @param {String} sig component signature
             * @param {String} itemId component id
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#createMultiFacetUrl
             * @returns {String} url for multi facet search
             */
            createMultiFacetUrl: function (dataProp, facetList, sig, itemId) {
                var url = this.setEndpoint(dataProp.endpoint);

                url += "?f=" + facetList.join(',').toLowerCase();
                url += (dataProp.s) ? "&s=" + dataProp.s : "";
                url += (dataProp.l) ? "&l=" + dataProp.l : "";
                url += itemId ? "&itemid=" + itemId : "";

                url += this.getFacetParams(dataProp, sig);

                url += "&sig=" + encodeURIComponent(sig);

                return url;
            },
            /**
             * Clears hash parameters
             * @param {String} dataProperties component properties
             * @param {Array} properties 
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#clearUrlParams
             * @returns {Array} array with cleared properties
             */
            clearUrlParams: function (dataProperties, properties) {
                var facetName = dataProperties.f.toLowerCase(),
                    hash = {};

                delete properties[facetName];
                delete hash[facetName];
                XA.component.search.query.updateHash(hash);

                return properties;
            },
            /**
             * Returns url with facet parameters
             * @param {Object} dataProp component properties
             * @param {String} searchResultsSignature signature of search result component
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#getFacetParams
             * @returns {String} url with facet parameters
             */
            getFacetParams: function (dataProp, searchResultsSignature) {
                var url = "",
                    clearFacetName,
                    facetSignature,
                    skipParams = ['endpoint', 'l', 's', 'e', 'f', 'sig', 'itemid'], //params which will be skipped while adding facet params
                    specialParams = ['g', 'o', 'q', 'p', 'e', 'v']; //params which are not facets but can have signature


                if (dataProp.hasOwnProperty("sig")) {
                    url += "&sig=" + encodeURIComponent(dataProp["sig"]);
                }

                for (facet in dataProp) {
                    if (skipParams.indexOf(facet) === -1 && facet && dataProp[facet]) {
                        clearFacetName = facet.substring(facet.indexOf('_') + 1);
                        facetSignature = facet.substr(0, facet.indexOf('_'));
                        if (searchResultsSignature === facetSignature && specialParams.indexOf(clearFacetName) === -1) {
                            url += "&" + clearFacetName + "=" + encodeURIComponent(clearIdData(dataProp[facet]));
                        }
                    }
                }

                //gets params that are not facets but can have signature
                url = this.getSpecialParams(dataProp, searchResultsSignature, specialParams, url);

                return url;
            },
            /**
             * Returns url with special parameters
             * @param {Object} dataProp component properties
             * @param {String} searchResultsSignature signature of search result component
             * @param {String} specialParams special parameters
             * @param {String} url url for special parameters
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#getSpecialParams
             * @returns {String} url with special parameters
             */
            getSpecialParams: function (dataProp, searchResultsSignature, specialParams, url) {
                var param,
                    paramValue,
                    clearParamName,
                    paramSignature;

                for (param in dataProp) {
                    clearParamName = param.substring(param.indexOf('_') + 1);
                    paramSignature = param.substr(0, param.indexOf('_'));
                    if (specialParams.indexOf(clearParamName) !== -1) {
                        paramValue = typeof dataProp[param] !== "undefined" ? dataProp[param] : "";
                        if (searchResultsSignature === paramSignature) {
                            url += "&" + clearParamName + "=" + encodeURIComponent(paramValue);
                        }
                    }
                }

                return url;
            },
            /**
             * Returns url POI content
             * @param {Object} dataProp component properties
             * @param {String} poiId POI ID
             * @param {String} poiVariantId POI variant ID
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#getSpecialParams
             * @returns {String} url with poi parameters
             */
            createGetPoiContentUrl: function (dataProp, poiId, poiVariantId) {
                var url = this.setEndpoint(dataProp.endpoint);
                url += "/" + poiVariantId + "/" + poiId;
                return url;
            },
            /**
             * Returns url with geo POI content
             * @param {Object} dataProp component properties
             * @param {String} poiId POI ID
             * @param {String} poiVariantId POI variant ID
             * @param {String} coordinates POI coordinates
             * @param {String} units unit of coordinates
             * @param {String} itemId context item ID
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#createGetGeoPoiContentUrl
             * @returns {String} url with geo poi content parameters
             */
            createGetGeoPoiContentUrl: function (dataProp, poiId, poiVariantId, coordinates, units, itemId) {
                var url = this.setEndpoint(dataProp.endpoint);
                url += "/" + poiVariantId + "/" + poiId + "/" + coordinates + "/" + units + "/" + itemId;
                return url;
            },
            /**
             * Returns url with geo POI content
             * @param {string} url url for site
             * @param {String} siteName site name
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#createSiteUrl
             * @returns {String} site url
             */
            createSiteUrl: function (url, siteName) {
                if (typeof siteName !== "undefined" && siteName !== null && siteName !== "") {
                    return url + "&sc_site=" + siteName;
                }
                return url;
            },
            /**
             * Returns url with endpoint
             * @param {string} endpoint endpoint parameter from component properties
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#setEndpoint
             * @returns {String} url with endpoint
             */
            setEndpoint: function (endpoint) {
                var url = window.location.origin;

                if (endpoint.indexOf(url) !== -1) {
                    return endpoint;
                }

                return url += endpoint;
            },
            /**
             * Fixes url with special characters
             * @param {string} url url string for fixing
             * @memberof searchUrl.UrlHelperModel
             * @alias searchUrl.UrlHelperModel#fixUrl
             * @returns {String} url with endpoint
             */
            fixUrl: function (url) {
                var index;

                url = url.replace(/[?]/g, "&");
                index = url.indexOf("&");
                url = url.substr(0, index) + "?" + url.substr(index + 1)

                return url;
            }
        });

    var urlHelperModel = new UrlHelperModel();

    return urlHelperModel;

}(jQuery, document));
