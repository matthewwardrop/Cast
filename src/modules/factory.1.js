/* Factory */
/*
 * Cast depends upon receiving JSON parsed in compliance with the Cast protocol.
 * The methods here are the different "factories" to generate these formats.
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
