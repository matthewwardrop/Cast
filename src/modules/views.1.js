/* Views */
/**
 * @namespace Views
 */
/**
 * The base class of all views.
 * @class View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below.
 * @param {Integer} opts.z_index The z-index CSS property to be applied to this object.
 * @param {Action} opts.onclick The object to sent to the Action handler when item is clicked.
 * @param {Action} opts.onchange The object to sent to the Action handler when item is changed.
 * @param {Object} opts.scroll The JSON object to be sent to the iScroll initialiser.
 */
function View(cast,opts) {}

/**
 * This method generates the DOM structure for the View. It is supposed to be overloaded by specific views.
 * @name _render
 * @function
 * @memberOf Views.View#
 * @param * This function may choose to receive further parameters.
 * @returns {DOMObject} The DOM Object to be parsed by View.render; and then added to the DOM.
 */
View.prototype._render = null;

/**
 * This method wraps around the _render method to generate the DOM Object for the HTML page.
 * @name render
 * @function
 * @memberOf Views.View#
 * @param * Any arguments passed into this function will also be passed to _render.
 * @returns {DOMObject} The DOM Object to be included into the DOM.
 */
View.prototype.render = function() {
	if (!this._render instanceof Function) {
		alert("Unimplemented: _render.");
		return;
	}
	
	var obj = this._render.apply(this,arguments);
	
	if (isDOMElement(obj)) {
		obj.setAttribute("class",this.opts['class'] == undefined ? this.css_class : this.opts['class']);
		if (this.opts.z_index != undefined) {
			$(obj).css('z-index',this.opts.z_index);
		}
	}
	
	if (isDOMElement(obj) && this.opts.onclick != undefined && this.opts.onclick != null) {
		var onClickID = keys(this.cast.INTERACTION_HANDLERS).length + 1;
		this.cast.INTERACTION_HANDLERS[onClickID] = this.getOnClick(this.opts.onclick);
		obj.setAttribute("onclick",this.cast.varname+".notifyEvent('onInteract',"+onClickID+",this);");
		$(obj).css("cursor","pointer");
	}
	
	if (isDOMElement(obj) && (obj.tagName == "INPUT" || obj.tagName == "SELECT") && this.opts.onchange != undefined && this.opts.onchange != null) {
		var onChangeID = keys(this.cast.INTERACTION_HANDLERS).length + 1;
		this.cast.INTERACTION_HANDLERS[onChangeID] = this.getOnClick(this.opts.onchange);
		obj.setAttribute("onchange",this.cast.varname+".notifyEvent('onInteract',"+onChangeID+",this);");
	}
	
	if (this.opts.scroll != undefined) {
		var wrapper = document.createElement("div");
		wrapper.appendChild(obj);
		wrapper.setAttribute("class","wrapper");
		this.scroll_view = wrapper;
		return wrapper;
	}
	
	return obj;
};

/**
 * This method retrieves an Action object corresponding to the onclick function.
 * @name getOnClick
 * @function
 * @memberOf Views.View#
 * @param {Object} detail Information used in generating the action object. See the Action API reference.
 * @returns {Action} The action object.
 */
View.prototype.getOnClick = function(detail) {
	return this.cast.action(detail);
};

/**
 * This method is called by Cast after all the elements have been added to the DOM.
 * Currently it just activates iScroll when required.
 * @name onReady
 * @function
 * @memberOf Views.View#
 */
View.prototype.onReady = function () {
	var view = this.scroll_view;
	if (view != undefined) {
		$(view).height($(view).parent().height());
		var scroll = new iScroll(view,this.opts.scroll);
		if (this.opts.scroll.scrollMaxRight != undefined) {
			scroll.scrollTo($(view).find(">:first-child").innerWidth(), 0, 0, true);
		}
	}
};
/**
 * The default css_class to be used for this view. It is the name of the class in lower case.
 * @name css_class
 * @memberOf Views.View#
 */
View.prototype.css_class = "view";

/* TEXT VIEW */
/**
 * A view for rendering text. This class inherits all of the methods and options from View; with the additions below.
 * @class TextView
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {String} opts The text to be rendered.
 */
function TextView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
TextView.prototype = new View();
TextView.prototype.css_class = "textview";
TextView.prototype._render = function() {
	var text = document.createElement("div");
	text.appendChild(document.createTextNode(this.cast.processText(this.opts)));
	return text;
};

/* TemplateView */
/**
 * This view is to be used in conjunction with the ListView only. It allows a template to be provided, which then
 * has fields replaced as supplied.
 * @class TemplateView
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 * @param {String} opts.template The id of the template to use.
 * @param {String} opts.fields A dictionary of key-value pairs for replacement in the template.
 */
function TemplateView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
TemplateView.prototype = new View();
TemplateView.prototype.css_class = "templateview";
TemplateView.prototype._render = function(templates) {
	var text = templates[this.opts.template];
	for (var field in this.opts.fields) {
		text = this.cast.processText(text.replace(new RegExp("%\\("+field+"\\)s","g"),this.opts.fields[field]));
	}
	var div = document.createElement("div");
	div.innerHTML = text;
	return div;
};

/* LIST VIEW */
/**
 * The ListView view generates a DOM object with multiple &lt;LI&gt; objects inside of a &lt;UL&gt; object. 
 * Each object passed to the 'list' object can be any nested view of any type.
 * @class ListView
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 * @param {Array} opts.list An array of nested views or text (which will be rendered by TextView). 
 * @param {Object} opts.templates A dictionary of template ids and template strings. Fields in templates should be identified with %(&lt;fieldname&gt;)s.
 */
function ListView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
ListView.prototype = new View();
ListView.prototype.css_class = "listview";
ListView.prototype._render = function() {
	var ul = document.createElement("ul");
	for (var i in this.opts.list) {
		var li = document.createElement("li");
		if (this.opts.templates != undefined) {
			li.appendChild(this.cast.getView(this.opts.list[i]).render(this.opts.templates));
		} else {
			li.appendChild(this.cast.getView(this.opts.list[i]).render());
		}
		ul.appendChild(li);
	}
	return ul;
};

/* IMAGE VIEW */
/**
 * The image view is used for showing images.
 * @class ImageView
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 * @param {String} opts.src The source of image to be shown.
 */
function ImageView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
ImageView.prototype = new View();
ImageView.prototype.css_class = "imageview";
ImageView.prototype._render = function () {
	var imgView = document.createElement("img");
	imgView.setAttribute("src",this.opts.src);
	return imgView;
};

/* ICON VIEW */
/**
 * The icon view is for showing an image with an associated label.
 * @class IconView
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 * @param {String} opts.icon The source of the image to be shown.
 * @param {String} opts.label The label to use for the icon.
 */
function IconView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
IconView.prototype = new View();
IconView.prototype.css_class = "iconview";
IconView.prototype._render = function () {
	var container = document.createElement("div");
	var labelSpan = document.createElement("span");
	labelSpan.appendChild(document.createTextNode(this.cast.processText(this.opts.label)));
	var icon = this.cast.getView(['image',{src:this.opts.icon}]).render();
	container.appendChild(icon);
	container.appendChild(labelSpan);
	return container;
};

/* ARRAY VIEW */
/**
 * The array view allows a series of nested views to be shown in any arrangement desired (using CSS). 
 * Views may be put into sections; in which case section headers are shown.
 * @class ArrayView
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 * @param {Object} opts.array Dictionary of lists of objects to be rendered. The keys of this dictionary will be the section headers.
 */
function ArrayView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
ArrayView.prototype = new View();
ArrayView.prototype.css_class = "arrayview";
ArrayView.prototype._render = function () {
	var array = this.opts.array;
	var container = document.createElement("div");
	for (var section in array) {
		var sectionDiv = document.createElement("div");
		sectionDiv.setAttribute("class","sectiondiv");
		var sectionTitle = document.createElement("span");
		sectionTitle.setAttribute("class","sectiontitle");
		sectionTitle.innerHTML = this.cast.processText(section);
		sectionDiv.appendChild(sectionTitle);
		for (var i in array[section]) {
			var viewInfo = array[section][i];
			var newView = this.cast.getView(viewInfo[0],viewInfo[1]);
			sectionDiv.appendChild(newView.render());
		}
		var spacer = document.createElement("span");
		spacer.setAttribute("class","spacer");
		sectionDiv.appendChild(spacer);
		container.appendChild(sectionDiv);
	}
	return container;
};

/* EDIT TEXT */
/**
 * This view is an input view which allows users to input information.
 * @class EditText
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 * @param {String} opts.value Initial value to be shown.
 */
function EditText(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
EditText.prototype = new View();
EditText.prototype.css_class = "edittext";
EditText.prototype._render = function () {
	var editText = document.createElement("input");
	editText.value = this.cast.processText(this.opts.value);
	return editText;
};

/* SELECTOR VIEW */
/**
 * This view is an input view which allows users to select from a list of possible options.
 * @class EditSelect
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 * @param {Object} opts.options Dictionary of keys and values to be shown in the select.
 * @param {String} opts.value The initially selected value.
 */
function EditSelect(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
EditSelect.prototype = new View();
EditSelect.prototype.css_class = "editselect";
EditSelect.prototype._render = function () {
	var editSelect = document.createElement("select");
	var count = 0;
	for (var option in this.opts.options) {
		count++;
		editSelect.options[count] = new Option(option,this.opts.options[option],false,this.opts.options[option]==this.cast.processText(this.opts.selected));
	}
	return editSelect;
};

/* WEB VIEW */
/**
 * The web view renders the provided information as HTML.
 * @class WebView
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 * @param {String} opts.html The html to be shown in the WebView.
 */
function WebView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
WebView.prototype = new View();
WebView.prototype.css_class = "webview";
WebView.prototype._render = function () {
	var webDiv = document.createElement("div");
	webDiv.innerHTML = this.cast.processText(this.opts.html);
	return webDiv;
};

/* StackView */
/**
 * The stack view visualises the elements on the current stack.
 * @class StackView
 * @extends Views.View
 * @memberOf Views
 * @param {Cast} cast A reference to the current Cast instance.
 * @param {Object} opts A dictionary of options; which are itemised below; excluding those which apply for all objects (see: View).
 */
function StackView(cast,opts) {
	this.cast = cast;
	this.opts = opts;
};
StackView.prototype = new View();
StackView.prototype.css_class = "stackview";
StackView.prototype._render = function () {
	var stackList = [];
	var currentStack = this.cast.getCurrentStack();
	for (var i in currentStack) {
		var classname = "";
		if (i == currentStack.length - 1) {
			classname = "active";
		}
		stackList.push(["template",{"z_index":currentStack.length - i,"li_class":classname,"class":classname,"onclick":["pop",{"count":currentStack.length-i-1}],"template":"titles","fields":{ "title": currentStack[i].title }}]);
	}
	return this.cast.getView(['list',{"class":"stackview", "list":stackList,"scroll":{vScroll:false,hScrollbar:false,scrollMaxRight:true},"templates":{"titles":"<span>%(title)s</span>"}}]).render();
};

	
/**
 * Returns a reference to View.
 * @name getViewPrototype
 * @memberOf Cast#
 * @function
 * @returns {View} A reference to View.
 */
Cast.prototype.getViewPrototype = function() {
	return View;
};

/**
 * Returns a new instance of the relevant View.
 * @name getView
 * @memberOf Cast#
 * @function
 * @param {Object} viewInfo A list of the form: ['&lt;viewtype&gt;',{viewOpts}] or {view:&lt;viewtype&gt;,opts:{viewOpts}}
 * @returns {View} A reference to the configured View.
 */
Cast.prototype.getView = function (viewInfo) {
	
	/* 
	 * Implement methods for generating objects that behave something like their
	 * their Android counterparts.
	 */
	
	SUPPORTED_VIEWS = {
			"text": TextView,
			"list": ListView,
			"icon": IconView,
			"image": ImageView,
			"array": ArrayView,
			"template": TemplateView,
			"webview": WebView,
			"stack": StackView,
			"edit": EditText,
			"select": EditSelect
		};
	
	var view;
	if (viewInfo instanceof Array) {
		view = new SUPPORTED_VIEWS[viewInfo[0]](this,viewInfo[1]);
	} else if (typeof(viewInfo) == "string") {
		view = new SUPPORTED_VIEWS["text"](this,viewInfo);
	} else if (viewInfo instanceof Object) {
		view = new SUPPORTED_VIEWS[viewInfo.view](this,viewInfo);
	} else {
		alert("Unsupported view type!.");
		return;
	}
	
	this.CURRENT_VIEWS.push(view);
	return view;
};
