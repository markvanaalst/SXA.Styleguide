/**
 * Facet dropdown component functionality
 * @module variantFilter
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for variant filter component
*/
XA.component.search.variantFilter = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:variantFilter
    */
    var api = {},
        queryModel,
        queryParameters,
        variantMappings = [],
        initialized = false,
        variantMappings = {};
    /**
    * @name module:variantFilter.VariantSelectorModel
    * @constructor
    * @augments Backbone.Model
    */
    var VariantSelectorModel = Backbone.Model.extend(
        /** @lends module:variantFilter.VariantSelectorModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                dataProperties: {},
                sig: []
            }
        });
    /**
    * @name module:variantFilter.VariantSelectorView
    * @constructor
    * @augments Backbone.View
    */
    var VariantSelectorView = XA.component.search.baseView.extend(
        /** @lends module:variantFilter.VariantSelectorView.prototype **/
        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:XA.component.search.vent~event:results-loaded
            * @memberof module:variantFilter.VariantSelectorView
            * @alias module:variantFilter.VariantSelectorView#initialize
            */
            initialize: function () {
                var hashObj = queryModel.parseHashParameters(window.location.hash),
                    dataProperties = this.$el.data(),
                    sig = this.translateSignatures(dataProperties.properties.searchResultsSignature, "v"),
                    inst = this,
                    i;

                if (dataProperties.properties.searchResultsSignature === null) {
                    dataProperties.properties.searchResultsSignature = "";
                }

                this.model.set({ dataProperties: dataProperties });
                this.model.set("sig", sig);

                for (i = 0; i < sig.length; i++) {
                    if (hashObj.hasOwnProperty(sig[i])) {
                        this.selectVariantIcon(hashObj[sig[i]]);
                    }
                }

                XA.component.search.vent.on("results-loaded", function (resultsData) {
                    var rawSignatures = dataProperties.properties.searchResultsSignature.split(','),
                        signature,
                        startingVariant,
                        signatureVariants;

                    hashObj = queryModel.parseHashParameters(window.location.hash);

                    for (i = 0; i < rawSignatures.length; i++) {
                        signature = rawSignatures[i];
                        if (hashObj.hasOwnProperty(sig[i]) && variantMappings.hasOwnProperty(signature)) {
                            signatureVariants = variantMappings[signature];
                            startingVariant = signatureVariants[hashObj[sig[i]]];
                            inst.triggerAddVariant(startingVariant.cssClass, signature);
                            inst.selectVariantIcon(hashObj[sig[i]]);
                        } else {
                            //selects first variant if there is no variant param in the hash
                            if (variantMappings.hasOwnProperty(signature) && variantMappings[signature].hasOwnProperty(0)) {
                                setTimeout(function () {
                                    inst.triggerAddVariant(variantMappings[signature][0].cssClass, signature);
                                    inst.selectVariantIcon(0);
                                }, 100);
                            }
                        }
                    }
                });
            },
            /**
            * list of events for Backbone View
            * @memberof module:variantFilter.VariantSelectorView
            * @alias module:variantFilter.VariantSelectorView#events
            */
            events: {
                "click div > div": "changeVariant"
            },
            /**
            * Changes variant of search result view
            * @param {Event} EVent object with selected variant as a current Target
            * @listens module:XA.component.search.vent~event:results-loaded
            * @memberof module:variantFilter.VariantSelectorView
            * @alias module:variantFilter.VariantSelectorView#changeVariant
            */
            changeVariant: function (event) {
                var $target = $(event.currentTarget),
                    sig = this.model.get("sig"),
                    props = $target.data();

                this.$el.find(".active-variant").removeClass("active-variant");
                $target.addClass("active-variant");

                queryParameters.updateHash(this.updateSignaturesHash(sig, props.variantindex, {}));
                this.triggerAddVariant($(event.currentTarget).attr("class"));
            },
            /**
            * Changes variant of search result view
            * @param {String} classes css class of chosen variant
            * @param {String} signature component signature
            * @fires module:XA.component.search.vent~event:add-variant-class
            * @memberof module:variantFilter.VariantSelectorView
            * @alias module:variantFilter.VariantSelectorView#triggerAddVariant
            */
            triggerAddVariant: function (classes, signature) {
                XA.component.search.vent.trigger("add-variant-class", {
                    classes: classes,
                    sig: signature
                });
            },
            /**
            * Manages active-variant class for variant icons
            * @param {String} v data variant index of selected element 
            * @fires module:XA.component.search.vent~event:add-variant-class
            * @memberof module:variantFilter.VariantSelectorView
            * @alias module:variantFilter.VariantSelectorView#selectVariantIcon
            */
            selectVariantIcon: function (v) {
                this.$el.find("div[data-variantIndex]").removeClass("active-variant");
                this.$el.find("div[data-variantIndex=" + v + "]").addClass("active-variant");
            }
        });

    /**
    * For each search variant filters component on a page creates instance of 
    * ["VariantSelectorModel"]{@link module:variantFilter.VariantSelectorModel} and 
    * ["VariantSelectorView"]{@link module:variantFilter.VariantSelectorView} 
    * @memberOf module:variantFilter
    * @alias module:variantFilter.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;
        queryParameters = XA.component.search.parameters;

        var variantSelectors = $(".variant-selector");
        _.each(variantSelectors, function (elem) {
            var view = new VariantSelectorView({ el: $(elem), model: new VariantSelectorModel() });
        });

        initialized = true;
    };

    /**
    * 
    * @param signature
    * @param {String} signature component signature
    * @memberOf module:variantFilter
    * @alias module:variantFilter.getVariantMappings
    */
    api.getVariantMappings = function (signature) {
        var variantSelectors = $(".variant-selector"),
            componentVariants = {},
            allVariantItems,
            signatures = [],
            properties,
            i;

        if (!variantMappings.hasOwnProperty(signature)) {
            for (i = 0; i < variantSelectors.length; i++) {
                properties = $(variantSelectors[i]).data().properties;
                signatures = properties.searchResultsSignature.split(',');

                if (signatures.indexOf(signature) !== -1) {
                    allVariantItems = $(variantSelectors[i]).find(".variant-option");
                    _.each(allVariantItems, function (variant) {
                        var data = $(variant).data();
                        componentVariants[data.variantindex] = { id: data.variant, cssClass: $(variant).attr("class") };
                    });
                    variantMappings[signature] = componentVariants;
                }
            }
        }

        if (variantMappings.hasOwnProperty(signature)) {
            return variantMappings[signature];
        }

        return {};
    };

    return api;

}(jQuery, document));

XA.register('variantFilter', XA.component.search.variantFilter);

