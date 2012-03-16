/* RENDER */

/*
 * Rendering config options
 */
Cast.prototype.CONFIG.DEFAULT_DISPLAY = {};
Cast.prototype.CONFIG.RENDER_HANDLERS = {};
Cast.prototype.CONFIG.SCROLL_VIEWS = []; // TODO: Move from config

/*
 * Rendering functions
 */
Cast.prototype.loadSheet = function(type,opts,stack) {
	var that = this;
	function success(data,a,b) {
		that.renderSheet(data,stack);
	}
	
	function error(jqXHR, textStatus, errorThrown) {
		alert("cannot load sheet" + errorThrown);
	}
	
	this.notifyEvent("loading","start");
	this.getSheet(type,opts,success,error);
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
			if ($.inArray(this,this.getCSSList())==-1) {
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
			if ($.inArray(this,this.getCSSList())>-1) {
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
	
	sheetInfo = this.getCurrentSheet();
	
	sheetInfo = this.processInfo(sheetInfo);
	
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
				element = document.getElementById(handler);
				if (element != null) {
					this.defaultRenderHandler(element,sheetInfo[field]);
				}
			}
		}
	}
	this.notifyEvent("render_complete");
	this.notifyEvent("loading","end");
};
