import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/object-assign/index.js
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var require_object_assign = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;
	function toObject(val) {
		if (val === null || val === void 0) throw new TypeError("Object.assign cannot be called with null or undefined");
		return Object(val);
	}
	function shouldUseNative() {
		try {
			if (!Object.assign) return false;
			var test1 = /* @__PURE__ */ new String("abc");
			test1[5] = "de";
			if (Object.getOwnPropertyNames(test1)[0] === "5") return false;
			var test2 = {};
			for (var i = 0; i < 10; i++) test2["_" + String.fromCharCode(i)] = i;
			if (Object.getOwnPropertyNames(test2).map(function(n) {
				return test2[n];
			}).join("") !== "0123456789") return false;
			var test3 = {};
			"abcdefghijklmnopqrst".split("").forEach(function(letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") return false;
			return true;
		} catch (err) {
			return false;
		}
	}
	module.exports = shouldUseNative() ? Object.assign : function(target, source) {
		var from;
		var to = toObject(target);
		var symbols;
		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);
			for (var key in from) if (hasOwnProperty.call(from, key)) to[key] = from[key];
			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) if (propIsEnumerable.call(from, symbols[i])) to[symbols[i]] = from[symbols[i]];
			}
		}
		return to;
	};
}));
//#endregion
export { require_object_assign as t };
