/* Cast Core */

/**
 * The Cast prototype class.
 * @name Cast
 * @constructor
 * @param varname
 * @param config_file
 */
function Cast (varname, config_file) { //TODO: Import configuration from non cast_config url.
	var that = this;
	this.varname = varname;
	this.STACKS = {};
	this.CURRENT_STACK = "default";
	this.EVENT_LISTENERS = {};
	this.CONFIG.parent = this;
	if (config_file === undefined) {
		alert('Config File not specified!');
		return;
	}
	this.load_components([[config_file,"cast"],"iscroll"], function(data, textStatus, jqXHR) {that.init();});
};

/**
 * Get an instance of Cast.
 * @name getInstance
 * @memberOf Cast
 * @function
 * @param {String} varname Global variable to be used as a reference to this instance.
 * @param {String} config_file URI to the cast configuration file for this instance.
 * @returns {Cast} The new cast instance.
 */
Cast.getInstance = function (varname,config_file) {
	window[varname] = new Cast(varname,config_file);
	return window[varname];
};

/**
 * Wrap the function so that when it is called from a non-Cast object, it still
 * correctly references the right Cast instance.
 * @name wrap
 * @function
 * @memberOf Cast#
 * @param {Function} func The function which is to be called outside of Cast.
 * @returns {Function} The wrapped function
 */
Cast.prototype.wrap = function (func) {
	var varname = this.varname;
	return function () {
		window[varname][func].apply(window[varname],arguments);
	};
};

/* Initialise internal module initialisers */
Cast.prototype.MODULE_INITS = new Object();

/* Initialise required configuration options for core module [other modules can add to this] */
Cast.prototype.CONFIG = new Object();
Cast.prototype.CONFIG.SERVER = null;
Cast.prototype.CONFIG.SCRIPT = null;
Cast.prototype.CONFIG.init = null;
Cast.prototype.CONFIG.INIT_QUERY = null;
Cast.prototype.CONFIG.LOCAL_METHODS = {}; // For processing text

/**
 * The purpose of this function is to edit edit keyboard input to determine if
 * the keystrokes are valid.
 * @name init
 * @function
 * @memberOf Cast#
 */
Cast.prototype.init = function() {
	var that = this;
	
	/* Initialise any modules that need initialising */
	for (var init_name in this.MODULE_INITS) {
		this.MODULE_INITS[init_name].apply(this);
	}
	
	$(window).resize(function() {that.notifyEvent("resize");}); // TODO: BE CONSISTENT Use window.addEventListener...
	$(document).ready(function() {that.notifyEvent("ready");});
	
	this.addEventListener(this.onInteractHandler,["onInteract"]);
	this.addEventListener(this.render,["render"]);
	window.addEventListener("hashchange", this.wrap('popStackTo'), false);
	
	/* Load configuration */
	this.CONFIG.init();
	this.loadSheet.apply(this,this.CONFIG.INIT_QUERY);
	
	this.notifyEvent("resize");
};

/**
* Get the uri of this script (as tagged in the HTML).
* @name get_cast_uri
* @memberOf Cast#
* @function
* @returns The uri of the cast folder.
*/
Cast.prototype.get_cast_uri = function () {
	var path = document.getElementById("cast").src;
	path = path.substring(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\\\"))); 
	return path;
};

/**
 * Load asynchronously the other components required by cast.
 * @name load_components
 * @memberOf Cast#
 * @function
 * @param components
 * @param onLoaded
 */
Cast.prototype.load_components = function (components,onLoaded) {
	var completed = 0;
	
	var aggregate = function() {
		completed++;
		if (completed == components.length) {
			onLoaded(null,null,null);
		}
	};
	
	var makeLocal = function(data,status,jqXHR) {
		eval(data.replace(/\$CAST/g,this.varname));
		aggregate();
	};
	
	for (var i in components) {
		var url;
		var success = aggregate;
		var dataType = "script";
		if ($.isArray(components[i])) {
			var file = components[i][0];
			var source = components[i][1];
			if (source == "cast") {
				url = file;
				dataType = "text";
				success = makeLocal;
				url = file;
			} else {
				url = this.get_cast_uri() + "/" + file +".js";
			}
		} else {
			url = this.get_cast_uri() + "/" + components[i]+".js";
		}
		
		$.ajax({
		  url: url,
		  context: this,
		  dataType: dataType,
		  success: success,
		  error: function(jqXHR, textStatus, errorThrown) { alert("Error loading '"+url+"' (url could be wrong): "+errorThrown); }
		});
	}
};

/**
 * Request a JSON data set from a specified url with a specified query. Light wrapper around JSON ajax request.
 * @name request
 * @function
 * @memberOf Cast#
 * @param {String} url Url to request
 * @param {Object} query Query key-value pairs
 * @param {Function} success Function to call upon success
 * @param {FunctiON} error Function to call upon error
 */
Cast.prototype.request = function (url,query,success,error) {
	$.ajax({
		async: true,
		dataType: "jsonp",
		url: url,
		data: query,
		timeout: 20000,
		success: success,
		error: error
	});
};

/* STACK HANDLING FUNCTIONS */
Cast.prototype.addToStack = function (sheetInfo,stack) {
	if (stack == null) {
		stack = this.CURRENT_STACK;
	}
	if (this.STACKS[stack] == undefined) {
		this.STACKS[stack] = [sheetInfo];
	} else {
		this.STACKS[stack].push(sheetInfo);
	}
	if (this.STACKS[stack].length > 1) {
		window.location.hash = this.STACKS[stack].length;
	}
};

Cast.prototype.clearStack = function (stack) {
	if (stack == null) {
		stack = this.CURRENT_STACK;
	}
	delete this.STACKS[stack];
};

Cast.prototype.popStack = function (stack,count) {
	if (stack == null) {
		stack = this.CURRENT_STACK;
	}
	if (count == null) {
		count = 1;
	}
	for (var i=0; i<count; i++) {
		this.STACKS[stack].pop();
	}
	target = window.location.hash;
	if (target == "") {
		target = "#1";
	}
	if (this.STACKS[stack].length < target.replace("#","")) {
		window.history.back(this.STACKS[stack].length - target.replace("#",""));
	}
	this.notifyEvent("render");
};

Cast.prototype.popStackTo = function () {
	stack = this.CURRENT_STACK;
	target = window.location.hash;
	if (target == "") {
		target = "#1";
	}
	this.popStack(stack,this.STACKS[stack].length-target.replace("#",""));
};

Cast.prototype.getCurrentStack = function () {
	return this.STACKS[this.CURRENT_STACK];
};

Cast.prototype.getCurrentSheet = function () {
	return this.STACKS[this.CURRENT_STACK][this.STACKS[this.CURRENT_STACK].length-1];
};

/* PROCESS TEXT TO GENERATE FINAL STRINGS */
Cast.prototype.processText = function (text) {
	var re = new RegExp("%\\(([a-zA-Z_]+):([^)]+)\\)s","g");
	var groups = re.exec(text);
	while (groups != null) {
		var value = "undefined";
		if (groups[1] in this.CONFIG.LOCAL_METHODS) {
			value = this.CONFIG.LOCAL_METHODS[groups[1]](this,groups[2]);
		}
		text = text.replace(groups[0],value);
		groups = re.exec(text);
	};
	return text;
};

/* EVENT MECHANISMS */ // TODO: CONSIDER USING JQUERY'S on AND off AND trigger
Cast.prototype.addEventListener = function (listener,events) {
	for (var i in events) {
		var event = events[i];
		if (this.EVENT_LISTENERS[event] != undefined) {
			this.EVENT_LISTENERS[event][this.EVENT_LISTENERS[event].length] = listener;
		} else {
			this.EVENT_LISTENERS[event] = [listener];
		}
	}
};

Cast.prototype.removeEventListener = function (listener,events) {
	for (var i in events) {
		delete this.EVENT_LISTENERS[events[i]][listener];
	}
};

Cast.prototype.notifyEvent = function (event) {
	var args = Array.prototype.slice.call(arguments);
	info = args.slice(1);
	for (var i in this.EVENT_LISTENERS[event]) {
		this.EVENT_LISTENERS[event][i].apply(this,info);
	}
};
