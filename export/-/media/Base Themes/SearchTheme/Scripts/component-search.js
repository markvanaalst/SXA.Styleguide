/**
* @typedef {} FacetDataRequestInfo requests data from each facet component stored in object
* @property {String} signature - signature of facet
* @property {String} facetName - facet name
* @property {String} endpoint - endpoint property
* @property {Boolean} filterWithoutMe - should this filter be a part of filtering process
*/
/**
* @typedef {Object} facetRequestData requests data from each facet component stored in object
* @property {String} endpoint - endpoint property
* @property {Object} data - list of facet names based on signature
*/
/**
 * @namespace XA.component.search
 */
XA.component.search = {};
XA.component.search.facet = {};
XA.component.search.results = {};

/**
 * @namespace XA.component.search.vent
 */
/**
* Fired when hash changed
* @event XA.component.search.vent#hashChanged
* @type {object}
*/
/**
* Fired after response from server with filtered facet data
* @event XA.component.search.vent#facet-data-loaded
* @type {object}
*/
/**
* Fired after response from server with filtered facet data
* @event XA.component.search.vent#facet-data-filtered
* @type {object}
*/
/**
* Fired after response from server with filtered partial facet data
* @event XA.component.search.vent#facet-data-partial-filtered
* @type {object}
*/
/**
* Fired by load more component
* @event XA.component.search.vent#loadMore
* @type {object}
*/
XA.component.search.vent = _.extend({}, Backbone.Events);
