/**
 * Facet Slider component functionality
 * @module searchFacetSlider
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with slider
*/
XA.component.search.facet.slider = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:searchFacetRangeSlider
    */
    var api = {},
        urlHelperModel,
        queryModel,
        initialized = false;

    /**
    * @name module:searchFacetSlider.SearchFacetSliderModel
    * @constructor
    * @augments Backbone.Model
    */
    var SearchFacetSliderModel = Backbone.Model.extend(
        /** @lends module:searchFacetSlider.SearchFacetSliderModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                dataProperties: {},
                selectedValue: null,
                sig: [],
                timeStamp: ''
            }
        });

    /**
     * @name module:searchFacetSlider.SearchFacetSliderView
     * @constructor
     * @augments Backbone.View
     */
    var SearchFacetSliderView = XA.component.search.baseView.extend(
        /** @lends module:searchFacetSlider.SearchFacetSliderView.prototype **/
        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:searchFacetSlider.SearchFacetSliderView~event:change
            * @listens module:XA.component.search.vent~event:hashChanged
            * @memberof module:searchFacetSlider.SearchFacetSliderView
            */
            initialize: function () {
                var dataProperties = this.$el.data(),
                    that = this;
                this.properties = dataProperties.properties;

                if (this.model) {
                    this.model.set({ dataProperties: this.properties });
                    this.model.set("sig", this.translateSignatures(this.properties.searchResultsSignature, this.properties.f));
                }

                this.model.on("change", this.updateSelectedValue, this);

                XA.component.search.vent.on("hashChanged", this.updateModel.bind(this));

                this.render();
            },
            /**
           * list of events for Backbone View
           * @memberof module:searchFacetSlider.SearchFacetSliderView
           * @alias module:searchFacetSlider.SearchFacetSliderView#events
           */
            events: {
                'click .bottom-remove-filter, .clear-filter': 'removeFacet',
                'mouseup .ui-slider-handle': 'updateModel'
            },
            /**
            * Render view. Use jQueryUI slider with set up from searchFacetSlider
            * properties
            * @memberof module:searchFacetSlider.SearchFacetSliderView
            * @alias module:searchFacetSlider.SearchFacetSliderView#render
            */
            render: function () {
                var self = this, i,
                    sig = this.model.get('sig'),
                    dataProperties = this.model.get('dataProperties'),
                    hashObj = queryModel.parseHashParameters(window.location.hash),
                    min = parseFloat(dataProperties.minValue),
                    max = parseFloat(dataProperties.maxValue),
                    selectedValue = !_.isEmpty(_.pick(hashObj, dataProperties.f)) ? _.values(_.pick(hashObj, dataProperties.f))[0] : parseFloat(dataProperties.selectedValue),
                    changeStep = parseFloat(dataProperties.changeStep),
                    $sliderValue = $('<div />').addClass('slider-value'),
                    $slider = this.$el.find('.slider');

                queryModel = XA.component.search.query;
                urlHelperModel = XA.component.search.url;

                if (isNaN(min)) {
                    min = 0;
                }
                if (isNaN(max)) {
                    max = 0;
                }
                if (isNaN(changeStep)) {
                    changeStep = 1;
                }
                if (isNaN(selectedValue)) {
                    selectedValue = 0;
                }

                $slider.slider({
                    min: min,
                    max: max,
                    step: changeStep,
                    value: selectedValue,
                    slide: function (event, ui) {
                        self.updateModel(self.updateSignaturesHash(sig, ui.value, {}));
                    }
                });


                $(".slider-value").remove();
                $sliderValue.html(dataProperties.formatingString.replace('{value}', selectedValue));
                $slider.after($sliderValue);
            },
            /**
             * Sets default values for Facet Slider and updates hash accordingly
            * @memberof module:searchFacetSlider.SearchFacetSliderView
            * @alias module:searchFacetSlider.SearchFacetSliderView#removeFacet
             */
            removeFacet: function () {
                var facet = this.$el,
                    sig = this.model.get('sig'),
                    $slider = this.$el.find('.slider'),
                    $sliderValueField = this.$el.find('.slider-value'),
                    $facetClose = facet.find('.facet-heading > span'),
                    properties = this.model.get('dataProperties'),
                    dataProperties = facet.data('properties'),
                    facetName = dataProperties.f;

                $facetClose.removeClass('has-active-facet');

                //Removes slider text
                $sliderValueField.html("");

                //Sets slider valued to default min and max range values
                $slider.slider("value", dataProperties.minValue);

                properties[facetName] = "";
                queryModel.updateHash(this.updateSignaturesHash(sig, "", {}));
                this.model.set({ dataProperties: properties });
            },
            /**
            * Updates model based on hash parameters
            * @param {Object} hash Object that contains hash parameters
            * @memberof module:searchFacetSlider.SearchFacetSliderView
            * @alias module:searchFacetSlider.SearchFacetSliderView#updateModel
            */
            updateModel: function (hash) {
                var sig = this.model.get('sig'),
                    dataProperties,
                    facetPart,
                    value,
                    i;

                if (!hash) {
                    hash = queryModel.parseHashParameters(window.location.hash);
                }

                for (i = 0; i < sig.length; i++) {
                    facetPart = sig[i].toLowerCase();
                    if (hash.hasOwnProperty(facetPart)) {
                        value = _.values(_.pick(hash, facetPart))[0];
                        if (value !== '') {
                            dataProperties = this.model.get('dataProperties');
                            dataProperties.selectedValue = value;
                            this.model.set('dataProperties', dataProperties);
                            this.model.set("timeStamp", (new Date()).getTime());
                        } else {
                            this.removeFacet();
                        }
                    }
                }
            },
            /**
            * Updates slider selected values text
            * @param {Object} hash Object that contains hash parameters
            * @memberof module:searchFacetSlider.SearchFacetSliderView
            * @alias module:searchFacetSlider.SearchFacetSliderView#updateSelectedValue
            **/
            updateSelectedValue: function () {
                var dataProperties = this.model.get('dataProperties'),
                    value = dataProperties.selectedValue,
                    $sliderValueField = this.$el.find('.slider-value'),
                    $slider = this.$el.find('.slider'),
                    sig = this.model.get('sig'),
                    sliderText;

                $slider.slider("value", value);
                sliderText = dataProperties.formatingString.replace('{value}', value);
                $sliderValueField.html(sliderText);

                this.$el.find('.facet-heading > span').addClass('has-active-facet');

                queryModel.updateHash(this.updateSignaturesHash(sig, value, {}));
            }
        });
    /**
     * For each search facet range slider component on a page creates instance of 
     * ["SearchFacetSliderModel"]{@link module:searchFacetSlider.SearchFacetSliderModel} and 
     * ["SearchFacetSliderView"]{@link module:searchFacetSlider.SearchFacetSliderView} 
     * @memberOf module:searchFacetSlider
     * @alias module:searchFacetSlider.init
     */
    api.init = function () {
        queryModel = XA.component.search.query;
        urlHelperModel = XA.component.search.url;

        var searchFacetSlider = $(".facet-slider");
        _.each(searchFacetSlider, function (elem) {
            var searchFacetSliderModel = new SearchFacetSliderModel(),
                searchFacetSliderView = new SearchFacetSliderView({ el: $(elem), model: searchFacetSliderModel });
        });

        initialized = true;
    };

    return api;

}(jQuery, document));

XA.register('searchFacetSlider', XA.component.search.facet.slider);