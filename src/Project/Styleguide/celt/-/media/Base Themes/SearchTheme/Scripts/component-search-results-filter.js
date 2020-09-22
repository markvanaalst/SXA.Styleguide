/**
 * Facet facet result filter component functionality
 * @module facetResultsFilter
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {Object} list of methods for working with component facet result filter
*/
XA.component.search.facet.resultsfilter = (function ($, document) {
    /**
    * This object stores all public api methods
    * @type {Object.<Methods>}
    * @memberOf module:facetResultsFilter
    */
    var api = {},
        urlHelperModel,
        queryModel,
        apiModel,
        initialized = false;
    /**
    * @name module:facetResultsFilter.FacetResultsFilterModel
    * @constructor
    * @augments Backbone.Model
    */
    var FacetResultsFilterModel = XA.component.search.baseModel.extend(
        /** @lends module:facetResultsFilter.FacetResultsFilterModel.prototype **/
        {
            /**
            * Default model options
            * @default
            */
            defaults: {
                template: "<div class='facet-search-filter <% if(!showAllFacets){%>facet-hided<%}%>'><% " +
                    "_.forEach(facet.Values, function(value,key){" +
                    "%><p class='facet-value <% if(highlightBehaviour<=key){ %> hide-facet-value <% } %>' data-facetValue='<%= value.Name !== '' ? encodeURI(value.Name) : '_empty_' %>'>" +
                    "<span><%= value.Name !== '' ? value.Name : emptyText %> " +
                    "<span class='facet-count'>(<%= value.Count %>)</span>" +
                    "</span>" +
                    "</p><%" +
                    " }); %>" +
                    "<% if(highlightBehaviour>=1){ %>" +
                    "<div class='toogle-facet-visibility'><% if(showAllFacets){ %><%=showLessText%><%}else{%><%=showMoreText%><%} %></div>" +
                    "<%}%>" +
                    "</div>",

                templateMulti: "<div class='facet-search-filter <% if(!showAllFacets){%>facet-hided<%}%>'><% " +
                    "_.forEach(facet.Values, function(value,key){" +
                    "%><p class='facet-value <% if(highlightBehaviour<=key){ %> hide-facet-value <% } %>' data-facetValue='<%= value.Name !== '' ? encodeURI(value.Name) : '_empty_' %>'>" +
                    "<input type='checkbox' name='facetValue' />" +
                    "<label for='facetName'><%= value.Name !== '' ? value.Name : emptyText %> " +
                    "<span class='facet-count' data-facetCount='<%= value.Count %>'>(<%= value.Count %>)</span>" +
                    "</label>" +
                    "</p><%" +
                    " }); %>" +
                    "<% if(highlightBehaviour>=1){ %>" +
                    "<div class='toogle-facet-visibility'><% if(showAllFacets){ %><%=showLessText%><%}else{%><%=showMoreText%><%} %></div>" +
                    "<%}%>" +
                    "</div>",
                dataProperties: {},
                blockNextRequest: false,
                resultData: {},
                timeStamp: '',
                showAllFacets: false,
                sig: []
            },
            /**
            * Listens to changes on facets and hash
           * @listens module:XA.component.search.vent~event:facet-data-loaded
           * @listens module:XA.component.search.vent~event:facet-data-filtered
           * @listens module:XA.component.search.vent~event:facet-data-partial-filtered
           * @listens module:XA.component.search.vent~event:hashChanged
           */
            initialize: function () {
                //event to get data at the begining or in case that there are no hash parameters in the url - one request for all controls
                XA.component.search.vent.on("facet-data-loaded", this.processData.bind(this));
                //if in the url hash we have this control facet name (someone clicked this control) then we have to listen for partial filtering
                XA.component.search.vent.on("facet-data-partial-filtered", this.processData.bind(this));
                //in case that we are not filtering by this control (not clicked)
                XA.component.search.vent.on("facet-data-filtered", this.processData.bind(this));
                //event after change of hash
                XA.component.search.vent.on("hashChanged", this.updateComponent.bind(this));

                this.set({ facetArray: [] });
            },
            /**
             * Toggles value of blockNextRequest variable
             * @memberof module:facetResultsFilter.FacetResultsFilterModel
             * @alias module:facetResultsFilter.FacetResultsFilterModel#toggleBlockRequests
             */
            toggleBlockRequests: function () {
                var state = this.get("blockNextRequest");
                this.set(this.get("blockNextRequest"), !state);
            },
            /**
            * Processes data that comes as parameter update
            * model and sort facets
            * @param {Object} data Data from server with facet values
            * @memberof module:facetResultsFilter.FacetResultsFilterModel
            * @alias module:facetResultsFilter.FacetResultsFilterModel#processData
            */
            processData: function (data) {
                var inst = this,
                    dataProperties = this.get('dataProperties'),
                    sig = dataProperties.searchResultsSignature.split(','),
                    sortOrder = dataProperties.sortOrder,
                    i;

                if (data.Signature === null) {
                    data.Signature = "";
                }


                for (i = 0; i < sig.length; i++) {
                    if (data.Facets.length > 0 && (data.Signature === sig[i])) {
                        var facedData = _.find(data.Facets, function (f) {
                            return f.Key.toLowerCase() === inst.get('dataProperties').f.toLowerCase();
                        });
                        if (facedData !== undefined) {
                            this.sortFacetArray(sortOrder, facedData.Values);
                            inst.set({ resultData: facedData });
                        }
                    }
                }
            },
            /**
             * Updates model value 'facetArray' with values from valuesString parameter
             * @param {String} valuesString facet values separated by coma
             * @memberof module:facetResultsFilter.FacetResultsFilterModel
             * @alias module:facetResultsFilter.FacetResultsFilterModel#updateFacetArray
             */
            updateFacetArray: function (valuesString) {
                if (valuesString) {
                    var values = valuesString.split(','),
                        array = this.get('facetArray');
                    for (var i = 0; i < values.length; i++) {
                        array.push(values[i]);
                    }
                    this.set({ facetArray: _.unique(array) });
                }
            },
            /**
             * Sets option selected value to model based on hash
             * @param {Object} hash Hash stored as an object
             * @memberof module:facetResultsFilter.FacetResultsFilterModel
             * @alias module:facetResultsFilter.FacetResultsFilterModel#updateComponent
             */
            updateComponent: function (hash) {
                var sig = this.get("sig");
                for (i = 0; i < sig.length; i++) {
                    if (!hash.hasOwnProperty(sig[i])) {
                        this.set({ facetArray: [] });
                    } else {
                        this.updateFacetArray(hash[sig[i]]);
                    }
                    //in some cases change of facetArray doesn't trigger model change event (why?) and view isn't updates
                    //and because of that timeStamp is updated which properly triggers model change event
                    this.set("timeStamp", (new Date()).getTime());
                }
            }
        });
    /**
    * @name module:facetResultsFilter.FacetResultsFilterView
    * @constructor
    * @augments Backbone.View
    */
    var FacetResultsFilterView = XA.component.search.baseView.extend(
        /** @lends module:facetResultsFilter.FacetResultsFilterView.prototype **/
        {
            /**
            * Initially sets data to model and watches events on which
            * view should be updated
            * @listens module:facetResultsFilter.FacetResultsFilterModel~event:change
            * @memberof module:facetResultsFilter.FacetResultsFilterView
            * @alias module:facetResultsFilter.FacetResultsFilterView#initialize
            */
            initialize: function () {
                var dataProperties = this.$el.data(),
                    hash = queryModel.parseHashParameters(window.location.hash),
                    properties = dataProperties.properties,
                    signatures,
                    i;


                if (dataProperties.properties.searchResultsSignature === null) {
                    dataProperties.properties.searchResultsSignature = "";
                }

                signatures = this.translateSignatures(properties.searchResultsSignature, properties.f);

                this.model.set({ dataProperties: properties });
                this.model.set("sig", signatures);

                for (i = 0; i < signatures.length; i++) {
                    if (!jQuery.isEmptyObject(_.pick(hash, signatures[i]))) {
                        var values = _.values(_.pick(hash, signatures[i]))[0];
                        this.model.updateFacetArray(values)
                    }
                }

                this.model.on("change", this.render, this);
            },
            /**
             * list of events for Backbone View
            * @memberof module:facetResultsFilter.FacetResultsFilterView
            * @alias module:facetResultsFilter.FacetResultsFilterView#events
             */
            events: {
                'click .facet-value': 'updateFacet',
                'click .filterButton': 'updateFacet',
                'click .clear-filter': 'removeFacet',
                'click .bottom-remove-filter > button': 'removeFacet',
                'click .toogle-facet-visibility': 'toogleFacetVisibility'
            },

            toogleFacetVisibility: function () {
                var showFacets = this.model.get('showAllFacets');
                this.model.set('showAllFacets', !showFacets);


            },
            /**
            * Updates model 'facetArray' based on params
            * @param {Event}  param Event object with current target
            * @memberof module:facetResultsFilter.FacetResultsFilterView
            * @alias module:facetResultsFilter.FacetResultsFilterView#updateFacet
            */
            updateFacet: function (param) {
                var currentFacet = $(param.currentTarget),
                    facetArray = this.model.get('facetArray'),
                    properties = this.model.get('dataProperties'),
                    facetClose = this.$el.find('.facet-heading > span'),
                    facetGroup = currentFacet.parents('.component-content').find('.facet-search-filter'),
                    facetName = properties.f.toLowerCase(),
                    facetDataValue = currentFacet.data('facetvalue'),
                    facetValue = typeof facetDataValue !== "undefined" ? decodeURIComponent(facetDataValue) : facetDataValue,
                    sig = this.model.get('sig'),
                    index,
                    hash = {},
                    i;

                if (properties.multi) {
                    if (facetValue) {
                        if (currentFacet.is(':not(.active-facet)')) {
                            this.setActiveFacet(facetName, facetValue);
                            facetArray.push(facetValue);
                        } else {
                            currentFacet.removeClass('active-facet');

                            currentFacet.find('[type=checkbox]').prop('checked', false);
                            currentFacet.find('[type=checkbox] + label:after').css({ 'background': '#fff' });

                            index = facetArray.indexOf(facetValue);
                            if (index > -1) {
                                facetArray.splice(index, 1);
                            }

                            if (facetArray.length == 0) {
                                facetClose.removeClass('has-active-facet');
                            }
                        }
                        this.model.set({ facetArray: facetArray });
                    }

                    //is there any better way to check what action start method?
                    if (currentFacet[0].type == "button") {
                        for (i = 0; i < sig.length; i++) {
                            hash[sig[i]] = _.uniq(facetArray, function (item) {
                                return JSON.stringify(item);
                            }).toString();
                        }
                        queryModel.updateHash(hash);
                    }
                } else {
                    if (facetValue) {
                        for (i = 0; i < sig.length; i++) {
                            hash[sig[i]] = facetValue;
                        }
                        facetGroup.data('active-facet', hash);
                        this.setActiveFacet(facetName, facetValue);
                        queryModel.updateHash(hash);
                    }
                }

            },
            /**
            * Sets default values for Search Result Filter and updates hash accordingly
            * @param {Event} evt Event object
            * @memberof module:facetResultsFilter.FacetResultsFilterView
            * @alias module:facetResultsFilter.FacetResultsFilterView#removeFacet
            */
            removeFacet: function (evt) {
                evt.preventDefault();

                var facets = this.$el,
                    facetClose = facets.find('.facet-heading > span'),
                    facetValues = facets.find('.facet-value'),
                    sig = this.model.get('sig');

                queryModel.updateHash(this.updateSignaturesHash(sig, "", {}));

                facetClose.removeClass('has-active-facet');

                _.each(facetValues, function (single) {
                    var $single = $(single);
                    if ($single.hasClass('active-facet')) {
                        $single.removeClass('active-facet');
                        $single.find('[type=checkbox]').prop('checked', false);
                        $single.find('[type=checkbox] + label:after').css({ 'background': '#fff' });
                    }
                });

                this.model.set({ facetArray: [] });
            },
            /**
            * Renders view
            * @memberof module:facetResultsFilter.FacetResultsFilterView
            * @alias module:facetResultsFilter.FacetResultsFilterView#render
            */
            render: function () {
                var inst = this,
                    resultData = this.model.get("resultData"),
                    facetClose = this.$el.find('.facet-heading > span'),
                    facetNames = this.model.get('dataProperties').f.split('|'),
                    emptyValueText = this.model.get('dataProperties').emptyValueText,
                    highlightThreshold = this.model.get('dataProperties').highlightThreshold,
                    showLessText = this.model.get('dataProperties').showLessText,
                    showMoreText = this.model.get('dataProperties').showMoreText,
                    highlightBehaviour = parseInt(this.model.get('dataProperties').highlightBehaviour),
                    showAllFacets = this.model.get('showAllFacets'),
                    hash = queryModel.parseHashParameters(window.location.hash),
                    sig = this.model.get('sig'),
                    template, facetName, templateResult;

                //checks if page is opened from disc - if yes then we are in Creative Exchange mode
                if (window.location.href.startsWith("file://")) {
                    return;
                }
                this.manageVisibilityByData(this.$el, resultData)
                if (resultData !== undefined) {
                    if (inst.model.get('dataProperties').multi === true) {
                        template = _.template(inst.model.get("templateMulti"));
                    } else {
                        template = _.template(inst.model.get("template"));
                    }
                    templateResult = template({
                        facet: resultData, emptyText: emptyValueText, showLessText: showLessText,
                        showMoreText: showMoreText, highlightBehaviour: highlightBehaviour, showAllFacets: showAllFacets
                    });
                }

                inst.$el.find(".contentContainer").html(templateResult);

                //checks url hash for facets and runs setActiveFacet method for each facet filter
                _.each(facetNames, function (val) {
                    facetName = val.toLowerCase();
                    for (var i = 0; i < sig.length; i++) {
                        if (!jQuery.isEmptyObject(_.pick(hash, sig))) {
                            var values = _.values(_.pick(hash, sig))[0];
                            if (values) {
                                inst.setActiveFacet(facetName, values);

                                //If this rendering is supporting multiple signatures, we will mark active facet once.
                                return;
                            }
                        }
                    }
                });

                //highlights facets count greater than chosen threshold
                if (highlightThreshold) {
                    this.handleThreshold(highlightThreshold);
                }

                //if no facet is selected, remove previously highlighted cross icon (while back button)
                if (this.model.get("facetArray").length === 0) {
                    facetClose.removeClass('has-active-facet');
                } else {
                    facetClose.addClass('has-active-facet');
                }
            },
            /**
            * Manages search result filter active state
            * @param {String} facetGroupName facet name
            * @param {String} facetValueName facet value
            * @memberof module:facetResultsFilter.FacetResultsFilterView
            * @alias module:facetResultsFilter.FacetResultsFilterView#setActiveFacet
            */
            setActiveFacet: function (facetGroupName, facetValueName) {
                var properties = this.model.get('dataProperties'),
                    facetChildren = this.$el.find('p[data-facetvalue]'),
                    facetClose = this.$el.find('.facet-heading > span'),
                    inst = this,
                    facetValue,
                    values;

                facetValueName = facetValueName.toString().toLowerCase();
                facetValue = this.$el.find("[data-facetvalue]").filter(function () {
                    return decodeURIComponent($(this).attr("data-facetvalue").toLowerCase()) === facetValueName;
                });


                if (typeof (facetValueName) !== "undefined" && facetValueName !== null) {
                    values = facetValueName.split(',');
                } else {
                    return;
                }

                if (values.length > 1) {
                    properties.multi = true;
                }

                if (properties.multi) {
                    //multi selection facet search results
                    _.each(facetChildren, function (val) {

                        if (values.length > 1) {
                            for (var i = 0, l = values.length; i < l; i++) {
                                facetValue = inst.$el.find("[data-facetvalue]").filter(function () {
                                    return $(this).attr('data-facetvalue').toLowerCase() === values[i];
                                });
                                if (val === facetValue[0]) {
                                    $(val).addClass('active-facet');
                                    $(val).find('[type=checkbox]').prop('checked', true);
                                }
                            }
                        }

                        if (val === facetValue[0]) {
                            $(val).addClass('active-facet');
                            $(val).find('[type=checkbox]').prop('checked', true);
                        }


                    });
                } else {
                    //single selection facet search results filter allows only one facet type to be selected
                    _.each(facetChildren, function (val) {
                        if (val !== facetValue[0]) {
                            $(val).removeClass('active-facet');
                            $(val).find('[type=checkbox]').prop('checked', false);
                            $(val).find('[type=checkbox] + label:after').css({ 'background': '#fff' });
                        } else {
                            $(val).addClass('active-facet');
                        }
                    });
                }

                //adds active class to group close button
                facetClose.addClass('has-active-facet');
            },
            /**
            * Manages search result filter highlight of threshold
            * @param {Number} highlightThreshold value of threshold highlight
            * @memberof module:facetResultsFilter.FacetResultsFilterView
            * @alias module:facetResultsFilter.FacetResultsFilterView#handleThreshold
            */
            handleThreshold: function (highlightThreshold) {
                var facets = this.$el.find('.facet-search-filter').children('p');

                _.each(facets, function (single) {
                    var $facet = $(single),
                        $facetCount = $facet.find('.facet-count'),
                        facetCount = $facetCount.data('facetcount');

                    if (facetCount > highlightThreshold) {
                        $facetCount.addClass('highlighted');
                    }
                });
            }
        });
    /**
    * For each search result component on a page creates instance of 
    * ["FacetResultsFilterModel"]{@link module:facetResultsFilter.FacetResultsFilterModel} and 
    * ["FacetResultsFilterView"]{@link module:facetResultsFilter.FacetResultsFilterView} 
    * @memberOf module:facetResultsFilter
    * @alias module:facetResultsFilter.init
    */
    api.init = function () {
        if ($("body").hasClass("on-page-editor") || initialized) {
            return;
        }

        queryModel = XA.component.search.query;
        apiModel = XA.component.search.ajax;
        urlHelperModel = XA.component.search.url;

        var facetResultsFilterList = $(".facet-single-selection-list");
        _.each(facetResultsFilterList, function (elem) {
            var model = new FacetResultsFilterModel(),
                view = new FacetResultsFilterView({ el: $(elem), model: model });
        });

        initialized = true;
    };
    /**
    * Returns information about facet component
    * @memberOf module:facetResultsFilter
    * @alias module:facetResultsFilter.getFacetDataRequestInfo
    * @returns {Array<FacetDataRequestInfo>} facet data needed for request
    */
    api.getFacetDataRequestInfo = function () {
        var facetList = $(".facet-single-selection-list"),
            result = [];

        _.each(facetList, function (elem) {
            var properties = $(elem).data().properties,
                signatures = properties.searchResultsSignature.split(','),
                i;

            for (i = 0; i < signatures.length; i++) {
                result.push({
                    signature: signatures[i] === null ? "" : signatures[i],
                    facetName: properties.f,
                    endpoint: properties.endpoint,
                    showMoreText: properties.showMoreText,
                    showLessText: properties.showLessText,
                    highlightBehaviour: properties.highlightBehaviour,
                    s: properties.s,
                    filterWithoutMe: !properties.collapseOnSelection
                });
            }
        });

        return result;
    };

    return api;

}(jQuery, document));

XA.register('facetResultsFilter', XA.component.search.facet.resultsfilter);