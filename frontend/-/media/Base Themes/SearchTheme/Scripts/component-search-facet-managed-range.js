/**
 * Managed Range Facet component functionality
 * @module managedrange
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with managed range component
*/
XA.component.search.facet.managedrange = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:managedrange
    */
    var api = {},
        urlHelperModel,
        queryModel,
        apiModel,
        initialized = false;
    /**
     * @name module:managedrange.FacetManagedRangeModel
     * @constructor
     * @augments Backbone.Model
     */
    var FacetManagedRangeModel = Backbone.Model.extend(
        /** @lends module:managedrange.FacetManagedRangeModel.prototype **/

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
    * @name module:managedrange.FacetManagedRangeView
    * @constructor
    * @augments Backbone.View
    */
    var FacetManagedRangeView = XA.component.search.baseView.extend(
        /** @lends module:managedrange.FacetManagedRangeView.prototype **/

        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:managedrange.FacetManagedRangeView~event:change
            * @listens module:XA.component.search.vent~event:hashChanged
            * @memberof module:managedrange.FacetManagedRangeView
            */
            initialize: function () {
                this.properties = this.$el.data().properties;

                if (this.model) {
                    this.model.set({ dataProperties: this.properties });
                    this.model.set("sig", this.translateSignatures(this.properties.searchResultsSignature, this.properties.f));
                }

                if (this.$el.find(".filterButton").length === 0) {
                    //If there is no filter button, we still have to have the possibility to use manual ranges
                    this.$el.find('.manualRangeMin').on('blur', this.textBoxChange.bind(this, []));
                    this.$el.find('.manualRangeMax').on('blur', this.textBoxChange.bind(this, []));
                }
                this.model.on("change", this.render, this);

                XA.component.search.vent.on("hashChanged", this.updateComponent.bind(this));
            },
            /**
           * list of events for Backbone View
           * @memberof module:managedrange.FacetManagedRangeView
           * @alias module:managedrange.FacetManagedRangeView#events
           */
            events: {
                'click .faceLink': 'linkClick',
                'click .facetRadio': 'radioClick',
                'click .facetCheckbox': 'checkBoxClick',
                'click .filterButton': 'filter',
                'click .bottom-remove-filter, .clear-filter': 'clearFilter',
                'keyup .manualRangeMin, .manualRangeMax': 'configureKeyCodes'
            },
            /**
             * On enter click calls 
             * ["filter"]{@link module:managedrange.FacetManagedRangeView.filter} method
             * @param {Event} e Event object
             * @memberof module:managedrange.FacetManagedRangeView
             * @alias module:managedrange.FacetManagedRangeView#configureKeyCodes
             */
            configureKeyCodes: function (e) {
                if (e.keyCode == 13) {
                    this.filter();
                }
            },
            /**
            * Helper function that will take all ranges selected on a page and 
            * update hash parameters according to this value
            * @param {Array<DomElement>} foundRangeControls List of range controls on a page
            * @memberof module:managedrange.FacetManagedRangeView
            * @alias module:managedrange.FacetManagedRangeView#updateHash
            */
            updateHash: function (foundRangeControls) {
                var sig = this.model.get('sig'),
                    ranges = [];

                _.each(foundRangeControls, function (range) {
                    var $range = $(range);
                    ranges.push($range.data().minvalue + "|" + $range.data().maxvalue);
                });

                this.$el.find('.manualRangeMin').val('');
                this.$el.find('.manualRangeMax').val('');

                queryModel.updateHash(this.updateSignaturesHash(sig, ranges.join(','), {}));
            },
            /**
             * Render view
             * @memberof module:managedrange.FacetManagedRangeView
             * @alias module:managedrange.FacetManagedRangeView#render
             */
            render: function () {
                var hashObj = queryModel.parseHashParameters(window.location.hash),
                    facetClose = this.$el.find(".facet-heading > span"),
                    sig = this.model.get('sig'),
                    inst = this,
                    ranges,
                    i;

                for (i = 0; i < sig.length; i++) {
                    if (hashObj.hasOwnProperty(sig[i]) && hashObj[sig[i]] !== '') {
                        ranges = hashObj[sig[i]].split(",");

                        facetClose.addClass('has-active-facet');
                        _.each(ranges, function (range) {
                            var r = range.split('|'),
                                minValue = r[0],
                                maxValue = r[1],
                                selector,
                                $component;

                            if (minValue === "" && maxValue === "") {
                                return;
                            } else if (minValue !== "" && maxValue !== "") {
                                selector = ".facetCheckbox[data-minvalue='" + minValue + "'][data-maxvalue='" + maxValue + "'], .facetRadio[data-minvalue='" + minValue + "'][data-maxvalue='" + maxValue + "']";
                            } else if (minValue !== "" && maxValue === "") {
                                selector = ".facetCheckbox[data-minvalue='" + minValue + "'], .facetRadio[data-minvalue='" + minValue + "']";
                            } else if (minValue === "" && maxValue !== "") {
                                selector = ".facetCheckbox[data-maxvalue='" + maxValue + "'], .facetRadio[data-maxvalue='" + maxValue + "']";
                            }

                            $component = $(selector);

                            if ($component.length > 0) {
                                $component.attr("checked", "checked");
                            } else {
                                inst.$el.find('.manualRangeMin').val(r[0]);
                                inst.$el.find('.manualRangeMax').val(r[1]);
                            }
                        });
                    }
                }
            },
            /**
             * Updates Hash base on selected element by calling 
             * ["updateHash"]{@link module:managedrange.FacetManagedRangeView.updateHash}
             * @param {Event} param Event that contains
             * currentTarget element
             * @memberof module:managedrange.FacetManagedRangeView
             * @alias module:managedrange.FacetManagedRangeView#radioClick
             */
            radioClick: function (param) {
                //fix for radio buttons groups in the ASP.NET repeater control
                var radio = $(param.currentTarget);
                $('.facetRadio').attr("name", radio.attr("name"));
                this.updateHash(radio);
            },
            /**
             * Clears values for manualRangeMin and manualRangeMax elements
             * @param {Event} param Event that contains
             * currentTarget element
             * @memberof module:managedrange.FacetManagedRangeView
             * @alias module:managedrange.FacetManagedRangeView#checkBoxClick
             */
            checkBoxClick: function (param) {
                var checkbox = $(param.currentTarget);
                if (checkbox.is(":checked")) {
                    this.$el.find('.manualRangeMin').val("");
                    this.$el.find('.manualRangeMax').val("");
                }
            },
            /**
             * Manages checked status for facetCheckbox 
             * Clears values for manualRangeMin and manualRangeMax elements
             * and updates hash value
             * @param {Event} param Event that contains
             * currentTarget element
             * @memberof module:managedrange.FacetManagedRangeView
             * @alias module:managedrange.FacetManagedRangeView#linkClick
             */
            linkClick: function (param) {
                var $link = $(param.currentTarget),
                    hashValue = $link.data().minvalue + "|" + $link.data().maxvalue;

                this.$el.find(".facetCheckbox[data-shortid!=" + $link.data().shortid + "]").removeAttr("checked");
                this.$el.find(".facetCheckbox[data-shortid=" + $link.data().shortid + "]").attr("checked", "checked");
                this.$el.find('.manualRangeMin').val("");
                this.$el.find('.manualRangeMax').val("");

                queryModel.updateHash(this.updateSignaturesHash(sig, hashValue, {}));
            },
            /**
             * If minRange or maxRange value set 
             * ["queryModel updateHash"]{@link module:searchQuery.updateHash} method
             * If checked CheckBox or RadioButton called
             * ["managedrange updateHash"]{@link module:managedrange.FacetManagedRangeView.updateHash}
             * If multiply selection disabled call 
             * ["radioClick"]{@link module:managedrange.FacetManagedRangeView.radioClick}
             * @memberof module:managedrange.FacetManagedRangeView
             * @alias module:managedrange.FacetManagedRangeView.filter
             */
            filter: function () {
                var multipleSelection = this.model.get('dataProperties').multipleSelection,
                    checkedCheckBoxes = this.$el.find('.facetCheckbox:checked'),
                    checkedRadioButton = this.$el.find('.facetRadio:checked'),
                    minRange = this.$el.find('.manualRangeMin'),
                    maxRange = this.$el.find('.manualRangeMax'),
                    sig = this.model.get('sig'),
                    maxRange, minRange, minValue, maxValue;

                //Gets values from text boxes
                minValue = minRange.length > 0 && minRange.val() !== "" ? minRange.val() : "";
                maxValue = maxRange.length > 0 && maxRange.val() !== "" ? maxRange.val() : "";

                if (minValue !== "" || maxValue !== "") {
                    //Clears all selected radio buttons and checkboxes
                    this.$el.find(".facetRadio").removeAttr("checked");
                    this.$el.find(".facetCheckbox").removeAttr("checked");

                    //Auto update hash after text box change when there is no filter button
                    queryModel.updateHash(this.updateSignaturesHash(sig, minValue + "|" + maxValue, {}));
                } else if (checkedCheckBoxes.length > 0 || checkedRadioButton.length > 0) {
                    if (multipleSelection) {
                        this.updateHash(checkedCheckBoxes);
                    } else {
                        this.radioClick({ currentTarget: checkedRadioButton });
                    }
                }
            },
            /**
            * Clears selected filter and updates hash
            * @memberof module:managedrange.FacetManagedRangeView
            * @alias module:managedrange.FacetManagedRangeView#clearFilter
            * 
            */
            clearFilter: function () {
                var minRange = this.$el.find('.manualRangeMin'),
                    maxRange = this.$el.find('.manualRangeMax'),
                    properties = this.model.get('dataProperties'),
                    facetClose = this.$el.find('.facet-heading > span'),
                    hash = queryModel.parseHashParameters(window.location.hash),
                    sig = this.model.get('sig'),
                    shouldClear = false,
                    facetData,
                    i;

                for (i = 0; i < sig.length; i++) {
                    facetData = sig[i];
                    if (typeof hash[facetData] !== "undefined" && hash[facetData] !== "") {
                        delete properties[facetData];
                        hash[facetData] = "";
                        shouldClear = true;
                    }
                }

                if (!shouldClear) {
                    return;
                }

                queryModel.updateHash(hash);

                this.model.set({ dataProperties: properties });

                this.$el.find('.facetCheckbox').removeAttr("checked");
                this.$el.find('.facetRadio').removeAttr("checked");

                facetClose.removeClass('has-active-facet');

                if (minRange.length > 0) {
                    minRange.val(minRange.data().defaultvalue);
                }
                if (maxRange.length > 0) {
                    maxRange.val(maxRange.data().defaultvalue);
                }
            },
            /**
             * Updates hash on checkbox or radio button changes
             * @memberof module:managedrange.FacetManagedRangeView
             * @alias module:managedrange.FacetManagedRangeView#clearFilter
             * 
             */
            textBoxChange: function () {
                var minRange = this.$el.find('.manualRangeMin'),
                    maxRange = this.$el.find('.manualRangeMax'),
                    minValue = minRange.length > 0 && minRange.val() !== "" ? minRange.val() : "",
                    maxValue = maxRange.length > 0 && maxRange.val() !== "" ? maxRange.val() : "",
                    sig = this.model.get('sig');

                //Clears all selected radio buttons and checkboxes
                this.$el.find(".facetRadio").removeAttr("checked");
                this.$el.find(".facetCheckbox").removeAttr("checked");

                if (minValue !== "" || maxValue !== "") {
                    //Auto updates hash after text box change when there is no filter button
                    queryModel.updateHash(this.updateSignaturesHash(sig, minValue + "|" + maxValue, {}));
                } else {
                    //Clears all radio buttons and checkbox hash parameters
                    queryModel.updateHash(this.updateSignaturesHash(sig, "", {}));
                }
            },
            /**
             * Updates component
             * @memberof module:managedrange.FacetManagedRangeView
             * @alias module:managedrange.FacetManagedRangeView#clearFilter
             * 
             */
            updateComponent: function (hash) {
                var sig = this.model.get('sig'),
                    facetPart,
                    i;
                for (i = 0; i < sig.length; i++) {
                    facetPart = sig[i].toLowerCase();
                    if (hash.hasOwnProperty(facetPart)) {
                        this.render();
                    } else {
                        this.clearFilter();
                    }
                }
            }
        });
    /**
    * For each search managed range component on a page creates instance of 
    * ["FacetManagedRangeModel"]{@link module:managedrange.FacetManagedRangeModel} and 
    * ["FacetManagedRangeView"]{@link module:managedrange.FacetManagedRangeView} 
    * @memberOf module:managedrange
    * @alias module:managedrange.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;
        apiModel = XA.component.search.ajax;
        urlHelperModel = XA.component.search.url;

        var facetManagedRangesList = $(".facet-managed-range");
        _.each(facetManagedRangesList, function (elem) {
            var model = new FacetManagedRangeModel(),
                view = new FacetManagedRangeView({ el: $(elem), model: model });
            view.render();
        });

        initialzied = true;
    };

    return api;

}(jQuery, document));

XA.register('managedrange', XA.component.search.facet.managedrange);
