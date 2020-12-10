
/**
 * Facet summary component functionality
 * @module facetSummary
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with component facet summary
*/
XA.component.search.facet.summary = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:facetSummary
    */
    var api = {},
        urlHelperModel = XA.component.search.url,
        queryModel = XA.component.search.query,
        apiModel = XA.component.search.ajax,
        facetName = "summary";

    /**
    * @name module:facetSummary.FacetSummaryModel
    * @constructor
    * @augments Backbone.Model
    */
    var FacetSummaryModel = Backbone.Model.extend(
        /** @lends module:facetSummary.FacetSummaryModel.prototype **/

        {
            /**
            * Default model options
            * @default
            * @param {Object} properties properties of ajax call and callback
            */
            defaults: {
                dataProperties: {},
                sig: [],
                hash: ''
            },
            /**
           * Listens to changes on facets and hash
            * @listens module:XA.component.search.vent~event:facet-data-loaded
            * @listens module:XA.component.search.vent~event:facet-data-filtered
            * @listens module:XA.component.search.vent~event:facet-data-partial-filtered
            * @listens module:XA.component.search.vent~event:hashChanged
            */
            initialize: function () {
                var that = this;
                this.set('resultData', {})
                //Event to get data at the begining or in case that there are no hash parameters in the url - one request for all controls
                XA.component.search.vent.on("facet-data-loaded", that.processData.bind(that));
                // //If the url hash contains this control facet name (someone clicked this control), then we have to listen for partial filtering
                XA.component.search.vent.on("facet-data-partial-filtered", that.processData.bind(that));
                // //When we are not filtering by this control (not clicked)
                XA.component.search.vent.on("facet-data-filtered", that.processData.bind(that));

            },
            /**
             * Finds all facets that have same name as facetName in Control Data and return them
             * @param {Object} facetData 
             * @param {*} controlData 
             * @returns {Array} Filtered facet data
             * @memberof module:facetSummary.FacetSummaryModel
             * @alias module:facetSummary.FacetSummaryModel.requestFacetData
             */
            requestFacetData: function (facetData, controlData) {
                return _.find(facetData, function (f) {
                    return f.Key.toLowerCase() === controlData.facetName.toLowerCase();
                });
            },
            /**
			 * Concatenates signature and facet name in order to build proper hash parameter name
			 * @param {*} rawSignature 
			 * @param {*} f 
			 */
            translateSignatures: function (rawSignature, f) {
                var signatures, i;

                f = f.toLowerCase();

                if (typeof rawSignature === "undefined" || rawSignature === null) {
                    return [f];
                }

                signatures = rawSignature.split(',');

                if (rawSignature === "") {
                    return [f];
                } else {
                    for (i = 0; i < signatures.length; i++) {
                        signatures[i] = signatures[i] + "_" + f;
                    }
                    return signatures;
                }
            },
            /**
            * Processes data that comes as parameter. Update
            * model and store all facets that are active and have
            * same signature
            * @param {Object} data Data from server with facet values
            * @memberof module:facetSummary.FacetSummaryModel
            * @alias module:facetSummary.FacetSummaryModel.processData
            */
            processData: function (data) {
                var hashObj = queryModel.parseHashParameters(window.location.hash),
                    requestFacedData,
                    that = this,
                    displayName,
                    facetData = [], requestData = {}, facetControl, control;
                var facets = XA.component.search.facet;

                for (facetControl in facets) {
                    control = XA.component.search.facet[facetControl];
                    if (typeof (control.getFacetDataRequestInfo) === "function") {
                        facetData = control.getFacetDataRequestInfo();
                        for (var facetIndex = 0; facetIndex < facetData.length; facetIndex++) {
                            var controlData = facetData[facetIndex];
                            var signaturesArray = controlData.signature.split(',');
                            for (var signatureIndex = 0; signatureIndex < signaturesArray.length; signatureIndex++) {
                                var signature = signaturesArray[signatureIndex];
                                if (data.Signature == signature && that.get('sig') == signature) {
                                    requestFacedData = that.requestFacetData(data.Facets, controlData);
                                    if (typeof requestFacedData !== "undefined") {
                                        displayName = requestFacedData.Name;
                                        var currResults = this.get('resultData');
                                        var facetHashNames = that.translateSignatures(signature, requestFacedData.Key.toLowerCase())
                                        for (var facetHashNameIndex = 0; facetHashNameIndex < facetHashNames.length; facetHashNameIndex++) {
                                            var facetHashName = facetHashNames[facetHashNameIndex];
                                            if (hashObj[facetHashName]) {
                                                currResults[displayName] = {
                                                    "value": hashObj[facetHashName],
                                                    "key": requestFacedData.Key,
                                                    "signature": data.Signature,
                                                    "facetHashName": facetHashName
                                                }
                                            } else {
                                                delete currResults[displayName];
                                            }
                                        }
                                        this.set('resultData', currResults);
                                        this.trigger('change', this)

                                    }
                                }
                            }

                        }
                    }
                }
            }
        });
    /**
    * @name module:facetSummary.FacetSummaryView
    * @constructor
    * @augments Backbone.View
    */
    var FacetSummaryView = XA.component.search.baseView.extend(
        /** @lends module:facetSummary.FacetSummaryView.prototype **/

        {
            tagName: "div",
            className: "facet-search-summary",
            template:
                "<% if(Object.keys(resultData).length){ %> <div class='facet-summary-wrapper clearfix'>" +
                "<% _.forEach(resultData, function(obj,key){ %>" +
                "<div class='active-facet-summary-element' data-hash='" + "<%=obj.facetHashName%>" + "' data-key='" + "<%=obj.key%>" + "' data-signature='" + "<%=obj.signature%>" + "'>" +
                "<span class='facet-summary-name'><%= key  %>:</span> " + "<%= renderFacetValues(obj.value) %>" +
                "</div>" +
                "<% }); %>" +
                "</div><% }%>",

            renderFacetValues: function (value) {
                var params = value.split("||")

                return params.map(function (p) {
                    var template = '<div class=\'facet-summary-value\' data-value=' + encodeURIComponent(p) + '>'
                        + '<p>' + p + '</p>'
                        + '<span class=\'removeFacetValue\'>x</span>'
                        + '</div>'

                    return template;
                }).join(' ')
            },
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:facetSummary.FacetSummaryView~event:change
            * @memberof module:facetSummary.FacetSummaryView
            * @alias module:facetSummary.FacetSummaryView#initialize
            */
            clearButtons: function (event) {
                var $target = $(event.currentTarget),
                    $facetSummary = $target.closest(".facet-summary");
                $facetSummary.find('.clear-all-active-facets').trigger('click');

            },
            /**
            * Initializes the view by assigning events to the buttons and rendering component
            * @memberof module:facetSummary.FacetSummaryView
            * @alias module:facetSummary.FacetSummaryView#events
            */
            initialize: function () {
                var dataProperties = this.$el.data(),
                    that = this,
                    properties = dataProperties.properties,
                    signatures;
                Backbone.$('.facet-summary .clear-filter').on('click', function (event) {
                    that.clearButtons(event)

                })
                Backbone.$('.facet-summary .bottom-remove-filter').on('click', function (event) {
                    that.clearButtons(event)

                })
                signatures = this.translateSignatures(properties.searchResultsSignature, facetName);
                this.model.set("sig", properties.searchResultsSignature);
                dataProperties = this.$el.data("properties"),
                    this.model.on("change", this.render, this);
                this.render();
            },
            /**
             * list of events for Backbone View
            * @memberof module:facetSummary.FacetSummaryView
            * @alias module:facetSummary.FacetSummaryView#events
             */
            events: {
                'click .removeFacetValue': 'removeFacetValue',
                'click .clear-filter': 'clearAllActiveFacets',
                'click .bottom-remove-filter button': 'clearAllActiveFacets'
            },
            /**
            * Prepares hash string based on hash object
            * @param {Object} hashObj Object created from hash parameters
            * @memberof module:facetSummary.FacetSummaryView
            * @alias module:facetSummary.FacetSummaryView#createHash
            * @returns {String} hash as a string
            */
            createHash: function (hashObj) {
                var result = "#";
                for (option in hashObj) {
                    result += option + "=" + hashObj[option] + "&";
                }
                return result;
            },
            /**
             * Updates current location
             * @param {Object} hashObj 
             */
            updateLocation: function (hashObj) {
                XA.component.search.query.updateHash(hashObj);
            },
            /**
             * Returns facet params
             * @param {Jquery} el jquery event target element 
             */
            getFacetParams: function (el) {
                var summaryEl = $(el).closest(".active-facet-summary-element");

                return {
                    key: summaryEl.data('key'),
                    signature: summaryEl.data('signature')
                }
            },
            /**
             * Clears all active facets that are stored under summary component
            * @memberof module:facetSummary.FacetSummaryView
            * @alias module:facetSummary.FacetSummaryView#clearAllActiveFacets
            */
            clearAllActiveFacets: function () {
                var self = this;
                var hashObj = queryModel.parseHashParameters(window.location.hash);
                
				this.$el.find('.active-facet-summary-element').each(function () {
                    var facetParams = self.getFacetParams($(this));
                    var facetHashNames = self.translateSignatures(facetParams.signature, facetParams.key)

                    _.each(facetHashNames, function (facetHashName) {
                        hashObj[facetHashName]="";
                    })
                })

                self.updateLocation(hashObj);
            },
            /**
             * Removes selected facet value and updates hash
             * @param {Event} event Event object where stored clicked element
             */
            removeFacetValue: function (event) {
                var facetValueElem = $(event.currentTarget).closest(".facet-summary-value")

                var selectedFacetValue = decodeURIComponent(facetValueElem.data('value'))
                var facetParams = this.getFacetParams(event.currentTarget)

                var hashObj = queryModel.parseHashParameters(window.location.hash);
                var facetHashNames = this.translateSignatures(facetParams.signature, facetParams.key)

                var removeSelectedValue = function (facetHashName) {
                    hashObj[facetHashName] = hashObj[facetHashName]
                        .split("||")
                        .filter(function(val) {
                            return val !== selectedFacetValue
                        })
                        .join("||");
                }

                _.each(facetHashNames, removeSelectedValue)

                this.updateLocation(hashObj);
            },
            /**
            * Renders view
            * @memberof module:facetSummary.FacetSummaryView
            * @alias module:facetSummary.FacetSummaryView#render
            */
            render: function () {
                var inst = this,
                    resultData = this.model.get("resultData"),
                    template, templateResult;
                var dataProperties = this.$el.data();
                this.properties = dataProperties.properties;
                this.manageVisibilityByData(this.$el, resultData)
                if (this.model) {
                    this.model.set({ dataProperties: this.properties });
                    this.model.set("sig", this.properties.searchResultsSignature);
                }
                //checks whether page is opened from disc - if yes then we are in Creative Exchange mode
                if (window.location.href.startsWith("file://")) {
                    return;
                }

                if (resultData !== undefined) {
                    template = _.template(this.template, {
                        imports: { renderFacetValues: this.renderFacetValues }
                    });

                    templateResult = template({
                        "resultData": resultData
                    });
                }

                inst.$el.find(".facet-summary-placeholder").html(templateResult);
            }

        });
    /**
    * For each search dropdown component on a page creates instance of 
    * ["FacetSummaryModel"]{@link module:facetSummary.FacetSummaryModel} and 
    * ["FacetSummaryView"]{@link module:facetSummary.FacetSummaryView} 
    * @memberOf module:facetSummary
    * @alias module:facetSummary.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor")) {
            return;
        }

        queryModel = XA.component.search.query;
        apiModel = XA.component.search.ajax;
        urlHelperModel = XA.component.search.url;

        var facetSummary = $(".facet-summary:not(.initialized)");      

        _.each(facetSummary, function (elem) {
            var $el = $(elem),
                model = new FacetSummaryModel(),
                view = new FacetSummaryView({ el: $el, model: model });

            $el.addClass("initialized");
        });
    };

    return api;

}(jQuery, document));

XA.register('facetSummary', XA.component.search.facet.summary);