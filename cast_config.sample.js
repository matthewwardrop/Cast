/*
 * This file is for you to configure your views. This is a sample configuration
 * file.
 */

Cast.prototype.CONFIG.SERVER = "http://192.168.0.13/cast/";
Cast.prototype.CONFIG.SCRIPT = "cast.cgi";

Cast.prototype.CONFIG.init = function() {
	var titleDiv = document.createElement("div");
	titleDiv.setAttribute("id","title");
	titleDiv.style.height="100px";
	document.body.appendChild(titleDiv);
	var bodyDiv = document.createElement("div");
	bodyDiv.setAttribute("id","content");
	bodyDiv.style.background = "#eee";
	bodyDiv.style.position = "relative";
	document.body.appendChild(bodyDiv);
	var menuDiv = document.createElement("div");
	menuDiv.setAttribute("id","menu");
	titleDiv.style.height="100px";
	document.body.appendChild(menuDiv);
	
	this.parent.addEventListener(this.onResize,["resize"]);
	this.parent.addEventListener(this.onReady,["render_complete"]);
}


Cast.prototype.CONFIG.SCROLL_VIEWS = []
Cast.prototype.CONFIG.onReady = function() {
	for (var i in $CAST.CONFIG.SCROLL_VIEWS) {
		var view = $CAST.CONFIG.SCROLL_VIEWS[i];
		$(view).height($(view).parent().height());
		new iScroll(view);
	}
}

Cast.prototype.CONFIG.onResize = function() {
	$("#content").height($(window).height() - 200);
	$CAST.notifyEvent("render_complete");
}

Cast.prototype.CONFIG.DEFAULT_DISPLAY = {
	title: 'No title specified',
}

Cast.prototype.reLayout = function (cast,opts) {
	if (opts.title == true) {
		$("#title").show();
	} else {
		$("#title").hide();
	}
}

Cast.prototype.CONFIG.RENDER_HANDLERS = {
	"layout": Cast.prototype.reLayout,
	"title": "title",
	"content": "content"
}


