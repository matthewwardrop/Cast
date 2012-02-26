Cast.prototype.preference = function (key, value) {
	if (value == null) {
		return window.localStorage.getItem(key);
	}
	return window.localStorage.setItem(key,value);
};