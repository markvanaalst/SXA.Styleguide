/**
 * Component equalHeight
 * makes the same height of content that 'equal' class or for flip sides
 * @module equalHeight
 * @param  {jQuery} $ Instance of jQuery
 * @return {Object} List of equalHeight methods
 */
XA.component.equalHeight = (function ($) {
    /**
    * List of selectors for calculating height functionality
    * @type {Object.<Methods>}
    * @memberOf module:equalHeight
    * */
    var settings = {
        parentSelector: '.equalized-content',
        selector: '.equal:not(.flip.component),.flip .Side0,.flip .Side1'
    };
    /**
     * This object stores all public api methods
     * @type {Object.<Methods>}
     * @memberOf module:equalHeight
     * */
    var api = {};
    /**
    * fixHeight method calculates height of bigger element 
    * and sets up the same size for other elements
    * @memberOf module:equalHeight
    * @alias module:equalHeight.fixHeight
    */
    api.fixHeight = function () {

        $(settings.parentSelector).each(function () {
            var $elements = $(this).find(settings.selector),
                maxHeight = 0;



            $elements.each(function () {
                var $element = $(this);
                $element.css('min-height', 'inherit');
                $element.find('>.component-content').css('min-height', 'inherit');

                if ($element.outerHeight(true) > maxHeight) {
                    maxHeight = $element.outerHeight(true);
                }
            });

            if (maxHeight > 0) {
                $elements.each(function () {
                    var $element = $(this);
                    if ($element.hasClass("Side0") || $element.hasClass("Side1")) {
                        $element.parent().attr('class', 'flip').css({ 'min-height': maxHeight });
                    }
                    $element.css({
                        'min-height': maxHeight
                    });
                    $element.find('>.component-content').css({
                        'min-height': maxHeight
                    });
                });
            }
        });
    }
    /**
      * init method binds call of 
      * ["fixHeight"]{@link module:equalHeight.fixHeight} method
      * for window load and resize events
      * @memberOf module:equalHeight
      * @alias module:equalHeight.init
      */
    api.init = function () {
        $(window).bind('load', function () {
            setTimeout(api.fixHeight, 0);
        });

        $(window).bind('resize', function () {
            api.fixHeight();
        });
    };

    return api;

}(jQuery, document));

XA.register("equalHeight", XA.component.equalHeight);