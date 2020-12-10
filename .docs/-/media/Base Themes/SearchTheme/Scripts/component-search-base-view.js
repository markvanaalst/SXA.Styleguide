/**
 * Provides methods for translate and update signature
 * @module searchBaseView
 * @param  {jQuery} $ Instance of jQuery
 * @param  {Document} document dom document object
 * @return {baseView} list of Api methods for work with signature
*/
XA.component.search.baseView = (function ($, document) {
	/**
	* @name module:searchBaseView.baseViewModel
	* @constructor
	* @augments Backbone.Model
	*/
	return Backbone.View.extend(
		/** @lends module:searchBaseView.baseViewModel.prototype **/
		{

			initialize: function () {
			},
			/**
			 * 
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
			 * 
			 * @param {*} sig 
			 * @param {*} value 
			 * @param {*} hash 
			 */
			updateSignaturesHash: function (sig, value, hash) {
				for (var i = 0; i < sig.length; i++) {
					hash[sig[i]] = value;
				}
				return hash;
			},
			/**
			 * Manages whether the component should be visible, depending on data.
			 * @param {DomElement} component Dom element that we want ho show\hide
			 * @param {Object} data Object with facet data. Depending on data, component will be hidden or shown.
			 */
			manageVisibilityByData:function(component, data){
				if (_.size(data)===0 || (typeof data.Values!== "undefined" && data.Values.length==0)){
					$(component).hide();
				}else{
					$(component).show();
				}
			}
		});

}(jQuery, document));

XA.register('searchBaseView', XA.component.search.baseView);
