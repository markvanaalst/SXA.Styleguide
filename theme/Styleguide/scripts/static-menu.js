XA.component.header = (function ($) {

    var api = {};

/*    api.initInstance = function (component) {
        if (component.hasClass("navigation-main")) {
            dropDownNavigation(component);
            mobileNavigation(component);
            horizontalHideOverflowed(component.find('nav>ul'),component);
        } else if (component.hasClass("navigation-mobile")) {
            mobileNavigation(component);
        }
    }
*/
    api.init = function () {
        $(window).scroll(function(){
            if ($(window).scrollTop() >= 38) {
                $('#header-navigation').addClass('fixed-header');
                /*$('nav div').addClass('visible-title');*/
            }
            else {
                $('#header-navigation').removeClass('fixed-header');
                /*$('nav div').removeClass('visible-title');*/
            }
        });
    };

    return api;
}(jQuery, document));

XA.register("header", XA.component.header);