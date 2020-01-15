/**
 * Provides methods for working searches using Ajax
 * @module ajax
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {ApiModel} list of Api methods for Search Ajax functionality
*/
XA.component.search.ajax = (function ($, document) {
    var ApiModel, getPrameterByName;

    /**
    * @name module:ajax.ApiModel
    * @constructor
    * @augments Backbone.Model
    */
    ApiModel = Backbone.Model.extend(
        /** @lends module:ajax.ApiModel.prototype **/

        {
            /**
            * Makes ajax request and calls callback on success
            * @method
            * @param {Object} properties properties of ajax call and callback
            */
            getData: function (properties) {
                var siteName = this.getPrameterByName("sc_site"),
                    url = typeof properties.excludeSiteName !== "undefined" && properties.excludeSiteName
                        ? properties.url
                        : XA.component.search.url.createSiteUrl(properties.url, siteName);
                Backbone.ajax({
                    dataType: "json",
                    url: url,
                    success: function (data) {
                        properties.callback(data);
                    }
                });
            },
            /**
             * Gets value of parameter from url
             * @method
             * @param {String} name name of parameter that should be taken from url
             * @param {String} url link from which parameter should be taken
             * @returns {string} parameter value
             */
            getPrameterByName: function (name, url) {
                if (!url) url = window.location.href;
                name = name.replace(/[\[\]]/g, "\\$&");
                var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                    results = regex.exec(url);
                if (!results) return null;
                if (!results[2]) return '';
                return decodeURIComponent(results[2].replace(/\+/g, " "));
            }
        });

    return new ApiModel();

}(jQuery, document));