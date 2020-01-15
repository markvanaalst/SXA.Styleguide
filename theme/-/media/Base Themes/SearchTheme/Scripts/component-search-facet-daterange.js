/**
 * Includes functionality for daterange component
 * @module facetDateRange
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with date range component
*/
XA.component.search.facet.daterange = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:facetDateRange
    * */
    var api = {}, queryModel, urlHelperModel, initialized = false, toUrlDate, fromUrlDate;
    /**
     * format date
     * @param {String} date date that should be formatted
     * @private
     * @memberof module:facetDateRange
     * @alias module:facetDateRange.toUrlDate
     * @returns {String} date in format 'yymmdd'
     */
    toUrlDate = function (date) {
        return date !== null && date !== "" ? $.datepicker.formatDate('yymmdd', date) : "";
    };
    /**
     * format date from url
     * @private
     * @param {String} dateString date that should be formatted
     * @memberof module:facetDateRange
     * @alias module:facetDateRange.fromUrlDate
     * @returns {Date} date
     */
    fromUrlDate = function (dateString) {
        var y = dateString.substr(0, 4),
            m = dateString.substr(4, 2) - 1,
            d = dateString.substr(6, 2),
            D = new Date(y, m, d);

        if (dateString === "") {
            return;
        }

        if (D.getFullYear() == y && D.getMonth() == m && D.getDate() == d)
            return D;
        else
            throw "Invalid date: " + dateString;
    };
    /**
    * @name module:facetDateRange.FacetDateRangeModel
    * @constructor
    * @augments Backbone.Model
    */
    var FacetDateRangeModel = Backbone.Model.extend(
        /** @lends module:facetDateRange.FacetDateRangeModel.prototype **/
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
      * @name module:facetDateRange.FacetDateRangeView
      * @constructor
      * @augments Backbone.View
      */
    var FacetDateRangeView = XA.component.search.baseView.extend(
        /** @lends module:facetDateRange.FacetDateRangeView.prototype **/
        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:facetDateRange.FacetDateRangeView~event:change
            * @listens module:XA.component.search.vent~event:hashChanged
            * @memberof module:facetDateRange.FacetDateRangeView
            */
            initialize: function () {
                this.properties = this.$el.data().properties;
                if (this.model) {
                    this.model.set({ dataProperties: this.properties });
                    this.model.set("sig", this.translateSignatures(this.properties.searchResultsSignature, this.properties.f));
                }
                this.model.on("change", this.render, this);
                
                XA.component.search.vent.on("hashChanged", this.updateComponent.bind(this));
            },
            /**
             * list of events for Backbone View
             * @memberof module:facetDateRange.FacetDateRangeView
             * @alias module:facetDateRange.FacetDateRangeView#events
             */
            events: {
                'change .startDate': 'updateFacet',
                'change .endDate': 'updateFacet',
                'click .bottom-remove-filter, .clear-filter': 'clearFilter'
            },
            /**
             * Renders view. Use jquery ui datepicker
             * @memberof module:facetDateRange.FacetDateRangeView
             * @alias module:facetDateRange.FacetDateRangeView#render
             */
            render: function () {
                var fromDateDefaultOffset = parseInt(this.model.get('dataProperties').fromDateDefaultOffset),
                    toDateDefaultOffset = parseInt(this.model.get('dataProperties').toDateDefaultOffset),
                    fromDateFormat = this.model.get('dataProperties').fromDateDisplayFormat,
                    toDateFormat = this.model.get('dataProperties').toDateDisplayFormat,
                    fromDateMonthsShown = this.model.get('dataProperties').fromDateMonthsShown,
                    toDateMonthsShown = this.model.get('dataProperties').toDateMonthsShown,
                    fromDatePastDays = this.model.get('dataProperties').fromDatePastDays,
                    toDateFutureDays = this.model.get('dataProperties').toDateFutureDays,
                    fromDateVisible = this.model.get('dataProperties').fromDateVisible,
                    toDateVisible = this.model.get('dataProperties').toDateVisible,
                    $fromDate = this.$el.find('.startDate'),
                    $toDate = this.$el.find('.endDate'),
                    hashObj = queryModel.parseHashParameters(window.location.hash),
                    sig = this.model.get('sig'),
                    lang = $("html").attr("lang") ? $("html").attr("lang") : "",
                    dates, i;

                if (toDateFormat) {
                    toDateFormat = toDateFormat.replace(/yy/g, "y");
                }
                if (fromDateFormat) {
                    fromDateFormat = fromDateFormat.replace(/yy/g, "y");
                }

                if (fromDateVisible) {
                    $fromDate.datepicker({
                        dateFormat: fromDateFormat,
                        changeMonth: fromDateMonthsShown,
                        changeYear: fromDateMonthsShown,
                        minDate: fromDatePastDays ? (fromDateDefaultOffset != '' ? -1 * fromDateDefaultOffset : new Date(1900, 1, 1)) : new Date()
                    });
                }

                if (toDateVisible) {
                    $toDate.datepicker({
                        dateFormat: toDateFormat,
                        changeMonth: toDateMonthsShown,
                        changeYear: toDateMonthsShown,
                        maxDate: toDateFutureDays ? (toDateDefaultOffset != '' ? toDateDefaultOffset : new Date(2100, 1, 1)) : new Date()
                    });
                }
                $xa.datepicker.setDefaults($xa.datepicker.regional[lang]);
                for (i = 0; i < sig.length; i++) {
                    if (hashObj.hasOwnProperty(sig[i]) && hashObj[sig[i]] != '') {
                        dates = hashObj[sig[i]].split("|");
                        $fromDate.datepicker("setDate", fromUrlDate(dates[0]));
                        $toDate.datepicker("setDate", fromUrlDate(dates[1]));
                    }
                }
            },
            /**
            * Updates hash by calling ["updateHash"]{@link module:searchQuery.updateHash}
            * @memberof module:facetDateRange.FacetDateRangeView
            * @alias module:facetDateRange.FacetDateRangeView#updateFacet
            */
            updateFacet: function (param) {
                var $facetClose = this.$el.find('.facet-heading > span'),
                    $fromDate = this.$el.find('.startDate'),
                    $toDate = this.$el.find('.endDate'),
                    fromDate = $fromDate.length > 0 ? $fromDate.datepicker("getDate") : null,
                    toDate = $toDate.length > 0 ? $toDate.datepicker("getDate") : null,
                    sig = this.model.get('sig');

                queryModel.updateHash(this.updateSignaturesHash(sig, toUrlDate(fromDate) + "|" + toUrlDate(toDate), {}));
                $facetClose.addClass('has-active-facet');
            },
            /**
            * Clears selected filter in component
            * @param {Object} param
            * @memberof module:facetDateRange.FacetDateRangeView
            * @alias module:facetDateRange.FacetDateRangeView#clearFilter
            */
            clearFilter: function (param) {
                var properties = this.model.get('dataProperties'),
                    $facetClose = this.$el.find('.facet-heading > span'),
                    hash = queryModel.parseHashParameters(window.location.hash),
                    sig = this.model.get('sig'),
                    shouldClear = false,
                    facetData,
                    i;

                $facetClose.removeClass('has-active-facet');

                for (i = 0; i < sig.length; i++) {  
                    facetData = sig[i];
                    if (typeof hash[facetData] !== "undefined" && hash[facetData] !== "") {                                      
                        delete properties[facetData];
                        shouldClear = true;
                    }
                }

                if (!shouldClear) {
                    return;
                }

                queryModel.updateHash(this.updateSignaturesHash(sig, "", hash));

                this.model.set({ dataProperties: properties });

                this.$el.find('.startDate').val("");
                this.$el.find('.endDate').val("");
            },
            /**
            * Updates component after changes in hash
            * @param {Object} hash object that stores hash values
            * @memberof module:facetDateRange.FacetDateRangeView
            * @alias module:facetDateRange.FacetDateRangeView#updateComponent
            */
            updateComponent: function (hash) {
                var $fromDate = this.$el.find('.startDate'),
                    $toDate = this.$el.find('.endDate'),
                    sig = this.model.get('sig'),
                    facetPart,
                    dates,
                    i;

                for (i = 0; i < sig.length; i++) {
                    facetPart = sig[i].toLowerCase();
                    if (hash.hasOwnProperty(facetPart) && hash[facetPart] !== '') {
                        dates = hash[facetPart].split("|");
                        if (dates[0] !== "") {
                            this.handleDate($fromDate, dates[0]);
                        }
                        if (dates[1] !== "") {
                            this.handleDate($toDate, dates[1]);
                        }
                    } else {
                        this.clearFilter();
                    }
                }
            },
            /**
            * Updates datepicker date
            * @param {jQuery<DomElement>} control element where start date specified
            * @param {String} value date that should be set  
            * @memberof module:facetDateRange.FacetDateRangeView
            * @alias module:facetDateRange.FacetDateRangeView#handleDate
            */
            handleDate: function (control, value) {
                var $facetClose = this.$el.find('.facet-heading > span');
                if (control.length !== 0 && toUrlDate(control.datepicker('getDate')) !== value) {
                    control.datepicker("setDate", fromUrlDate(value));
                    $facetClose.addClass('has-active-facet');
                } else if (value === "") {
                    control.datepicker('setDate', null);
                }
            }
        });

    /**
    * For each search date range on a page creates instance of 
    * ["FacetDateRangeModel"]{@link module:facetDateRange.FacetDateRangeModel} and 
    * ["FacetDateRangeView"]{@link module:facetDateRange.FacetDateRangeView} 
    * @memberOf module:facetDateRange
    * @alias module:facetDateRange.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;
        urlHelperModel = XA.component.search.url;

        var facetDateRangesList = $(".facet-date-range");
        _.each(facetDateRangesList, function (elem) {
            var model = new FacetDateRangeModel(),
                view = new FacetDateRangeView({ el: $(elem), model: model });
            view.render();
        });

        initialzied = true;
    };

    return api;

}(jQuery, document));

XA.register('facetDateRange', XA.component.search.facet.daterange);