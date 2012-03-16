/* Views */
Cast.prototype.getViewPrototype = function() {
	function BaseView() {}
	BaseView.prototype.render = function() {
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
			this.cast.CONFIG.SCROLL_VIEWS.push([wrapper,this.opts.scroll]);;
			return wrapper;
		}
		
		return obj;
	};
	BaseView.prototype.getOnClick = function(detail) {
		return this.cast.action(detail);
	};
	BaseView.prototype.css_class = "view";
	
	return BaseView;
};

Cast.prototype.getView = function (viewInfo) {
	
	/* 
	 * Implement methods for generating objects that behave something like their
	 * their Android counterparts.
	 */
	
	BaseView = this.getViewPrototype();

	/* TEXT VIEW */
	function TextView(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	TextView.prototype = new BaseView();
	TextView.prototype.css_class = "textview";
	TextView.prototype._render = function() {
		var text = document.createElement("div");
		text.appendChild(document.createTextNode(this.cast.processText(this.opts)));
		return text;
	};

	/* TemplateView */
	function TemplateView(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	TemplateView.prototype = new BaseView();
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
	function ListView(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	ListView.prototype = new BaseView();
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
	function ImageView(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	ImageView.prototype = new BaseView();
	ImageView.prototype.css_class = "imageview";
	ImageView.prototype._render = function () {
		var imgView = document.createElement("img");
		imgView.setAttribute("src",this.opts.src);
		return imgView;
	};

	/* ICON VIEW */
	function IconView(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	IconView.prototype = new BaseView();
	IconView.prototype.css_class = "iconview";
	IconView.prototype._render = function () {
		var container = document.createElement("div");
		var labelSpan = document.createElement("span");
		labelSpan.appendChild(document.createTextNode(this.cast.processText(this.opts.label)));
		var icon = new ImageView(this.cast,{src:this.opts.icon}).render();
		container.appendChild(icon);
		container.appendChild(labelSpan);
		return container;
	};

	/* ARRAY VIEW */
	function ArrayView(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	ArrayView.prototype = new BaseView();
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
	function EditText(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	EditText.prototype = new BaseView();
	EditText.prototype.css_class = "edittext";
	EditText.prototype._render = function () {
		var editText = document.createElement("input");
		editText.value = this.cast.processText(this.opts.value);
		return editText;
	};

	/* SELECTOR VIEW */
	function EditSelect(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	EditSelect.prototype = new BaseView();
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
	function WebView(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	WebView.prototype = new BaseView();
	WebView.prototype.css_class = "webview";
	WebView.prototype._render = function () {
		var webDiv = document.createElement("div");
		webDiv.innerHTML = this.cast.processText(this.opts.html);
		return webDiv;
	};

	/* StackView */
	function StackView(cast,opts) {
		this.cast = cast;
		this.opts = opts;
	};
	StackView.prototype = new BaseView();
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
		return new ListView(this.cast,{"class":"stackview", "list":stackList,"scroll":{vScroll:false,hScrollbar:false,scrollMaxRight:true},"templates":{"titles":"<span>%(title)s</span>"}}).render();
	};
	
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
	
	
	if (viewInfo instanceof Array) {
		return new SUPPORTED_VIEWS[viewInfo[0]](this,viewInfo[1]);
	} else if (typeof(viewInfo) == "string") {
		return new SUPPORTED_VIEWS["text"](this,viewInfo);
	} else if (viewInfo instanceof Object) {
		return new SUPPORTED_VIEWS[viewInfo.view](this,viewInfo);
	} else {
		alert("Unsupported view type!.");
	}
};
