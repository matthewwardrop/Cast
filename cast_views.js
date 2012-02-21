/* 
 * Implement methods for generating objects that behave something like their
 * their Android counterparts.
 */

function BaseView() {}
BaseView.prototype.render = function() {
	if (!this._render instanceof Function) {
		alert("Unimplemented: _render.");
	} else {
		var onClickID = keys(this.cast.INTERACTION_HANDLERS).length + 1;
		this.cast.INTERACTION_HANDLERS[onClickID] = this.getOnClick(this.opts.onClick);
		var obj = this._render();
		obj.setAttribute("onclick","$CAST.notifyEvent('onInteract',"+onClickID+");");
		
		if (this.opts.scroll == true) {
			var wrapper = document.createElement("div");
			wrapper.appendChild(obj);
			wrapper.setAttribute("class","wrapper");
			this.cast.CONFIG.SCROLL_VIEWS[this.cast.CONFIG.SCROLL_VIEWS.length] = wrapper;
			return wrapper;
		}
		return obj;
	}
}
BaseView.prototype.getOnClick = function(detail) {
	return function() {
		// DO STUFF HERE.
	}
}

/* LIST VIEW */
function ListView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
}
ListView.prototype = new BaseView();
ListView.prototype._render = function() {
	var div = document.createElement("div");
	div.innerHTML = this.opts;
	return div;
}

/* IMAGE VIEW */
function ImageView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
ImageView.prototype = new BaseView();
ImageView.prototype._render = function () {
	var imgView = document.createElement("img");
	imgView.setAttribute("src",this.opts.src);
	return imgView;
}

/* ICON VIEW */
function IconView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
IconView.prototype = new BaseView();
IconView.prototype._render = function () {
	var container = document.createElement("div");
	container.setAttribute("class",this.opts.class == undefined ? "iconview" : this.opts.class);
	var labelSpan = document.createElement("span");
	labelSpan.appendChild(document.createTextNode(this.opts.label));
	var icon = new ImageView(this.cast,{src:"test.png"}).render();
	container.appendChild(icon);
	container.appendChild(labelSpan);
	return container;
}

/* ARRAY VIEW */
function ArrayView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
ArrayView.prototype = new BaseView();
ArrayView.prototype._render = function () {
	var array = this.opts.array;
	var container = document.createElement("div");
	container.setAttribute("class",this.opts.class == undefined ? "arrayview" : this.opts.class);
	for (var section in array) {
		var sectionDiv = document.createElement("div");
		sectionDiv.setAttribute("class","sectiondiv");
		var sectionTitle = document.createElement("span");
		sectionTitle.setAttribute("class","sectiontitle");
		sectionTitle.innerHTML = section;
		sectionDiv.appendChild(sectionTitle);
		for (var i in array[section]) {
			var viewInfo = array[section][i];
			var newView = new this.cast.SUPPORTED_VIEWS[viewInfo.view](this.cast,viewInfo.view_opts);
			sectionDiv.appendChild(newView.render());
		}
		var spacer = document.createElement("span");
		spacer.setAttribute("class","spacer");
		sectionDiv.appendChild(spacer);
		container.appendChild(sectionDiv);
	}
	return container;
}

/* WEB VIEW */
function WebView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
WebView.prototype = new BaseView();
WebView.prototype._render = function () {
	var webDiv = document.createElement("div");
	webDiv.innerHTML = this.opts.html;
	return webDiv;
};

/* TEXT VIEW */
function TextView(cast,opts) {};
TextView.prototype = new BaseView();


Cast.prototype.SUPPORTED_VIEWS = {
	"list": ListView,
	"icon": IconView,
	"image": ImageView,
	"array": ArrayView,
	"webview": WebView
}
