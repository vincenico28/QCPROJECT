import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/react-is/cjs/react-is.production.min.js
/**
* @license React
* react-is.production.min.js
*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_is_production_min = /* @__PURE__ */ __commonJSMin(((exports) => {
	var b = Symbol.for("react.element");
	var c = Symbol.for("react.portal");
	var d = Symbol.for("react.fragment");
	var e = Symbol.for("react.strict_mode");
	var f = Symbol.for("react.profiler");
	var g = Symbol.for("react.provider");
	var h = Symbol.for("react.context");
	var k = Symbol.for("react.server_context");
	var l = Symbol.for("react.forward_ref");
	var m = Symbol.for("react.suspense");
	var n = Symbol.for("react.suspense_list");
	var p = Symbol.for("react.memo");
	var q = Symbol.for("react.lazy");
	var t = Symbol.for("react.offscreen");
	var u = Symbol.for("react.module.reference");
	function v(a) {
		if ("object" === typeof a && null !== a) {
			var r = a.$$typeof;
			switch (r) {
				case b: switch (a = a.type, a) {
					case d:
					case f:
					case e:
					case m:
					case n: return a;
					default: switch (a = a && a.$$typeof, a) {
						case k:
						case h:
						case l:
						case q:
						case p:
						case g: return a;
						default: return r;
					}
				}
				case c: return r;
			}
		}
	}
	exports.ContextConsumer = h;
	exports.ContextProvider = g;
	exports.Element = b;
	exports.ForwardRef = l;
	exports.Fragment = d;
	exports.Lazy = q;
	exports.Memo = p;
	exports.Portal = c;
	exports.Profiler = f;
	exports.StrictMode = e;
	exports.Suspense = m;
	exports.SuspenseList = n;
	exports.isAsyncMode = function() {
		return !1;
	};
	exports.isConcurrentMode = function() {
		return !1;
	};
	exports.isContextConsumer = function(a) {
		return v(a) === h;
	};
	exports.isContextProvider = function(a) {
		return v(a) === g;
	};
	exports.isElement = function(a) {
		return "object" === typeof a && null !== a && a.$$typeof === b;
	};
	exports.isForwardRef = function(a) {
		return v(a) === l;
	};
	exports.isFragment = function(a) {
		return v(a) === d;
	};
	exports.isLazy = function(a) {
		return v(a) === q;
	};
	exports.isMemo = function(a) {
		return v(a) === p;
	};
	exports.isPortal = function(a) {
		return v(a) === c;
	};
	exports.isProfiler = function(a) {
		return v(a) === f;
	};
	exports.isStrictMode = function(a) {
		return v(a) === e;
	};
	exports.isSuspense = function(a) {
		return v(a) === m;
	};
	exports.isSuspenseList = function(a) {
		return v(a) === n;
	};
	exports.isValidElementType = function(a) {
		return "string" === typeof a || "function" === typeof a || a === d || a === f || a === e || a === m || a === n || a === t || "object" === typeof a && null !== a && (a.$$typeof === q || a.$$typeof === p || a.$$typeof === g || a.$$typeof === h || a.$$typeof === l || a.$$typeof === u || void 0 !== a.getModuleId) ? !0 : !1;
	};
	exports.typeOf = v;
}));
//#endregion
//#region node_modules/react-is/cjs/react-is.development.js
/**
* @license React
* react-is.development.js
*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_is_development = /* @__PURE__ */ __commonJSMin(((exports) => {
	if (process.env.NODE_ENV !== "production") (function() {
		"use strict";
		var REACT_ELEMENT_TYPE = Symbol.for("react.element");
		var REACT_PORTAL_TYPE = Symbol.for("react.portal");
		var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
		var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
		var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
		var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
		var REACT_CONTEXT_TYPE = Symbol.for("react.context");
		var REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context");
		var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
		var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
		var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
		var REACT_MEMO_TYPE = Symbol.for("react.memo");
		var REACT_LAZY_TYPE = Symbol.for("react.lazy");
		var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
		var enableScopeAPI = false;
		var enableCacheElement = false;
		var enableTransitionTracing = false;
		var enableLegacyHidden = false;
		var enableDebugTracing = false;
		var REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
		function isValidElementType(type) {
			if (typeof type === "string" || typeof type === "function") return true;
			if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) return true;
			if (typeof type === "object" && type !== null) {
				if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) return true;
			}
			return false;
		}
		function typeOf(object) {
			if (typeof object === "object" && object !== null) {
				var $$typeof = object.$$typeof;
				switch ($$typeof) {
					case REACT_ELEMENT_TYPE:
						var type = object.type;
						switch (type) {
							case REACT_FRAGMENT_TYPE:
							case REACT_PROFILER_TYPE:
							case REACT_STRICT_MODE_TYPE:
							case REACT_SUSPENSE_TYPE:
							case REACT_SUSPENSE_LIST_TYPE: return type;
							default:
								var $$typeofType = type && type.$$typeof;
								switch ($$typeofType) {
									case REACT_SERVER_CONTEXT_TYPE:
									case REACT_CONTEXT_TYPE:
									case REACT_FORWARD_REF_TYPE:
									case REACT_LAZY_TYPE:
									case REACT_MEMO_TYPE:
									case REACT_PROVIDER_TYPE: return $$typeofType;
									default: return $$typeof;
								}
						}
					case REACT_PORTAL_TYPE: return $$typeof;
				}
			}
		}
		var ContextConsumer = REACT_CONTEXT_TYPE;
		var ContextProvider = REACT_PROVIDER_TYPE;
		var Element = REACT_ELEMENT_TYPE;
		var ForwardRef = REACT_FORWARD_REF_TYPE;
		var Fragment = REACT_FRAGMENT_TYPE;
		var Lazy = REACT_LAZY_TYPE;
		var Memo = REACT_MEMO_TYPE;
		var Portal = REACT_PORTAL_TYPE;
		var Profiler = REACT_PROFILER_TYPE;
		var StrictMode = REACT_STRICT_MODE_TYPE;
		var Suspense = REACT_SUSPENSE_TYPE;
		var SuspenseList = REACT_SUSPENSE_LIST_TYPE;
		var hasWarnedAboutDeprecatedIsAsyncMode = false;
		var hasWarnedAboutDeprecatedIsConcurrentMode = false;
		function isAsyncMode(object) {
			if (!hasWarnedAboutDeprecatedIsAsyncMode) {
				hasWarnedAboutDeprecatedIsAsyncMode = true;
				console["warn"]("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 18+.");
			}
			return false;
		}
		function isConcurrentMode(object) {
			if (!hasWarnedAboutDeprecatedIsConcurrentMode) {
				hasWarnedAboutDeprecatedIsConcurrentMode = true;
				console["warn"]("The ReactIs.isConcurrentMode() alias has been deprecated, and will be removed in React 18+.");
			}
			return false;
		}
		function isContextConsumer(object) {
			return typeOf(object) === REACT_CONTEXT_TYPE;
		}
		function isContextProvider(object) {
			return typeOf(object) === REACT_PROVIDER_TYPE;
		}
		function isElement(object) {
			return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
		}
		function isForwardRef(object) {
			return typeOf(object) === REACT_FORWARD_REF_TYPE;
		}
		function isFragment(object) {
			return typeOf(object) === REACT_FRAGMENT_TYPE;
		}
		function isLazy(object) {
			return typeOf(object) === REACT_LAZY_TYPE;
		}
		function isMemo(object) {
			return typeOf(object) === REACT_MEMO_TYPE;
		}
		function isPortal(object) {
			return typeOf(object) === REACT_PORTAL_TYPE;
		}
		function isProfiler(object) {
			return typeOf(object) === REACT_PROFILER_TYPE;
		}
		function isStrictMode(object) {
			return typeOf(object) === REACT_STRICT_MODE_TYPE;
		}
		function isSuspense(object) {
			return typeOf(object) === REACT_SUSPENSE_TYPE;
		}
		function isSuspenseList(object) {
			return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
		}
		exports.ContextConsumer = ContextConsumer;
		exports.ContextProvider = ContextProvider;
		exports.Element = Element;
		exports.ForwardRef = ForwardRef;
		exports.Fragment = Fragment;
		exports.Lazy = Lazy;
		exports.Memo = Memo;
		exports.Portal = Portal;
		exports.Profiler = Profiler;
		exports.StrictMode = StrictMode;
		exports.Suspense = Suspense;
		exports.SuspenseList = SuspenseList;
		exports.isAsyncMode = isAsyncMode;
		exports.isConcurrentMode = isConcurrentMode;
		exports.isContextConsumer = isContextConsumer;
		exports.isContextProvider = isContextProvider;
		exports.isElement = isElement;
		exports.isForwardRef = isForwardRef;
		exports.isFragment = isFragment;
		exports.isLazy = isLazy;
		exports.isMemo = isMemo;
		exports.isPortal = isPortal;
		exports.isProfiler = isProfiler;
		exports.isStrictMode = isStrictMode;
		exports.isSuspense = isSuspense;
		exports.isSuspenseList = isSuspenseList;
		exports.isValidElementType = isValidElementType;
		exports.typeOf = typeOf;
	})();
}));
//#endregion
//#region node_modules/react-is/index.js
var require_react_is = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	if (process.env.NODE_ENV === "production") module.exports = require_react_is_production_min();
	else module.exports = require_react_is_development();
}));
//#endregion
export { require_react_is as t };
