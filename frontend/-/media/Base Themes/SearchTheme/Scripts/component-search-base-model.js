/**
 * include functionality for sorting facet array
 * @module searchBaseModel
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {baseModel} list of methods for working with facet array
*/
XA.component.search.baseModel = (function ($, document) {
	/**
	* @name module:searchBaseModel.baseModel
	* @constructor
	* @augments Backbone.Model
	*/
	return Backbone.Model.extend(
		/** @lends module:searchBaseModel.baseModel.prototype **/
		{
			/**
			 * Sort facets by sort order option
			 * @param {String} sortOrder method of sorting - SortByCount|SortByNames
			 * @param {Array} facetArray  list of facets that should be sorted
			 */
			sortFacetArray: function (sortOrder, facetArray) {
				switch (sortOrder) {
					case 'SortByCount': {
						facetArray.sort(function (a, b) { return b.Count - a.Count });
						break;
					}
					case 'SortByNames':
					default: {
						//no need to sort by names as values are sorted that way by default
						break;
					}
				}
			}
		});

}(jQuery, document));

XA.register('searchBaseModel', XA.component.search.baseModel);
