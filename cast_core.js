/* Cast CMS System for dynamic loading */

/* (c) Matthew Wardrop */

function Cast() {
	$CAST = this;
	this.STACKS = {};
	this.CURRENT_STACK = "default";
	this.EVENT_LISTENERS = {};
	this.INTERACTION_HANDLERS = {};
	Cast.prototype.CONFIG.parent = this;
	this.load_components(["cast_config","cast_views","cast_utils","iscroll","cast_actions","cast_session"], function(data, textStatus, jqXHR) {$CAST.init();});
}

Cast.prototype.CONFIG = new Object();

Cast.prototype.init = function() {
	$(window).resize(function() {$CAST.notifyEvent("resize");});
	$(document).ready(function() {$CAST.notifyEvent("ready");});
	
	this.addEventListener(this.onInteractHandler,["onInteract"]);
	this.addEventListener(this.render,["render"]);
	/* Load configuration */
	this.CONFIG.init();
	this.showSheet({'init':true});
	
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
	
	for (component in components) {
		$.ajax({
		  url: this.get_cast_uri() + "/" + components[component]+".js",
		  dataType: "script",
		  success: aggregate,
		  error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown); }
		});
	}
};

Cast.prototype.request = function (url,success,error) {
	$.ajax({
		async: true,
		dataType: "jsonp",
		url: url,
		timeout: 20000,
		success: success,
		error: error
	});
};

Cast.prototype.showSheet = function(query,stack) {
	var url = this.CONFIG.SERVER + this.CONFIG.SCRIPT;
	if (query != undefined) {
		url += "?";
		for (q in query) {
			url += q + "=" + query[q] + "&amp;";
		}
	}
	
	function success(data,a,b) {
		$CAST.renderSheet(data,stack);
	}
	
	function error(jqXHR, textStatus, errorThrown) {
		alert("cannot load sheet" + errorThrown);
	}
	
	this.request(url,success,error);
};

Cast.prototype.processInfo = function (sheetInfo) {
	for (field in this.CONFIG.DEFAULT_DISPLAY) {
		if (!(field in sheetInfo)) {
			sheetInfo[field] = this.CONFIG.DEFAULT_DISPLAY[field];
		}
	}
	return sheetInfo;
};

Cast.prototype.defaultRenderHandler = function (element, data) {
	try {
		$(element).empty();
		$(element).append( this.getView(data).render() );
	} catch(err) {
		alert(err);
	}
};

Cast.prototype.getCSSList = function () {
	var css = [];
	$("head > link[rel='stylesheet']").each(
		function (i) {
			css[css.length] = $(this).attr('href');
		}
	);
	return css;
};

Cast.prototype.castDirectiveHandler = function (field,info) {
	if (field == "cast_css_add") {
		$(info).each(function() {
			if ($.inArray(this,$CAST.getCSSList())==-1) {
				$("head").append("<link>");
				css = $("head").children(":last");
				css.attr({
				  rel:  "stylesheet",
				  type: "text/css",
				  href: this
				});
			}
		});
    } else if (field == "cast_css_remove") {
    	$(info).each(function() {
			if ($.inArray(this,$CAST.getCSSList())>-1) {
				$("head > link[href='"+this+"']").remove();
			}
    	});
    }
};

Cast.prototype.renderSheet = function (sheetInfo,stack) {
	this.addToStack(sheetInfo, stack);
	this.notifyEvent("render");
};

Cast.prototype.render = function () {
	
	sheetInfo = $CAST.getCurrentSheet();
	
	sheetInfo = $CAST.processInfo(sheetInfo);
	
	order = [];
	if ("cast_order" in sheetInfo) {
		order = sheetInfo['cast_order'];
		delete sheetInfo.cast_order;
		for (var key in sheetInfo) {
			if (!(key in order)) {
				order[order.length] = key;
			}
		}
	} else {
		order = keys(sheetInfo);
	}
	
	for (field in sheetInfo) {
		if (field.startsWith("cast_")) {
			$CAST.castDirectiveHandler(field, sheetInfo[field]);
			continue;
		}
		if (field in $CAST.CONFIG.RENDER_HANDLERS) {
			var handler = $CAST.CONFIG.RENDER_HANDLERS[field];
			if (handler instanceof Function) {
				$CAST.CONFIG.RENDER_HANDLERS[field]($CAST,sheetInfo[field]);
			} else if (isDOMElement(handler)) {
				$CAST.defaultRenderHandler(handler,sheetInfo[field]);
			} else if (typeof handler == "string") {
				element = document.getElementById(handler);
				if (element != null) {
					$CAST.defaultRenderHandler(element,sheetInfo[field]);
				}
			}
		}
	}
	$CAST.notifyEvent("render_complete");
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
	this.notifyEvent("render");
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

/* EVENT MECHANISMS */
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
