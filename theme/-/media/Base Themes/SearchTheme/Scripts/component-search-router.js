/**
 * Search router based on backbone router
 * @module searchRouter
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with backbone routing
*/
XA.component.search.router = (function ($, document) {

    "use strict";
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchRouter
    */
    var api = {},
        queryModel,
        initialized = false,
        lastHashObj,
        Router;
    /**
     * @name module:searchRouter.Router
     * @constructor
     * @augments Backbone.Model
     */
    Router = Backbone.Router.extend(
        /** @lends module:searchRouter.Router.prototype **/
        {
            routes: {
                "*params": "checkUrl"
            },
            /**
             * check url for changes in hash
             * @fires XA.component.search.vent#hashChanged
             * @param {Object} params parameter from url
             */
            checkUrl: function (params) {
                var hashObj = queryModel.parseHashParameters(window.location.hash);

                XA.component.search.service.getData();

                if (!hashObj) {
                    XA.component.search.facet.data.getInitialFacetData();
                    XA.component.search.vent.trigger("hashChanged", hashObj);
                } else {
                    if (JSON.stringify(hashObj) !== JSON.stringify(lastHashObj) ) {
                        XA.component.search.facet.data.filterFacetData(hashObj);
                        lastHashObj = hashObj;
                        XA.component.search.vent.trigger("hashChanged", hashObj);
                    }
                }                
            }
        });
    /**
    * Creates instance of Backbone Router and start
    * backbone history
    * @memberOf module:searchRouter
    * @alias module:searchRouter.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;

        var router = new Router();

        if (!Backbone.History.started) {
            Backbone.history.start();
        }

        initialized = true;
    };

    return api;

}(jQuery, document));

XA.register('searchRouter', XA.component.search.router);
