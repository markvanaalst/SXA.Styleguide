/**
 * Component Toggle
 * @module Toggle
 * @param  {jQuery} $ Instance of jQuery
 * @return {Object} List of toggle methods
 */
XA.component.toggle = (function($) {
    /**
     * This object stores all public api methods
     * @type {Object.<Methods>}
     * @memberOf module:Toggle
     * */
    var api = {};

    var properties, instance;
    /**
     * Returns list of flip components
     * @memberOf module:Toggle
     * @method
     * @param {DOMElement} instance Root DOM element of toggle component
     * @alias module:Toggle.openToggle
     * @private
     * @return {jQuery} list of flip components
     */
    var getFlipList = function(instance) {
        return $(instance).find(".component.flip");
    };
	/**
     * Adds attribute "open" for "details" tag.
     * If inside toggle event calendar is added, this method will trigger
     * "resize method"
     * If inside toggle flip component is added, it will call
     * ["Flip.equalSideHeightInToggle"]{@link  module:Flip.equalSideHeightInToggle}
     * @memberOf module:Toggle
     * @method
     * @param {DOMElement} instance Root DOM element of toggle component
     * @alias module:Toggle.openToggle
     * @private
     */
    var openToggle = function(instance) {
        var flipList = getFlipList(instance),
            eventCalendar = $(instance).find('.event-calendar');
        $(instance).find('details').attr('open', 'open');
        if (eventCalendar.length){
            eventCalendar.trigger('resize')
        }
        if (flipList.lengt) {
            try {
                XA.component.flip.equalSideHeightInToggle(instance)
            } catch (e) {
                /* eslint-disable no-console */
                console.warn('Error during calculation height of Flip list in toggle'); // jshint ignore:line
                /* eslint-enable no-console */

            }
        }

    }
	/**
     * Removes attribute "open" for "details" tag
     * @memberOf module:Toggle
     * @method
     * @param {DOMElement} instance Root DOM element of toggle component
     * @alias module:Toggle.closeToggle
     * @private
     */
    var closeToggle = function(instance) {
        $(instance).find('details').removeAttr('open');
    }

	/**
     * Sets css animation for component-content of an component
     * @memberOf module:Toggle
     * @method
     * @param {DOMElement} instance Root DOM element of toggle component
     * @alias module:Toggle.setAnimation
     * @private
     */
    var setAnimation = function(instance) {
        $(instance).find('details summary~.component>.component-content').css({
            'animation-name': properties.easing,
            'animation-duration': (properties.speed || 500) + 'ms'
        });
    };
	/**
     * Checks value of properties.expandOnHover;
     * @memberOf module:Toggle
     * @method
     * @alias module:Toggle.isExpandOnHover
     * @private
     * @return {Boolean} properties.expandOnHover
     */
    var isExpandOnHover = function() {
        return properties.expandOnHover;
    };
    /**
     * Checks value of properties.expandedByDefault;
     * @memberOf module:Toggle
     * @method
     * @alias module:Toggle.isExpanded
     * @private
     * @return {Boolean} properties.expandedByDefault
     */
    var isExpanded = function() {
        return properties.expandedByDefault;
    };
    /**
     * Binds watchers on "summary" element that will call
     * ["openToggle"]{@link  module:Toggle.openToggle}
     * method
     * @memberOf module:Toggle
     * @method
     * @param {jQuery} instance Root DOM element of toggle component
     * @alias module:Toggle.bindEvents
     * @private
     */
	var bindEvents = function(instance) {
        var summary = $(instance).find('summary');
        if (isExpandOnHover()) {
            summary.on('mouseenter', function() {
                openToggle(instance);
            });
        }
        if (isExpanded()) {
            openToggle(instance);
        }

        summary.on('click', function(event) {
            event.preventDefault();
            var details = $(this).closest('details')
            if (details.attr('open')) {
                closeToggle(instance);
            } else {
                openToggle(instance);
            }
        });
    };
	/**
     * Call
     * ["bindEvents"]{@link  module:Toggle.bindEvents}
     * ["setAnimation"]{@link  module:Toggle.setAnimation}
     * methods
     * @memberOf module:Toggle
     * @method
     * @param {jQuery} component Root DOM element of toggle component wrapped by jQuery
     * @alias module:Toggle.initToggle
     * @private
     */
    var initToggle = function(component) {
        bindEvents(component);
		setAnimation(component);
	};
    /**
     * Call
     * ["initToggle"]{@link  module:Toggle.initToggle}
     * method
     * @memberOf module:Toggle
     * @method
     * @param {jQuery} component Root DOM element of toggle component wrapped by jQuery
     * @alias module:Toggle.initInstance
     */
    api.initInstance = function(component) {
        initToggle(component);
    };
    /**
     * Finds all not-initialized 
     * Toggle components and in a loop for each of them
     * runs Toggle's
     * ["initInstance"]{@link module:Toggle.initInstance}
     * method.
     * @memberOf module:Toggle
     * @alias module:Toggle.init
     */
    api.init = function() {
        $('.toggle:not(.initialized)').each(function() {
            instance = $(this);
            properties = instance.data('properties');
            api.initInstance(this,properties);
            instance.addClass('initialized');
        });
    };

    return api;
})(jQuery);

XA.register('component-toggle', XA.component.toggle);