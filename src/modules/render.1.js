/* RENDER */
/*
 * Rendering functions
 */
Cast.prototype.loadSheet = function(type,opts,stack) {		
	function success(data,a,b) {
		$CAST.renderSheet(data,stack);
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
	$CAST.notifyEvent("loading","end");
};
