/**
 * Component Container
 * @module Container
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Underscore} _ Instance of Underscore
 * @return {Object} List of Container methods
 */
XA.component.parallax = (function($, _) {
    /**
     * This object stores all public api methods
     * @type {Object.<Methods>}
     * @memberOf module:Container
     * */
    var api = {};
    /**
     * Check if document size is less than 768px
     * @memberOf module:Container
     * @method
     * @private
     * @return {boolean} True|False
     */
    function checkMobile() {
        return $(window).width() < 768;
    }
     /**
     * Make parralax effect for container
     * @memberOf module:Container
     * @method
     * @param {jQuery.<Element>} $el 
     * @private
     */
    function makeParallax($el) {
        var $bg = $el.children(".component-content"),
            vHeight = $(window).height(),
            elOffset = $bg[0].offsetTop,
            elHeight = $bg[0].offsetHeight,
            isMobile = checkMobile();

        function parallax() {
            if (isMobile) {
                return false;
            }

            var offset = $(window).scrollTop();

            if ((elOffset <= offset + vHeight) && (elOffset + elHeight >= offset)) {
                $bg.css("background-position", "50% " + Math.round((elOffset - offset) * 3 / 8) + "px");
            }
        }

        parallax();

        $(document).on("scroll", _.throttle(parallax, 10));
        $(window).on("resize", _.throttle(function() {
            isMobile = checkMobile();
            isMobile ? $bg.css("background-position", "50% 0") : parallax();
        }, 150));
    }
    /**
     * Call
     * ["makeParallax"]{@link  module:Container.makeParallax} method
     * @memberOf module:Container
     * @method
     * @param {jQuery} component Root DOM element of Container component wrapped by jQuery
     * of container component
     * @alias module:Container.initInstance
     */
    api.initInstance=function(component) {
        makeParallax(component);
    }
    /**
     * Finds all not-initialized Container
     * components and runs each container in a loop.
     * ["initInstance"]{@link module:Container.initInstance}
     * method.
     * @memberOf module:Container
     * @alias module:Container.init
     */
    api.init = function() {
        $('.parallax-background:not(.initialized)').each(function() {
            api.initInstance($(this));
            $(this).addClass('initialized');
        });
    };

    return api;

})(jQuery, _);

XA.register('parallax-background', XA.component.parallax);