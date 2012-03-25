/**
 * Set a simple preference.
 * @name preference
 * @memberOf Cast#
 * @function
 * @param {String} key The preference key.
 * @param {String} value The preference value (any non-String values will be cast to a String).
 * @returns {Boolean} Success of save.
 */
Cast.prototype.preference = function (key, value) {
	if (value == null) {
		return window.localStorage.getItem(key);
	}
	return window.localStorage.setItem(key,value);
};
