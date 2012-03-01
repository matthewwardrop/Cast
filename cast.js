/* Cast CMS System for dynamic loading */

/* (c) Matthew Wardrop */

/* All instances of cast must call this function */

// Sandbox Cast as in jQuery

(function(window,undefined) {
	var document = window.document,	navigator = window.navigator,location = window.location;
	
	/* Cast utilities */
	
	//Returns true if it is a DOM node
	function isDOMNode(o){
	  return (
	    typeof Node === "object" ? o instanceof Node : 
	    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
	  );
	}

	//Returns true if it is a DOM element    
	function isDOMElement(o){
	  return (
	    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
	    o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName==="string"
	);
	}


	// Add startswith element onto strings
	if (typeof String.prototype.startsWith != 'function') {
	  String.prototype.startsWith = function (str) {
	    return this.indexOf(str) == 0;
	  };
	}


	/*// Add key lister for objects
	if (typeof Object.prototype.keys != 'function') {
	  Object.prototype.keys = function () {
		var keys = [];
		for(var key in this){
			keys.push(key);
		}
		return keys;
	  };
	}*/

	function keys(o) {
		var keys = [];
		for(var key in o){
			keys.push(key);
		}
		return keys;
	}
	
	
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

	Cast.prototype.init = function() {
		$(window).resize(function() {$CAST.notifyEvent("resize");});
		$(document).ready(function() {$CAST.notifyEvent("ready");});
		
		this.addEventListener(this.onInteractHandler,["onInteract"]);
		this.addEventListener(this.render,["render"]);
		/* Load configuration */
		this.CONFIG.init();
		this.loadSheet({'init':true});
		
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

	
	/* RENDER */
	/*
	 * Rendering functions
	 */
	Cast.prototype.loadSheet = function(query,stack) {
		var url = this.CONFIG.SERVER + this.CONFIG.SCRIPT;
		
		function success(data,a,b) {
			$CAST.renderSheet(data,stack);
		}
		
		function error(jqXHR, textStatus, errorThrown) {
			alert("cannot load sheet" + errorThrown);
		}
		
		this.getSheet("url",{query:query},success,error);
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
				obj.setAttribute("onclick","$CAST.notifyEvent('onInteract',"+onClickID+",this);");
				$(obj).css("cursor","pointer");
			}
			
			if (isDOMElement(obj) && (obj.tagName == "INPUT" || obj.tagName == "SELECT") && this.opts.onchange != undefined && this.opts.onchange != null) {
				var onChangeID = keys(this.cast.INTERACTION_HANDLERS).length + 1;
				this.cast.INTERACTION_HANDLERS[onChangeID] = this.getOnClick(this.opts.onchange);
				obj.setAttribute("onchange","$CAST.notifyEvent('onInteract',"+onChangeID+",this);");
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
			var icon = new ImageView(this.cast,{src:"test.png"}).render();
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
			return new ListView(this.cast,{"class":"stackview", "list":stackList,"scroll":{vScroll:false,hScrollbar:false},"templates":{"titles":"<span>%(title)s</span>"}}).render();
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

	/* Factory */
	/*
	 * Cast depends upon receiving JSON parsed in compliance with the Cast protocol.
	 * The methods here are the different "factories" to generate these formats.
	 */

	Cast.prototype.getSheet = function(method,opts,success,error) {
		
		/* Method 1: Download JSON file from server */
		function UrlFactory (cast) {
			var url = opts.url;
			if (url == undefined || url == null) {
				url = cast.CONFIG.SERVER + cast.CONFIG.SCRIPT;
			}
			
			return cast.request(url,opts.query,success,error);
		}
		
		/* Method 2: Generate from factory in config */
		// TODO
		
		SUPPORTED_FACTORIES = {
			"url": UrlFactory	
		};
		
		SUPPORTED_FACTORIES[method](this);
	};
	
	
	
	/* Actions */

	Cast.prototype.getActionPrototype = function () {
		var Action = function() {};
		Action.prototype.run = function() {
			this._run.apply(this,arguments);
		};
		return Action;
	};

	Cast.prototype.runAction = function(actionInfo) {
		this.action(actionInfo).run();
	};

	Cast.prototype.action = function(actionInfo) {
		
		var Action = this.getActionPrototype();
		
		var OpenSheet = function(cast, opts) {
			this.cast = cast;
			this.opts = opts;
		};
		OpenSheet.prototype = new Action();
		OpenSheet.prototype._run = function() {
			this.cast.clearStack();
			this.cast.loadSheet(this.opts.query,this.opts.stack);
		};

		var PushSheet = function(cast, opts) {
			this.cast = cast;
			this.opts = opts;
		};
		PushSheet.prototype = new Action();
		PushSheet.prototype._run = function() {
			this.cast.loadSheet(this.opts.query,this.opts.stack);
		};

		var PopSheet = function(cast, opts) {
			this.cast = cast;
			this.opts = opts;
		};
		PopSheet.prototype = new Action();
		PopSheet.prototype._run = function() {
			this.cast.popStack(null,this.opts.count);
		};

		var PrefSave = function(cast, opts) {
			this.cast = cast;
			this.opts = opts;
		};
		PrefSave.prototype = new Action();
		PrefSave.prototype._run = function() {
			this.cast.preference(this.opts.key,this.opts.value);
		};

		var PrefSaveInput = function(cast, opts) {
			this.cast = cast;
			this.opts = opts;
		};
		PrefSaveInput.prototype = new Action();
		PrefSaveInput.prototype._run = function(domObject) {
			this.cast.preference(this.opts.key,domObject.value);
		};

		var LocalMethod = function(cast, opts) {
			this.cast = cast;
			this.opts = opts;
		};
		LocalMethod.prototype = new Action();
		LocalMethod.prototype._run = function() {
			// execute local methods
		};

		SUPPORTED_ACTIONS = {
			"open": OpenSheet,
			"push": PushSheet,
			"pop": PopSheet,
			"pref": PrefSave,
			"pref_input": PrefSaveInput,
			"method": LocalMethod
		};
		
		if (actionInfo instanceof Array) {
			return new SUPPORTED_ACTIONS[actionInfo[0]](this,actionInfo[1]);
		} else if (typeof(actionInfo) == "string") {
			return new SUPPORTED_ACTIONS[actionInfo](this,null);
		} else if (actionInfo instanceof Object) {
			return new SUPPORTED_ACTIONS[actionInfo.action](this,actionInfo.action_opts);
		} else {
			alert("Unsupported action type: "+actionInfo);
		}
	};
	
	Cast.prototype.preference = function (key, value) {
		if (value == null) {
			return window.localStorage.getItem(key);
		}
		return window.localStorage.setItem(key,value);
	};
	
	window['CastProto'] = Cast;
})(window);

function Cast(varname,config_file) {
	window[varname] = new CastProto(varname,config_file);
	return window[varname];
}


