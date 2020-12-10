/**
 * Component accessibility
 * makes content more accessible to people with disabilities.
 * @module Accessibility
 * @param  {jQuery} $ Instance of jQuery
 */
XA.component.accessibility = (function ($) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:Accessibility
    * */
    var api = {};
    /**
        * getAllIndexedElement - returns elements that have tab index attribute
        * @returns {jQuery<DOMElement>} elements that have tab index attribute
    */
    var getAllIndexedElement = function () {
        return $("body").find("[tabindex]");
    };

    /**
        * activateFirstElement - activate first element on a page that have tab index attribute
        * active element
        * @returns {String} component name 
    */
    var activateFirstElement = function () {
        api.indexedElements.eq(0).attr("tabindex", "0");
    };
    /**
       * getComponentName - helper that provides component name based on 
       * active element
       * @returns {String} component name 
   */
    var getComponentName = function () {
        var $activeElement = $(document.activeElement),
            currComponent = $activeElement.closest(".initialized"),
            componentName = currComponent.length
                ? currComponent.attr("class").split(" ")[1]
                : "";
        return componentName;
    };
    /**
        * getWrapper - helper that provides wrapper element for
        * active element
        * @param {String} selector selector of parent wrapper
        * @returns {jQuery<DOMElement>} 
    */
    var getWrapper = function (selector) {
        var $activeElement = $(document.activeElement);
        return $activeElement.closest(selector);
    };

    /**
        * activateTab - helper for Tabs component
    */
    var activateTab = function (direction, currTab) {
        var activatedTab = currTab;
        if (direction == "left" && currTab.prev()) {
            currTab.attr("tabindex", "-1");
            activatedTab = currTab.prev();
        } else if (direction == "right" && currTab.next()) {
            currTab.attr("tabindex", "-1");
            activatedTab = currTab.next();
        }
        activatedTab
            .attr("tabindex", "0")
            .trigger("click")
            .focus();
    };

    /**
     * activateItem - helper for Accordion component
    */
    var activateItem = function (direction, currItem) {
        var itemWrapper = currItem.closest("li.item"),
            activatedTab = currItem,
            nextItem = itemWrapper.next(),
            prevItem = itemWrapper.prev();
        if (direction == "down" && nextItem) {
            currItem.attr("tabindex", "-1");
            activatedTab = nextItem;
        } else if (direction == "up" && prevItem) {
            currItem.attr("tabindex", "-1");
            activatedTab = prevItem;
        }
        activatedTab
            .find(".toggle-header")
            .attr("tabindex", "0")
            .focus();
    };

    /**
     * toggleFlip - helper for Flip component
    */
    var toggleFlip = function (currItem) {
        var nextItem = currItem.next().length ? currItem.next() : currItem.prev();
        currItem.attr("tabindex", "-1");
        nextItem
            .trigger("click")
            .attr("tabindex", "0")
            .focus();
    };

    /**
     * componentLogic - object that contains list of components as a object key
     * and function with logic that make this component WCAG friendly
     * @type {Object}
     */
    var componentLogic = {
        tabs: function (keyCode) {
            var currTab = getWrapper("li.active");
            if (currTab) {
                if (keyCode == api.keys.right) {
                    activateTab("right", currTab);
                } else if (keyCode == api.keys.left) {
                    activateTab("left", currTab);
                }
            }
        },
        accordion: function (keyCode) {
            var currItem = getWrapper("div.toggle-header");
            if (currItem) {
                if (keyCode == api.keys.down) {
                    activateItem("down", currItem);
                } else if (keyCode == api.keys.up) {
                    activateItem("up", currItem);
                }
            }
        },
        flip: function (keyCode) {
            var currItem = getWrapper("[class*='Side']");
            if (currItem) {
                if (keyCode == api.keys.right || keyCode == api.keys.left) {
                    toggleFlip(currItem);
                }
            }
        }
    };
    /**
    * bindEvents method get component name by calling 
    * ["getComponentName"]{@link module:Accessibility.getComponentName} method and running apropriate to
    * component logic
    * @memberOf module:Accessibility
    * @param {number} keycode keycode of pressed button on keyboard
    * @alias module:Accessibility.bindEvents
    * @private
    * */
    var bindEvents = function (keyCode) {
        var component = getComponentName();
        if (componentLogic[component]) {
            componentLogic[component](keyCode);
        }
    };

    /**
    * This object stores keycode of keyboard buttons
    * @type {Object}
    * @memberOf module:Accessibility 
    * @alias module:Accessibility.keys
    * */
    api.keys = {
        end: 35,
        home: 36,
        left: 37,
        up: 38,
        right: 39,
        down: 40,
        delete: 46,
        enter: 13,
        space: 32
    };
    /**
         * indexedElements variable take list of all Indexed Element on a page by calling
         * ["getAllIndexedElement"]{@link module:Accessibility.getAllIndexedElement} method
         * @memberOf module:Accessibility
         * @param {Object} properties list of properties for accordion component
         * @alias module:Accessibility.indexedElements
    */
    api.indexedElements = getAllIndexedElement();
    /**
     * watchEvents method bind keyup event on document and on each trigger calls
     * ["bindEvents"]{@link module:Accessibility.bindEvents}
     * @memberOf module:Accessibility
     * @alias module:Accessibility.watchEvents
     */
    api.watchEvents = function () {
        $(document).on("keyup", function (event) {
            var keyCode = event.keyCode;
            bindEvents(keyCode);
        });
    };
    /**
        * initInstance method call
        * ["watchEvents"]{@link module:Accessibility.watchEvents} method
        * and call
        * ["activateFirstElement"]{@link module:Accessibility.activateFirstElement}
        * @memberOf module:Accessibility
        * @method
        * @alias module:Accessibility.initInstance
        */
    api.initInstance = function () {
        api.watchEvents();
        activateFirstElement();
    };
    /**
     * init method calls 
     * [".initInstance"]{@link module:Accessibility.initInstance} method.
     * @memberOf module:Accessibility
     * @alias module:Accessibility.init
     */
    api.init = function () {
        api.initInstance();
    };

    return api;
})(jQuery, document);

XA.register("accessibility", XA.component.accessibility);
