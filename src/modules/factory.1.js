/* Factory */

Cast.prototype.CONFIG.DEFAULT_FACTORY = null; //TODO: USE THIS
Cast.prototype.CONFIG.FACTORIES = {}; // TODO: USE THIS

/*
 * Cast depends upon receiving JSON parsed in compliance with the Cast protocol.
 * The methods here are the different "factories" to generate these formats.
 */

/**
 * Get a sheet in the Cast protocol format.
 * @name getSheet
 * @memberOf Cast#
 * @function
 * @param {String} type The type of factory to use to generate the sheet.
 * @param {Object} opts A diction of options to pass to the relevant factory.
 * @param {Function} success A callback function to receive the sheet information if successful.
 * @param {Function} error A callback function to receive the sheet information if unsuccessful.
 */
Cast.prototype.getSheet = function(type,opts,success,error) {
	
	/* Method 1: Download JSON file from server */
	function UrlFactory (cast) {
		var url = opts.url;
		if (url == undefined || url == null) {
			url = cast.CONFIG.SERVER + cast.CONFIG.SCRIPT;
		}
		var query = opts.query;
		if (query == null || query == undefined) {
			query = opts;
		}
		
		return cast.request(url,query,success,error);
	}
	
	/* Method 2: Local JSON file */
	function ScriptFactory (cast) {
		var factory = opts.factory;
		if (factory == undefined || factory == null) {
			factory = cast.CONFIG.DEFAULT_FACTORY;
		}
		
		factory = cast.CONFIG.FACTORIES[factory];
		if (factory == undefined || factory == null) {
			alert("no such factory " + opts.factory);
		}
		
		try {
			success(factory(opts));
		} catch (e) {
			alert("Cannot run factory: "+e); // TODO: USE error
		}
	}
	
	SUPPORTED_FACTORIES = {
		"url": UrlFactory,
		"script": ScriptFactory
	};
	
	if (type == null) {
		type = "url";
	}
	
	SUPPORTED_FACTORIES[type](this);
};
