/**
 * Component Flash
 * @module Flash
 * @param  {jQuery} $ Instance of jQuery
 * @return {Object} List of flash methods
 */
XA.component.flash = (function($) {
    /**
     * This object stores all public api methods
     * @type {Object.<Methods>}
     * @memberOf module:Flash
     * */
    var api = {};
    /**
     * Sets size of embeded element
     * @memberOf module:Flash
     * @method
     * @param {jQuery.<Element>} object Embed element
     * @private
     */
    function setSize(object) {
        var oldHeight = object.attr("height");
        var oldWidth = object.attr("width");
        var newWidth = object.width();
        var newHeight = (oldHeight * newWidth) / oldWidth;
        object.height(newHeight);
    }
    /**
     * Initialize flash component
     * @memberOf module:Flash
     * @method
     * @param {jQuery} component Root DOM element of flash component wrapped by jQuery
     * @param {Object} properties Properties set in data attribute
     * @private
     */
    function initFlash(component, properties) {
        var content = component.find(".component-content > div");
        content.flash(properties);
    }
    /**
     * Calls ["setSize"]{@link module:Flash.setSize} method
     * and binds it to resize event
     * @memberOf module:Flash
     * @method
     * @param {jQuery} component Root DOM element of flash component wrapped by jQuery
     * @param {Object} prop Properties set in data attribute
     * @private
     */
    function attachEvents(component) {
        $(document).ready(function() {
            var object = component.find("embed");
            object.css("width", "100%");
            setSize(object);

            $(window).resize(function() {
                setSize(object);
            });
        });
    }

    /**
     * Call
     * ["initFlash"]{@link  module:Flash.initFlash} and
     * ["attachEvents"]{@link  module:Flash.attachEvents}
     * methods
     * @memberOf module:Flash
     * @method
     * @param {jQuery} component Root DOM element of flash component wrapped by jQuery
     * @param {Object} prop Properties set in data attribute
     *  of flash component
     * @alias module:Flash.initInstance
     */
    api.initInstance = function(component, prop) {
        initFlash(component, prop);
        attachEvents(component);
    };
    /**
     * Finds all not-initialized 
     * Flash components and runs in a loop 
     * Flash's 
     * ["initInstance"]{@link module:Flash.initInstance}
     * method.
     * @memberOf module:Flash
     * @alias module:Flash.init
     */
    api.init = function() {
        var flash = $(".flash:not(.initialized)");
        if (flash.length > 0) {
            flash.each(function() {
                var properties = $(this).data("properties");
                api.initInstance($(this), properties);
                $(this).addClass("initialized");
            });
        }
    };

    return api;
})(jQuery, document);

XA.register("flash", XA.component.flash);
