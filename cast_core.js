/* Cast CMS System for dynamic loading */

/* (c) Matthew Wardrop */

function Cast() {
	$CAST = this;
	this.STACKS = {};
	this.EVENT_LISTENERS = {};
	this.INTERACTION_HANDLERS = {};
	Cast.prototype.CONFIG.parent = this;
	this.load_components(["cast_config","cast_views","cast_utils","iscroll"], function(data, textStatus, jqXHR) {$CAST.init();});
}

Cast.prototype.CONFIG = new Object();

Cast.prototype.init = function() {
	$(window).resize(function() {$CAST.notifyEvent("resize");});
	$(document).ready(function() {$CAST.notifyEvent("ready");});
	
	this.addEventListener(this.onInteractHandler,["onInteract"]);
	/* Load configuration */
	this.CONFIG.init();
	this.showSheet({'init':true});
	
	this.notifyEvent("resize");
}

Cast.prototype.load_components = function (components,onLoaded) {
	var completed = 0;
	
	var aggregate = function() {
		completed++;
		if (completed == components.length) {
			onLoaded(null,null,null);
		}
	}
	
	for (component in components) {
		$.ajax({
		  url: components[component]+".js",
		  dataType: "script",
		  success: aggregate,
		  error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown) }
		});
	}
}

Cast.prototype.request = function (url,success,error) {
	$.ajax({
		async: true,
		dataType: "jsonp",
		url: url,
		timeout: 20000,
		success: success,
		error: error
	});
}

Cast.prototype.showSheet = function(query,stack) {
	var url = this.CONFIG.SERVER + this.CONFIG.SCRIPT;
	if (query != undefined) {
		url += "?";
		for (q in query) {
			url += q + "=" + query[q];
		}
	}
	
	function success(data,a,b) {
		$CAST.renderSheet(data,stack);
	}
	
	function error(jqXHR, textStatus, errorThrown) {
		alert("cannot load sheet" + errorThrown);
	}
	
	this.request(url,success,error);
}

Cast.prototype.processInfo = function (sheetInfo) {
	for (field in this.CONFIG.DEFAULT_DISPLAY) {
		if (!(field in sheetInfo)) {
			sheetInfo[field] = this.CONFIG.DEFAULT_DISPLAY[field];
		}
	}
	return sheetInfo;
}

Cast.prototype.defaultRenderHandler = function (element, data) {
	if (data instanceof Object) {
		if ("view" in data) {
			$(element).empty();
			$(element).append( (new this.SUPPORTED_VIEWS[data["view"]](this,data["view_opts"])).render() );
		}
	} else {
		$(element).text(data);
	}
}

Cast.prototype.getCSSList = function () {
	var css = [];
	$("head > link[rel='stylesheet']").each(
		function (i) {
			css[css.length] = $(this).attr('href');
		}
	);
	return css;
}

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
}

Cast.prototype.renderSheet = function (sheetInfo,stack) {
	sheetInfo = this.processInfo(sheetInfo);
	
	order = []
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
			this.castDirectiveHandler(field, sheetInfo[field]);
			continue;
		}
		if (field in this.CONFIG.RENDER_HANDLERS) {
			var handler = this.CONFIG.RENDER_HANDLERS[field];
			if (handler instanceof Function) {
				this.CONFIG.RENDER_HANDLERS[field](this,sheetInfo[field]);
			} else if (isDOMElement(handler)) {
				this.defaultRenderHandler(handler,sheetInfo[field]);
			} else if (typeof handler == "string") {
				element = document.getElementById(field);
				if (element != null) {
					this.defaultRenderHandler(element,sheetInfo[field]);
				}
			}
		}
	}
	this.notifyEvent("render_complete");
}



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
}

Cast.prototype.removeEventListener = function (listener,events) {
	for (var i in events) {
		delete this.EVENT_LISTENERS[events[i]][listener];
	}
}

Cast.prototype.notifyEvent = function (event,info) {
	for (var i in this.EVENT_LISTENERS[event]) {
		this.EVENT_LISTENERS[event][i](info);
	}
}

Cast.prototype.onInteractHandler = function(id) {
	var handler = $CAST.INTERACTION_HANDLERS[id];
	if (handler != null) {
		handler();
	}
}
