
/**
 * Service that provides wrappers for geolocation API
 * @module locationService
 * @param  {jQuery} $ Instance of jQuery
 * @return {Object} List of location service methods
 */
XA.component.locationService = (function ($, document) {

    "use strict";
    /**
    * This object stores all public api methods.
    * @type {Object.<Methods>}
    * @memberOf module:locationService
    */
    var api = {},
        getCurrentLocation,
        getLocationOptions,
        detectBrowser,
        gettingLocation = false,
        errorCallbacks = [],
        successCallbacks = [],
        reportError;

    /**
    * getCurrentLocation method call geolocation.getCurrentPosition API and call callback functions
    * @memberOf module:locationService
    * @param {Function} success function callback that calls in case of positive answer from geolocation API
    * @param {Function} error function callback that calls in case of error answer from geolocation API
    * @alias module:locationService.getCurrentLocation
    * @private
    */
    getCurrentLocation = function (success, error) {
        var i;

        errorCallbacks.push(error);
        successCallbacks.push(success);

        if (gettingLocation) {
            //process for getting current location started already, just subscribe for proper event and wait
            return;
        }
        gettingLocation = true;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    for (i = 0; i < successCallbacks.length; i++) {
                        successCallbacks[i]([position.coords.latitude, position.coords.longitude]);
                    }
                    gettingLocation = false;
                },
                function (error) {
                    reportError("Error while detecting user location");
                    gettingLocation = false;
                },
                getLocationOptions()
            );
        } else {
            reportError("Your browser does not support geolocation");
            gettingLocation = false;
        }
    };
    /**
    * getLocationOptions method return option for location search based on browser
    * @memberOf module:locationService
    * @alias module:locationService.getLocationOptions
    * @returns {Object} list of option for location search
    * @private
    */
    getLocationOptions = function () {
        var browser = detectBrowser();
        if (browser.indexOf("Chrome") !== -1) {
            return {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };
        } else {
            return {
                timeout: 1000,
                maximumAge: Infinity
            };
        }
    };
    /**
    * detectBrowser method detects browser name and version
    * @memberOf module:locationService
    * @alias module:locationService.detectBrowser
    * @returns {String} returns browser name and its version
    * @private
    */
    detectBrowser = function () {
        var ua = navigator.userAgent,
            tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return "IE " + (tem[1] || "");
        }
        if (M[1] === "Chrome") {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null) {
                return tem.slice(1).join(" ").replace("OPR", "Opera");
            }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) {
            M.splice(1, 1, tem[1]);
        }
        return M.join(" ");
    };
    /**
    * reportError method adds error message to errorCallbacks array
    * @memberOf module:locationService
    * @param {String} errorMessage text of appeared error
    * @alias module:locationService.reportError
    * @private
    */
    reportError = function (errorMessage) {
        var i;
        for (i = 0; i < errorCallbacks.length; i++) {
            if (typeof errorCallbacks[i] === "function") {
                errorCallbacks[i](errorMessage);
            }
        }
    };
    /**
    * detectLocation method call
    * ["getCurrentLocation"]{@link module:locationService.getCurrentLocation} method 
    * to get user location.
    * @memberOf module:locationService
    * @param {Function} success function callback that calls in case of positive answer from geolocation API
    * @param {Function} error function callback that calls in case of error answer from geolocation API
    * @alias module:locationService.detectLocation
    */
    api.detectLocation = function (success, error) {
        getCurrentLocation(success, error);
    };

    return api;

}(jQuery, document));

XA.register("locationService", XA.component.locationService);
