import { t as __commonJSMin } from "../_runtime.mjs";
import { t as require_interopRequireDefault } from "./babel__runtime.mjs";
//#region node_modules/dom-helpers/cjs/hasClass.js
var require_hasClass = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports.default = hasClass;
	/**
	* Checks if a given element has a CSS class.
	* 
	* @param element the element
	* @param className the CSS class name
	*/
	function hasClass(element, className) {
		if (element.classList) return !!className && element.classList.contains(className);
		return (" " + (element.className.baseVal || element.className) + " ").indexOf(" " + className + " ") !== -1;
	}
	module.exports = exports["default"];
}));
//#endregion
//#region node_modules/dom-helpers/cjs/addClass.js
var require_addClass = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _interopRequireDefault = require_interopRequireDefault();
	exports.__esModule = true;
	exports.default = addClass;
	var _hasClass = _interopRequireDefault(require_hasClass());
	/**
	* Adds a CSS class to a given element.
	* 
	* @param element the element
	* @param className the CSS class name
	*/
	function addClass(element, className) {
		if (element.classList) element.classList.add(className);
		else if (!(0, _hasClass.default)(element, className)) if (typeof element.className === "string") element.className = element.className + " " + className;
		else element.setAttribute("class", (element.className && element.className.baseVal || "") + " " + className);
	}
	module.exports = exports["default"];
}));
//#endregion
//#region node_modules/dom-helpers/cjs/removeClass.js
var require_removeClass = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports.default = removeClass;
	function replaceClassName(origClass, classToRemove) {
		return origClass.replace(new RegExp("(^|\\s)" + classToRemove + "(?:\\s|$)", "g"), "$1").replace(/\s+/g, " ").replace(/^\s*|\s*$/g, "");
	}
	/**
	* Removes a CSS class from a given element.
	* 
	* @param element the element
	* @param className the CSS class name
	*/
	function removeClass(element, className) {
		if (element.classList) element.classList.remove(className);
		else if (typeof element.className === "string") element.className = replaceClassName(element.className, className);
		else element.setAttribute("class", replaceClassName(element.className && element.className.baseVal || "", className));
	}
	module.exports = exports["default"];
}));
//#endregion
export { require_addClass as n, require_removeClass as t };
