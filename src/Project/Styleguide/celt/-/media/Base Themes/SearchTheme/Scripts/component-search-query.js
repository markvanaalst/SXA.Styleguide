/**
 * Provides api for manipulating query model
 * @module SearchQuery
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for work with query model
*/
XA.component.search.query = (function ($, document) {
    /**
    * @name module:SearchQuery.QueryModel
    * @constructor
    * @augments Backbone.Model
    */
    var QueryModel = Backbone.Model.extend(
        /** @lends module:SearchQuery.QueryModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                hash: "",
                hashObj: {}
            },
            /**
            * Checks if hash is not empty and calls 
            * ['createHashObj']{@link module:SearchQuery.QueryModel#createHashObj}
            * @memberof SearchQuery.QueryModel
            * @alias SearchQuery.QueryModel#initialize
            */
            initialize: function () {
                var inst = this,
                    hash = window.location.hash;

                if (hash.length) {
                    this.set({ hash: hash });
                    this.createHashObj();
                }
            },
            /**
            * Set hashObj into model
            * @memberof SearchQuery.QueryModel
            * @alias SearchQuery.QueryModel#createHashObj
            */
            createHashObj: function () {
                this.set({ hashObj: this.parseHashParameters(this.get("hash")) });
            },
            /**
            * Converts hash string into Object
            * @param {String} aUrl url for converting hash
            * @memberof SearchQuery.QueryModel
            * @alias SearchQuery.QueryModel#parseHashParameters
            * @returns {Object} hash parameters as an object
            */
            parseHashParameters: function (aUrl) {
                if (aUrl === null || aUrl === "") {
                    return {};
                }

                aUrl = aUrl || window.location.hash;
                var vars = {};
                var hashes = aUrl.slice(aUrl.indexOf('#') + 1).split('&');

                hashes = hashes.filter(function (x) {
                    return x !== "";
                });

                for (var i = 0; i < hashes.length; i++) {
                    var hash = hashes[i].split('='),
                        facetPart = hash[0].toLowerCase();
                    if (hash.length > 1) {
                        vars[decodeURIComponent(facetPart)] = decodeURIComponent(hash[1].replace("+", " "));
                    }
                    else {
                        vars[decodeURIComponent(facetPart)] = null;
                    }
                }
                return vars;
            },
            /**
           * updates hash parameters
           * @param {Object} newHash hash with new values
           * @param {String} targetUrl targetUrl from component propertie
           * @memberof SearchQuery.QueryModel
           * @alias SearchQuery.QueryModel#updateHash
           */
            updateHash: function (newHash, targetUrl) {
                var inst = this,
                    hashStr = "#",
                    hashObj = this.parseHashParameters(window.location.hash);

                _.each(newHash, function (item, key) {
                    if (item !== "") {
                        hashObj[key] = item;
                    } else {
                        delete hashObj[key];
                    }

                });

                if ((targetUrl === "#") || (targetUrl == undefined)) {
                    targetUrl = window.location.pathname;
                }

                var i = 0;
                _.each(hashObj, function (item, key) {
                    if (i > 0) {
                        hashStr += "&";
                    }
                    i++;
                    hashStr += key + "=" + encodeURIComponent(item).replace("%7C", "|");
                });

                Backbone.history.navigate(hashStr, { trigger: true });

                if (hashStr.length) {
                    this.set({ hash: hashStr });
                    this.createHashObj();
                }
            },
            /**
            * Checks if signature present in hash
            * @param {Object} hash hash object
            * @param {String} signature signature for searching in hash parameter
            * @memberof SearchQuery.QueryModel
            * @alias SearchQuery.QueryModel#updateHash
            * @returns {Boolean} True - if hash present, False if not
            */
            isSignaturePresentInHash: function (hash, signature) {
                var hashKeys = Object.keys(hash),
                    isSignatureFoundInHash = false;

                for (var len = hashKeys.length, i = 0; i < len; i++) {
                    if (hashKeys[i].startsWith(signature)) {
                        isSignatureFoundInHash = true;
                        break;
                    }
                }

                return isSignatureFoundInHash;
            }
        });

    return new QueryModel();

}(jQuery, document));