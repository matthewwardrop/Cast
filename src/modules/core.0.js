/* Cast Core */
function Cast (varname, config_file) { //TODO: Import configuration from non cast_config url.
	$CAST = this;
	this.varname = varname;
	this.STACKS = {};
	this.CURRENT_STACK = "default";
	this.EVENT_LISTENERS = {};
	this.INTERACTION_HANDLERS = {};
	this.CONFIG.parent = this;
	if (config_file === undefined) {
		alert('Config File not specified!');
		return;
	}
	this.load_components([[config_file,"cast"],"iscroll"], function(data, textStatus, jqXHR) {$CAST.init();});
};

/* Initialise required configuration options */
Cast.prototype.CONFIG = new Object();
Cast.prototype.CONFIG.SERVER = null;
Cast.prototype.CONFIG.SCRIPT = null;
Cast.prototype.CONFIG.init = null;
Cast.prototype.CONFIG.SCROLL_VIEWS = []; // TODO: Move from config
Cast.prototype.CONFIG.DEFAULT_DISPLAY = {};
Cast.prototype.CONFIG.RENDER_HANDLERS = {};
Cast.prototype.CONFIG.LOCAL_METHODS = {};
Cast.prototype.CONFIG.FACTORIES = {};
Cast.prototype.CONFIG.INIT_QUERY = null;
Cast.prototype.CONFIG.DEFAULT_FACTORY = null;

Cast.prototype.init = function() {
	$(window).resize(function() {$CAST.notifyEvent("resize");});
	$(document).ready(function() {$CAST.notifyEvent("ready");});
	
	this.addEventListener(this.onInteractHandler,["onInteract"]);
	this.addEventListener(this.render,["render"]);
	window.addEventListener("hashchange", this.popStackTo, false);
	
	/* Load configuration */
	this.CONFIG.init();
	this.loadSheet.apply(this,this.CONFIG.INIT_QUERY);
	
	this.notifyEvent("resize");
};

Cast.prototype.get_cast_uri = function () {
	var path = document.getElementById("cast").src;
	path = path.substring(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\\\"))); 
	return path;
};

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
	stack = $CAST.CURRENT_STACK;
	target = window.location.hash;
	if (target == "") {
		target = "#1";
	}
	$CAST.popStack(stack,$CAST.STACKS[stack].length-target.replace("#",""));
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

Cast.prototype.onInteractHandler = function(id,domObject) {
	var handler = $CAST.INTERACTION_HANDLERS[id];
	if (handler != null) {
		handler.run(domObject);
	}
};
