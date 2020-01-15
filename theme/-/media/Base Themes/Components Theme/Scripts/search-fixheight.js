/**
 * Component searchEqualHeight
 * makes height of search results elements the same
 * @deprecated Latest Theme version use flexboxes.
 * @module searchEqualHeight
 * @param  {jQuery} $ Instance of jQuery
 * @return {Object} List of searchEqualHeight methods
 */
XA.component.searchEqualHeight = (function ($) {
    /**
    * List of selectors for calculating height functionality
    * @type {Object.<Methods>}
    * @memberOf module:searchEqualHeight
    */
    var settings = {
        parentSelector: '.search-results.components',
        selector: 'li'
    };
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchEqualHeight
    */
    var api = {};
    /**
    * fixHeight method calculates height of bigger element 
    * and sets up the same size for other elements
    * @memberOf module:searchEqualHeight
    * @alias module:searchEqualHeight.fixHeight
    */
    function fixHeight() {

        $(settings.parentSelector).each(function () {
            var $elements = $(this).find(settings.selector),
                maxHeight = 0,
                maxPadding = 0;

            $elements.each(function () {
                $(this).css('min-height', 'inherit');

                if ($(this).height() > maxHeight) {
                    maxHeight = $(this).outerHeight(true);
                }

            });

            if (maxHeight > 0) {
                $elements.css({
                    'padding-bottom': maxPadding,
                    'min-height': maxHeight
                });
            }
        });
    }
    /**
    * init method binds call of 
    * ["fixHeight"]{@link module:searchEqualHeight.fixHeight} method
    * for window load and resize events
    * @memberOf module:searchEqualHeight
    * @alias module:searchEqualHeight.init
     */
    api.init = function () {
        //Latest Theme version use flexboxes.
        //If you don`t want use flex, you must 
        //uncomment code below

        /* $(document).ready(function() {
             setTimeout(fixHeight, 0);
         });
 
         $(window).bind('resize', function() {
             fixHeight();
         });
         */
    };
    return api;
}(jQuery, document));

XA.register("searchEqualHeight", XA.component.searchEqualHeight);