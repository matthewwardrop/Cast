/* Cast CMS System for dynamic loading */

/* (c) Matthew Wardrop */

/* All instances of cast must call this function */

// Sandbox Cast as in jQuery

(function(window,undefined) {
	var document = window.document,	navigator = window.navigator,location = window.location;
	
//%CAST_SCRIPTS
	
	window['CastProto'] = Cast;
})(window);

function Cast(varname,config_file) {
	window[varname] = new CastProto(varname,config_file);
	return window[varname];
}
