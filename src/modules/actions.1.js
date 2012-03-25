/* Actions */
/**@namespace Actions */

/**
 * The base Action class.
 * @name Action
 * @class
 * @memberOf Actions
 * @param {Cast} cast A reference to a Cast instance.
 * @param {Object} opts A dictionary of options.
 */
function Action (cast,opts) {};

/**
 * The _run method performs the action; and should be overloaded by subclasses.
 * @name _run
 * @memberOf Actions.Action#
 * @function
 * @param {Object} * Any arguments passed into run will be passed on into _run.
 */
Action.prototype._run = null;

/**
 * The run method wraps around _run.
 * @name run
 * @memberOf Actions.Action#
 * @function
 * @param {Object} * Any arguments passed into run will be passed on into _run.
 */
Action.prototype.run = function() {
	this._run.apply(this,arguments);
};

/**
 * Get an instance of Cast.
 * @name getActionPrototype
 * @memberOf Cast#
 * @function
 * @returns {Action} A reference to the base Action class.
 */
Cast.prototype.getActionPrototype = function () {
	return Action;
};

/**
 * Generate an action object using Cast.action ; and then run it.
 * @name runAction
 * @memberOf Cast#
 * @function
 * @param {Object} actionInfo A javascript object of form: 
 * [&lt;actionname&gt;,{actionOpts}] or {action:&lt;actionname&gt;,opts:{actionOpts}] .
 */
Cast.prototype.runAction = function(actionInfo) {
	this.action(actionInfo).run();
};


// -------------------- ACTIONS -----------------------------------------------
/**
 * The action associated with opening a new sheet in a new stack (or overwriting the current stack if stack is of the same name or unspecified).
 * @name OpenSheet
 * @memberOf Actions
 * @extends Actions.Action
 * @class
 * @param {Cast} cast A reference to a Cast instance.
 * @param {Object} opts A dictionary of options. The additional options are itemised below:
 * @param {String} opts.type The factory type to use when generating this sheet.
 * @param {Object} opts.query A dictionary of key-value pairs to send as arguments to the factory.
 * @param {String} opts.stack The name of the stack to be created / reset and into which this sheet will be added.
 */
var OpenSheet = function(cast, opts) {
	this.cast = cast;
	this.opts = opts;
};
OpenSheet.prototype = new Action();
OpenSheet.prototype._run = function() {
	this.cast.clearStack();
	console.log(this.cast);
	this.cast.loadSheet(this.opts.type,this.opts.query,this.opts.stack);
};

/**
 * The action associated with adding a new sheet to a stack (or creating a new stack if the stack does not already exist).
 * @name PushSheet
 * @memberOf Actions
 * @extends Actions.Action
 * @class
 * @param {Cast} cast A reference to a Cast instance.
 * @param {Object} opts A dictionary of options. The additional options are itemised below:
 * @param {String} opts.type The factory type to use when generating this sheet.
 * @param {Object} opts.query A dictionary of key-value pairs to send as arguments to the factory.
 * @param {String} opts.stack The name of the stack into which this sheet will be added.
 */
var PushSheet = function(cast, opts) {
	this.cast = cast;
	this.opts = opts;
};
PushSheet.prototype = new Action();
PushSheet.prototype._run = function() {
	this.cast.loadSheet(this.opts.type,this.opts.query,this.opts.stack);
};

/**
 * This action pops of the the top sheets of a stack to reveal the lower sheets.
 * @name PopSheet
 * @memberOf Actions
 * @extends Actions.Action
 * @class
 * @param {Cast} cast A reference to a Cast instance.
 * @param {Object} opts A dictionary of options. The additional options are itemised below:
 * @param {Integer} opts.count The number of levels to pop.
 */
var PopSheet = function(cast, opts) {
	this.cast = cast;
	this.opts = opts;
};
PopSheet.prototype = new Action();
PopSheet.prototype._run = function() {
	this.cast.popStack(null,this.opts.count);
};

/**
 * This action saves a preference using a fixed value.
 * @name PrefSave
 * @memberOf Actions
 * @extends Actions.Action
 * @class
 * @param {Cast} cast A reference to a Cast instance.
 * @param {Object} opts A dictionary of options. The additional options are itemised below:
 * @param {String} key The preference key.
 * @param {Object} value The preference value.
 */
var PrefSave = function(cast, opts) {
	this.cast = cast;
	this.opts = opts;
};
PrefSave.prototype = new Action();
PrefSave.prototype._run = function() {
	this.cast.preference(this.opts.key,this.opts.value);
};

/**
 * This action saves a preference using the value of a DOM element. Note that the DOM object
 * is passed in as the first argument to Action.run .
 * @name PrefSaveInput
 * @memberOf Actions
 * @extends Actions.Action
 * @class
 * @param {Cast} cast A reference to a Cast instance.
 * @param {Object} opts A dictionary of options. The additional options are itemised below:
 * @param {String} key The preference key.
 */
var PrefSaveInput = function(cast, opts) {
	this.cast = cast;
	this.opts = opts;
};
PrefSaveInput.prototype = new Action();
PrefSaveInput.prototype._run = function(domObject) {
	this.cast.preference(this.opts.key,domObject.value);
};

/*
 * This action runs an action defined in the local Cast configuration.
 * @name LocalMethod
 * @memberOf Actions
 * @extends Actions.Action
 * @class
 * @param {Cast} cast A reference to a Cast instance.
 * @param {Object} opts A dictionary of options. The additional options are itemised below:
 * @param {String} key The preference key.
 */
var LocalMethod = function(cast, opts) {
	this.cast = cast;
	this.opts = opts;
};
LocalMethod.prototype = new Action();
LocalMethod.prototype._run = function() {
	// execute local methods
};

/**
 * Create a new instance of an action.
 * @name action
 * @memberOf Cast#
 * @function
 * @param {Object} actionInfo A javascript object of form: 
 * [&lt;actionname&gt;,{actionOpts}] or {action:&lt;actionname&gt;,opts:{actionOpts}] .
 * @returns {Action} Return a new instance of the specified action.
 */
Cast.prototype.action = function(actionInfo) {
	
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
		return new SUPPORTED_ACTIONS[actionInfo.action](this,actionInfo.opts);
	} else {
		alert("Unsupported action type: "+actionInfo);
	}
};
