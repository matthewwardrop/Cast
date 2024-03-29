/* Cast utilities */

/**
 * Checks if an object is a DOM node.
 * @name isDOMNode
 * @function
 * @param {Object} o Object to be checked
 * @returns {Boolean} True if object is DOM node, False otherwise.
 */
function isDOMNode(o){
  return (
    typeof Node === "object" ? o instanceof Node : 
    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  );
}

/**
 * Checks if an object is a DOM element.
 * @name isDOMElement
 * @function
 * @param {Object} o Object to be checked
 * @returns {Boolean} True if object is DOM element, False otherwise.
 */
function isDOMElement(o){
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName==="string"
);
}


// Add startsWith method onto strings
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

if (!window.console) console = {};
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.info = console.info || function(){};
