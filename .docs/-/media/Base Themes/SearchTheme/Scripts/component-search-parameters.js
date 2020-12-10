/**
 * Provides api for manipulating with hashes
 * @module searchParameters
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for work with hash
*/
XA.component.search.parameters = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchParameters
    */
    var api = {},
        queryModel,
        searchResultModels,
        initialized = false,
        defaults = {};
    /**
    * Registers modules that search parameter module needs
    * @memberOf module:searchParameters
    * @alias module:searchParameters.init
    */

    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;
        searchResultModels = XA.component.search.results.searchResultModels;
        initialized = true;
    };
    /**
    * Fills default variable with hashes and their values
    * @param {Object} hash Hash represented as an object
    * @memberOf module:searchParameters
    * @alias module:searchParameters.registerDefault
    */
    api.registerDefault = function (hash) {
        _.each(hash, function (item, key) {
            defaults[key] = hash[key].toString();
        });
    };
    /**
    * Updates hash with new one provided as an parameter
    * @param {Object} newHash Hash represented as an object
    * @memberOf module:searchParameters
    * @alias module:searchParameters.updateHash
    */
    api.updateHash = function (newHash) {
        _.each(newHash, function (item, key) {
            if (defaults[key] === newHash[key].toString()) {
                newHash[key] = "";
            }
        });

        queryModel.updateHash(newHash);
    }

    return api;

}(jQuery, document));

XA.register('searchParameters', XA.component.search.parameters);