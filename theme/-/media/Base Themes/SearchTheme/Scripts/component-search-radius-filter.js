/**
 * Radius filter component functionality
 * @module radiusFilter
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with radius filter
*/
XA.component.search.radiusFilter = function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:radiusFilter
    */
    var api = {},
        initializeComponent,
        RadiusFilterModel,
        RadiusFilterView,
        queryModel,
        urlHelperModel;

	/**
    * @name module:radiusFilter.RadiusFilterModel
    * @constructor
    * @augments Backbone.Model
    */
    RadiusFilterModel = Backbone.Model.extend(
        /** @lends module:radiusFilter.RadiusFilterModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                properties: [],
                selected: {},
                sig: []
            }
        });
    /**
    * @name module:radiusFilter.RadiusFilterView
    * @constructor
    * @augments Backbone.View
    */
    RadiusFilterView = XA.component.search.baseView.extend(
        /** @lends module:radiusFilter.RadiusFilterView.prototype **/
        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:radiusFilter.RadiusFilterView~event:change
            * @listens module:XA.component.search.vent~event:hashChanged
            * @memberof module:radiusFilter.RadiusFilterView
            * @alias radiusFilter.RadiusFilterView#initialize
            */
            initialize: function () {
                var radiusElements = _.map(this.$el.find("li[data-value][data-title]"), function (r) { return $(r); }),
                    properties = this.$el.data("properties");

                _.each(radiusElements, function (r) { r.addClass("radius-button"); });

                this.model.set({ properties: properties, selected: {} });
                this.model.bind("change", this.render, this);
                this.model.set("sig", this.translateSignatures(properties.searchResultsSignature, properties.f));

                XA.component.search.vent.on("hashChanged", this.hashChanged.bind(this));
                this.render();
            },
            /**
            * list of events for Backbone View
            * @memberof module:radiusFilter.RadiusFilterView
            * @alias module:radiusFilter.RadiusFilterView#events
            */
            events: {
                "click li": "radiusClick",
                'click .bottom-remove-filter, .clear-filter': 'deselect'
            },
            /**
            * Render view
            * @memberof module:radiusFilter.RadiusFilterView
            * @alias module:radiusFilter.RadiusFilterView#render
            */
            render: function () {
                var _this = this, selected;

                selected = this.model.get("selected");
                _this.$el.find(".selected").removeClass("selected");

                if (typeof (selected) !== "undefined" && selected.length) {
                    selected.addClass("selected");
                }
                else {
                    selected = _this.$el.find("[data-value='-1']");
                    if (selected.length && selected.length >= 1) {
                        $(selected[0]).addClass("selected");
                    }
                }
            },
            /**
            * Updates hash with new value
            * @param {Number|String} newValue new value of hash parameter
            * @memberof module:radiusFilter.RadiusFilterView
            * @alias module:radiusFilter.RadiusFilterView#updateHash
            */
            updateHash: function (newValue) {
                var sig = this.model.get("sig");
                newValue = newValue == -1 ? "" : newValue;
                queryModel.updateHash(this.updateSignaturesHash(sig, newValue, {}));
            },
            /**
            * Updates hash and model 'selected' value
            * @param {Event} args Event object that contain current target
            * @memberof module:radiusFilter.RadiusFilterView
            * @alias module:radiusFilter.RadiusFilterView#radiusClick
            */
            radiusClick: function (args) {
                var _this = this,
                    selected = $(args.currentTarget);

                _this.updateHash(selected.data("value"));
                _this.model.set({ selected: selected });
            },
            /**
            * Updates hash with empty string and model 'selected' value set to undefined
            * @param {Event} args Event object that contains current target
            * @memberof module:radiusFilter.RadiusFilterView
            * @alias module:radiusFilter.RadiusFilterView#deselect
            */
            deselect: function (args) {
                var _this = this;

                _this.updateHash("");
                _this.model.set({ selected: undefined });
            },
            /**
            * Updates model 'selected' value based on hash value
            * @param {Object} hash Hash parameter stored as an Object
            * @memberof module:radiusFilter.RadiusFilterView
            * @alias module:radiusFilter.RadiusFilterView#hashChanged
            */
            hashChanged: function (hash) {
                var _this = this,
                    sig = this.model.get("sig"),
                    facetPart,
                    value,
                    selected,
                    i;

                for (i = 0; i < sig.length; i++) {
                    facetPart = sig[i].toLowerCase();
                    if (hash.hasOwnProperty(facetPart)) {
                        value = hash[facetPart];
                        value = value === "" ? -1 : value;
                        selected = _this.$el.find("[data-value='" + value + "']");
                        if (selected.length && selected.length >= 1) {
                            _this.model.set({ selected: $(selected[0]) });
                        }
                        else {
                            _this.model.set({ selected: undefined });
                        }
                    }
                }
            }

        });
    /**
    * Create
    * ["RadiusFilterModel"]{@link module:radiusFilter.RadiusFilterModel} and 
    * ["RadiusFilterView"]{@link module:radiusFilter.RadiusFilterView} 
    * @memberOf module:radiusFilter
    * @alias module:radiusFilter.initializeComponent
    */
    initializeComponent = function (component) {
        var model = new RadiusFilterModel();
        var view = new RadiusFilterView({ el: component[0], model: model });
        component.addClass("initialized");
    }
    /**
    * For each radius filter component on a page calls
    * ["initializeComponent"]{@link module:radiusFilter.initializeComponent}
    * @memberOf module:radiusFilter
    * @alias module:radiusFilter.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor")) {
            return;
        }

        var components = $(".radius-filter:not(.initialized)");
        _.each(components, function (component) {
            initializeComponent($(component));
        });

        queryModel = XA.component.search.query;
        urlHelperModel = XA.component.search.url;
    };

    return api;
}(jQuery, document);
XA.register("radiusFilter", XA.component.search.radiusFilter);