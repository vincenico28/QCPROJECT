import { t as __commonJSMin } from "../_runtime.mjs";
import { l as require_react_dom, u as require_react } from "./@floating-ui/react-dom+[...].mjs";
import { t as require_prop_types } from "./prop-types+react-is.mjs";
import { t as require_cjs$1 } from "./fast-equals.mjs";
import { n as require_addClass, t as require_removeClass } from "./dom-helpers.mjs";
//#region node_modules/react-smooth/lib/setRafTimeout.js
var require_setRafTimeout = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = setRafTimeout;
	function safeRequestAnimationFrame(callback) {
		if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(callback);
	}
	function setRafTimeout(callback) {
		var timeout = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
		var currTime = -1;
		requestAnimationFrame(function shouldUpdate(now) {
			if (currTime < 0) currTime = now;
			if (now - currTime > timeout) {
				callback(now);
				currTime = -1;
			} else safeRequestAnimationFrame(shouldUpdate);
		});
	}
}));
//#endregion
//#region node_modules/react-smooth/lib/AnimateManager.js
var require_AnimateManager = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = createAnimateManager;
	var _setRafTimeout = _interopRequireDefault(require_setRafTimeout());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function _toArray(arr) {
		return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest();
	}
	function _nonIterableRest() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray(o, minLen) {
		if (!o) return;
		if (typeof o === "string") return _arrayLikeToArray(o, minLen);
		var n = Object.prototype.toString.call(o).slice(8, -1);
		if (n === "Object" && o.constructor) n = o.constructor.name;
		if (n === "Map" || n === "Set") return Array.from(o);
		if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
	}
	function _arrayLikeToArray(arr, len) {
		if (len == null || len > arr.length) len = arr.length;
		for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
		return arr2;
	}
	function _iterableToArray(iter) {
		if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
	}
	function _arrayWithHoles(arr) {
		if (Array.isArray(arr)) return arr;
	}
	function createAnimateManager() {
		var currStyle = {};
		var handleChange = function handleChange() {
			return null;
		};
		var shouldStop = false;
		var setStyle = function setStyle(_style) {
			if (shouldStop) return;
			if (Array.isArray(_style)) {
				if (!_style.length) return;
				var _styles = _toArray(_style), curr = _styles[0], restStyles = _styles.slice(1);
				if (typeof curr === "number") {
					(0, _setRafTimeout.default)(setStyle.bind(null, restStyles), curr);
					return;
				}
				setStyle(curr);
				(0, _setRafTimeout.default)(setStyle.bind(null, restStyles));
				return;
			}
			if (_typeof(_style) === "object") {
				currStyle = _style;
				handleChange(currStyle);
			}
			if (typeof _style === "function") _style();
		};
		return {
			stop: function stop() {
				shouldStop = true;
			},
			start: function start(style) {
				shouldStop = false;
				setStyle(style);
			},
			subscribe: function subscribe(_handleChange) {
				handleChange = _handleChange;
				return function() {
					handleChange = function handleChange() {
						return null;
					};
				};
			}
		};
	}
}));
//#endregion
//#region node_modules/react-smooth/lib/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.warn = exports.mapObject = exports.log = exports.identity = exports.getTransitionVal = exports.getIntersectionKeys = exports.getDashCase = exports.debugf = exports.debug = void 0;
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	function _defineProperty(obj, key, value) {
		key = _toPropertyKey(key);
		if (key in obj) Object.defineProperty(obj, key, {
			value,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else obj[key] = value;
		return obj;
	}
	function _toPropertyKey(arg) {
		var key = _toPrimitive(arg, "string");
		return _typeof(key) === "symbol" ? key : String(key);
	}
	function _toPrimitive(input, hint) {
		if (_typeof(input) !== "object" || input === null) return input;
		var prim = input[Symbol.toPrimitive];
		if (prim !== void 0) {
			var res = prim.call(input, hint || "default");
			if (_typeof(res) !== "object") return res;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return (hint === "string" ? String : Number)(input);
	}
	exports.getIntersectionKeys = function getIntersectionKeys(preObj, nextObj) {
		return [Object.keys(preObj), Object.keys(nextObj)].reduce(function(a, b) {
			return a.filter(function(c) {
				return b.includes(c);
			});
		});
	};
	exports.identity = function identity(param) {
		return param;
	};
	var getDashCase = exports.getDashCase = function getDashCase(name) {
		return name.replace(/([A-Z])/g, function(v) {
			return "-".concat(v.toLowerCase());
		});
	};
	var log = exports.log = function log() {
		var _console;
		(_console = console).log.apply(_console, arguments);
	};
	exports.debug = function debug(name) {
		return function(item) {
			log(name, item);
			return item;
		};
	};
	exports.debugf = function debugf(tag, f) {
		return function() {
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			var res = f.apply(void 0, args);
			var name = tag || f.name || "anonymous function";
			var argNames = "(".concat(args.map(JSON.stringify).join(", "), ")");
			log("".concat(name, ": ").concat(argNames, " => ").concat(JSON.stringify(res)));
			return res;
		};
	};
	exports.mapObject = function mapObject(fn, obj) {
		return Object.keys(obj).reduce(function(res, key) {
			return _objectSpread(_objectSpread({}, res), {}, _defineProperty({}, key, fn(key, obj[key])));
		}, {});
	};
	exports.getTransitionVal = function getTransitionVal(props, duration, easing) {
		return props.map(function(prop) {
			return "".concat(getDashCase(prop), " ").concat(duration, "ms ").concat(easing);
		}).join(",");
	};
	var isDev = process.env.NODE_ENV !== "production";
	exports.warn = function warn(condition, format, a, b, c, d, e, f) {
		if (isDev && typeof console !== "undefined" && console.warn) {
			if (format === void 0) console.warn("LogUtils requires an error message argument");
			if (!condition) if (format === void 0) console.warn("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");
			else {
				var args = [
					a,
					b,
					c,
					d,
					e,
					f
				];
				var argIndex = 0;
				console.warn(format.replace(/%s/g, function() {
					return args[argIndex++];
				}));
			}
		}
	};
}));
//#endregion
//#region node_modules/react-smooth/lib/easing.js
var require_easing = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.configSpring = exports.configEasing = exports.configBezier = void 0;
	var _util = require_util();
	function _slicedToArray(arr, i) {
		return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
	}
	function _nonIterableRest() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _iterableToArrayLimit(r, l) {
		var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
		if (null != t) {
			var e, n, i, u, a = [], f = !0, o = !1;
			try {
				if (i = (t = t.call(r)).next, 0 === l) {
					if (Object(t) !== t) return;
					f = !1;
				} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
			} catch (r) {
				o = !0, n = r;
			} finally {
				try {
					if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
				} finally {
					if (o) throw n;
				}
			}
			return a;
		}
	}
	function _arrayWithHoles(arr) {
		if (Array.isArray(arr)) return arr;
	}
	function _toConsumableArray(arr) {
		return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
	}
	function _nonIterableSpread() {
		throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray(o, minLen) {
		if (!o) return;
		if (typeof o === "string") return _arrayLikeToArray(o, minLen);
		var n = Object.prototype.toString.call(o).slice(8, -1);
		if (n === "Object" && o.constructor) n = o.constructor.name;
		if (n === "Map" || n === "Set") return Array.from(o);
		if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
	}
	function _iterableToArray(iter) {
		if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
	}
	function _arrayWithoutHoles(arr) {
		if (Array.isArray(arr)) return _arrayLikeToArray(arr);
	}
	function _arrayLikeToArray(arr, len) {
		if (len == null || len > arr.length) len = arr.length;
		for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
		return arr2;
	}
	var ACCURACY = 1e-4;
	var cubicBezierFactor = function cubicBezierFactor(c1, c2) {
		return [
			0,
			3 * c1,
			3 * c2 - 6 * c1,
			3 * c1 - 3 * c2 + 1
		];
	};
	var multyTime = function multyTime(params, t) {
		return params.map(function(param, i) {
			return param * Math.pow(t, i);
		}).reduce(function(pre, curr) {
			return pre + curr;
		});
	};
	var cubicBezier = function cubicBezier(c1, c2) {
		return function(t) {
			return multyTime(cubicBezierFactor(c1, c2), t);
		};
	};
	var derivativeCubicBezier = function derivativeCubicBezier(c1, c2) {
		return function(t) {
			var params = cubicBezierFactor(c1, c2);
			return multyTime([].concat(_toConsumableArray(params.map(function(param, i) {
				return param * i;
			}).slice(1)), [0]), t);
		};
	};
	var configBezier = exports.configBezier = function configBezier() {
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		var x1 = args[0], y1 = args[1], x2 = args[2], y2 = args[3];
		if (args.length === 1) switch (args[0]) {
			case "linear":
				x1 = 0;
				y1 = 0;
				x2 = 1;
				y2 = 1;
				break;
			case "ease":
				x1 = .25;
				y1 = .1;
				x2 = .25;
				y2 = 1;
				break;
			case "ease-in":
				x1 = .42;
				y1 = 0;
				x2 = 1;
				y2 = 1;
				break;
			case "ease-out":
				x1 = .42;
				y1 = 0;
				x2 = .58;
				y2 = 1;
				break;
			case "ease-in-out":
				x1 = 0;
				y1 = 0;
				x2 = .58;
				y2 = 1;
				break;
			default:
				var easing = args[0].split("(");
				if (easing[0] === "cubic-bezier" && easing[1].split(")")[0].split(",").length === 4) {
					var _easing$1$split$0$spl2 = _slicedToArray(easing[1].split(")")[0].split(",").map(function(x) {
						return parseFloat(x);
					}), 4);
					x1 = _easing$1$split$0$spl2[0];
					y1 = _easing$1$split$0$spl2[1];
					x2 = _easing$1$split$0$spl2[2];
					y2 = _easing$1$split$0$spl2[3];
				} else (0, _util.warn)(false, "[configBezier]: arguments should be one of oneOf 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out','cubic-bezier(x1,y1,x2,y2)', instead received %s", args);
		}
		(0, _util.warn)([
			x1,
			x2,
			y1,
			y2
		].every(function(num) {
			return typeof num === "number" && num >= 0 && num <= 1;
		}), "[configBezier]: arguments should be x1, y1, x2, y2 of [0, 1] instead received %s", args);
		var curveX = cubicBezier(x1, x2);
		var curveY = cubicBezier(y1, y2);
		var derCurveX = derivativeCubicBezier(x1, x2);
		var rangeValue = function rangeValue(value) {
			if (value > 1) return 1;
			if (value < 0) return 0;
			return value;
		};
		var bezier = function bezier(_t) {
			var t = _t > 1 ? 1 : _t;
			var x = t;
			for (var i = 0; i < 8; ++i) {
				var evalT = curveX(x) - t;
				var derVal = derCurveX(x);
				if (Math.abs(evalT - t) < ACCURACY || derVal < ACCURACY) return curveY(x);
				x = rangeValue(x - evalT / derVal);
			}
			return curveY(x);
		};
		bezier.isStepper = false;
		return bezier;
	};
	var configSpring = exports.configSpring = function configSpring() {
		var config = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		var _config$stiff = config.stiff, stiff = _config$stiff === void 0 ? 100 : _config$stiff, _config$damping = config.damping, damping = _config$damping === void 0 ? 8 : _config$damping, _config$dt = config.dt, dt = _config$dt === void 0 ? 17 : _config$dt;
		var stepper = function stepper(currX, destX, currV) {
			var newV = currV + (-(currX - destX) * stiff - currV * damping) * dt / 1e3;
			var newX = currV * dt / 1e3 + currX;
			if (Math.abs(newX - destX) < ACCURACY && Math.abs(newV) < ACCURACY) return [destX, 0];
			return [newX, newV];
		};
		stepper.isStepper = true;
		stepper.dt = dt;
		return stepper;
	};
	exports.configEasing = function configEasing() {
		for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
		var easing = args[0];
		if (typeof easing === "string") switch (easing) {
			case "ease":
			case "ease-in-out":
			case "ease-out":
			case "ease-in":
			case "linear": return configBezier(easing);
			case "spring": return configSpring();
			default:
				if (easing.split("(")[0] === "cubic-bezier") return configBezier(easing);
				(0, _util.warn)(false, "[configEasing]: first argument should be one of 'ease', 'ease-in', 'ease-out', 'ease-in-out','cubic-bezier(x1,y1,x2,y2)', 'linear' and 'spring', instead  received %s", args);
		}
		if (typeof easing === "function") return easing;
		(0, _util.warn)(false, "[configEasing]: first argument type should be function or string, instead received %s", args);
		return null;
	};
}));
//#endregion
//#region node_modules/react-smooth/lib/configUpdate.js
var require_configUpdate = /* @__PURE__ */ __commonJSMin(((exports) => {
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _util = require_util();
	function _toConsumableArray(arr) {
		return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
	}
	function _nonIterableSpread() {
		throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _iterableToArray(iter) {
		if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
	}
	function _arrayWithoutHoles(arr) {
		if (Array.isArray(arr)) return _arrayLikeToArray(arr);
	}
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	function _defineProperty(obj, key, value) {
		key = _toPropertyKey(key);
		if (key in obj) Object.defineProperty(obj, key, {
			value,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else obj[key] = value;
		return obj;
	}
	function _toPropertyKey(arg) {
		var key = _toPrimitive(arg, "string");
		return _typeof(key) === "symbol" ? key : String(key);
	}
	function _toPrimitive(input, hint) {
		if (_typeof(input) !== "object" || input === null) return input;
		var prim = input[Symbol.toPrimitive];
		if (prim !== void 0) {
			var res = prim.call(input, hint || "default");
			if (_typeof(res) !== "object") return res;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return (hint === "string" ? String : Number)(input);
	}
	function _slicedToArray(arr, i) {
		return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
	}
	function _nonIterableRest() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray(o, minLen) {
		if (!o) return;
		if (typeof o === "string") return _arrayLikeToArray(o, minLen);
		var n = Object.prototype.toString.call(o).slice(8, -1);
		if (n === "Object" && o.constructor) n = o.constructor.name;
		if (n === "Map" || n === "Set") return Array.from(o);
		if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
	}
	function _arrayLikeToArray(arr, len) {
		if (len == null || len > arr.length) len = arr.length;
		for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
		return arr2;
	}
	function _iterableToArrayLimit(r, l) {
		var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
		if (null != t) {
			var e, n, i, u, a = [], f = !0, o = !1;
			try {
				if (i = (t = t.call(r)).next, 0 === l) {
					if (Object(t) !== t) return;
					f = !1;
				} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
			} catch (r) {
				o = !0, n = r;
			} finally {
				try {
					if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
				} finally {
					if (o) throw n;
				}
			}
			return a;
		}
	}
	function _arrayWithHoles(arr) {
		if (Array.isArray(arr)) return arr;
	}
	var alpha = function alpha(begin, end, k) {
		return begin + (end - begin) * k;
	};
	var needContinue = function needContinue(_ref) {
		return _ref.from !== _ref.to;
	};
	var calStepperVals = function calStepperVals(easing, preVals, steps) {
		var nextStepVals = (0, _util.mapObject)(function(key, val) {
			if (needContinue(val)) {
				var _easing2 = _slicedToArray(easing(val.from, val.to, val.velocity), 2), newX = _easing2[0], newV = _easing2[1];
				return _objectSpread(_objectSpread({}, val), {}, {
					from: newX,
					velocity: newV
				});
			}
			return val;
		}, preVals);
		if (steps < 1) return (0, _util.mapObject)(function(key, val) {
			if (needContinue(val)) return _objectSpread(_objectSpread({}, val), {}, {
				velocity: alpha(val.velocity, nextStepVals[key].velocity, steps),
				from: alpha(val.from, nextStepVals[key].from, steps)
			});
			return val;
		}, preVals);
		return calStepperVals(easing, nextStepVals, steps - 1);
	};
	exports.default = function _default(from, to, easing, duration, render) {
		var interKeys = (0, _util.getIntersectionKeys)(from, to);
		var timingStyle = interKeys.reduce(function(res, key) {
			return _objectSpread(_objectSpread({}, res), {}, _defineProperty({}, key, [from[key], to[key]]));
		}, {});
		var stepperStyle = interKeys.reduce(function(res, key) {
			return _objectSpread(_objectSpread({}, res), {}, _defineProperty({}, key, {
				from: from[key],
				velocity: 0,
				to: to[key]
			}));
		}, {});
		var cafId = -1;
		var preTime;
		var beginTime;
		var update = function update() {
			return null;
		};
		var getCurrStyle = function getCurrStyle() {
			return (0, _util.mapObject)(function(key, val) {
				return val.from;
			}, stepperStyle);
		};
		var shouldStopAnimation = function shouldStopAnimation() {
			return !Object.values(stepperStyle).filter(needContinue).length;
		};
		update = easing.isStepper ? function stepperUpdate(now) {
			if (!preTime) preTime = now;
			var steps = (now - preTime) / easing.dt;
			stepperStyle = calStepperVals(easing, stepperStyle, steps);
			render(_objectSpread(_objectSpread(_objectSpread({}, from), to), getCurrStyle(stepperStyle)));
			preTime = now;
			if (!shouldStopAnimation()) cafId = requestAnimationFrame(update);
		} : function timingUpdate(now) {
			if (!beginTime) beginTime = now;
			var t = (now - beginTime) / duration;
			var currStyle = (0, _util.mapObject)(function(key, val) {
				return alpha.apply(void 0, _toConsumableArray(val).concat([easing(t)]));
			}, timingStyle);
			render(_objectSpread(_objectSpread(_objectSpread({}, from), to), currStyle));
			if (t < 1) cafId = requestAnimationFrame(update);
			else {
				var finalStyle = (0, _util.mapObject)(function(key, val) {
					return alpha.apply(void 0, _toConsumableArray(val).concat([easing(1)]));
				}, timingStyle);
				render(_objectSpread(_objectSpread(_objectSpread({}, from), to), finalStyle));
			}
		};
		return function() {
			requestAnimationFrame(update);
			return function() {
				cancelAnimationFrame(cafId);
			};
		};
	};
}));
//#endregion
//#region node_modules/react-smooth/lib/Animate.js
var require_Animate = /* @__PURE__ */ __commonJSMin(((exports) => {
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _react = _interopRequireWildcard(require_react());
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _fastEquals = require_cjs$1();
	var _AnimateManager = _interopRequireDefault(require_AnimateManager());
	var _easing = require_easing();
	var _configUpdate = _interopRequireDefault(require_configUpdate());
	var _util = require_util();
	var _excluded = [
		"children",
		"begin",
		"duration",
		"attributeName",
		"easing",
		"isActive",
		"steps",
		"from",
		"to",
		"canBegin",
		"onAnimationEnd",
		"shouldReAnimate",
		"onAnimationReStart"
	];
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _getRequireWildcardCache(e) {
		if ("function" != typeof WeakMap) return null;
		var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
		return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {
			return e ? t : r;
		})(e);
	}
	function _interopRequireWildcard(e, r) {
		if (!r && e && e.__esModule) return e;
		if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e };
		var t = _getRequireWildcardCache(r);
		if (t && t.has(e)) return t.get(e);
		var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
		for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) {
			var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
			i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
		}
		return n.default = e, t && t.set(e, n), n;
	}
	function _objectWithoutProperties(source, excluded) {
		if (source == null) return {};
		var target = _objectWithoutPropertiesLoose(source, excluded);
		var key, i;
		if (Object.getOwnPropertySymbols) {
			var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
			for (i = 0; i < sourceSymbolKeys.length; i++) {
				key = sourceSymbolKeys[i];
				if (excluded.indexOf(key) >= 0) continue;
				if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
				target[key] = source[key];
			}
		}
		return target;
	}
	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;
		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}
		return target;
	}
	function _toConsumableArray(arr) {
		return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
	}
	function _nonIterableSpread() {
		throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray(o, minLen) {
		if (!o) return;
		if (typeof o === "string") return _arrayLikeToArray(o, minLen);
		var n = Object.prototype.toString.call(o).slice(8, -1);
		if (n === "Object" && o.constructor) n = o.constructor.name;
		if (n === "Map" || n === "Set") return Array.from(o);
		if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
	}
	function _iterableToArray(iter) {
		if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
	}
	function _arrayWithoutHoles(arr) {
		if (Array.isArray(arr)) return _arrayLikeToArray(arr);
	}
	function _arrayLikeToArray(arr, len) {
		if (len == null || len > arr.length) len = arr.length;
		for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
		return arr2;
	}
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	function _defineProperty(obj, key, value) {
		key = _toPropertyKey(key);
		if (key in obj) Object.defineProperty(obj, key, {
			value,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else obj[key] = value;
		return obj;
	}
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
		}
	}
	function _createClass(Constructor, protoProps, staticProps) {
		if (protoProps) _defineProperties(Constructor.prototype, protoProps);
		if (staticProps) _defineProperties(Constructor, staticProps);
		Object.defineProperty(Constructor, "prototype", { writable: false });
		return Constructor;
	}
	function _toPropertyKey(arg) {
		var key = _toPrimitive(arg, "string");
		return _typeof(key) === "symbol" ? key : String(key);
	}
	function _toPrimitive(input, hint) {
		if (_typeof(input) !== "object" || input === null) return input;
		var prim = input[Symbol.toPrimitive];
		if (prim !== void 0) {
			var res = prim.call(input, hint || "default");
			if (_typeof(res) !== "object") return res;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return (hint === "string" ? String : Number)(input);
	}
	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) throw new TypeError("Super expression must either be null or a function");
		subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: {
			value: subClass,
			writable: true,
			configurable: true
		} });
		Object.defineProperty(subClass, "prototype", { writable: false });
		if (superClass) _setPrototypeOf(subClass, superClass);
	}
	function _setPrototypeOf(o, p) {
		_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
			o.__proto__ = p;
			return o;
		};
		return _setPrototypeOf(o, p);
	}
	function _createSuper(Derived) {
		var hasNativeReflectConstruct = _isNativeReflectConstruct();
		return function _createSuperInternal() {
			var Super = _getPrototypeOf(Derived), result;
			if (hasNativeReflectConstruct) {
				var NewTarget = _getPrototypeOf(this).constructor;
				result = Reflect.construct(Super, arguments, NewTarget);
			} else result = Super.apply(this, arguments);
			return _possibleConstructorReturn(this, result);
		};
	}
	function _possibleConstructorReturn(self, call) {
		if (call && (_typeof(call) === "object" || typeof call === "function")) return call;
		else if (call !== void 0) throw new TypeError("Derived constructors may only return object or undefined");
		return _assertThisInitialized(self);
	}
	function _assertThisInitialized(self) {
		if (self === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		return self;
	}
	function _isNativeReflectConstruct() {
		if (typeof Reflect === "undefined" || !Reflect.construct) return false;
		if (Reflect.construct.sham) return false;
		if (typeof Proxy === "function") return true;
		try {
			Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
			return true;
		} catch (e) {
			return false;
		}
	}
	function _getPrototypeOf(o) {
		_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
			return o.__proto__ || Object.getPrototypeOf(o);
		};
		return _getPrototypeOf(o);
	}
	var Animate = /*#__PURE__*/ function(_PureComponent) {
		_inherits(Animate, _PureComponent);
		var _super = _createSuper(Animate);
		function Animate(props, context) {
			var _this;
			_classCallCheck(this, Animate);
			_this = _super.call(this, props, context);
			var _this$props = _this.props, isActive = _this$props.isActive, attributeName = _this$props.attributeName, from = _this$props.from, to = _this$props.to, steps = _this$props.steps, children = _this$props.children, duration = _this$props.duration;
			_this.handleStyleChange = _this.handleStyleChange.bind(_assertThisInitialized(_this));
			_this.changeStyle = _this.changeStyle.bind(_assertThisInitialized(_this));
			if (!isActive || duration <= 0) {
				_this.state = { style: {} };
				if (typeof children === "function") _this.state = { style: to };
				return _possibleConstructorReturn(_this);
			}
			if (steps && steps.length) _this.state = { style: steps[0].style };
			else if (from) {
				if (typeof children === "function") {
					_this.state = { style: from };
					return _possibleConstructorReturn(_this);
				}
				_this.state = { style: attributeName ? _defineProperty({}, attributeName, from) : from };
			} else _this.state = { style: {} };
			return _this;
		}
		_createClass(Animate, [
			{
				key: "componentDidMount",
				value: function componentDidMount() {
					var _this$props2 = this.props, isActive = _this$props2.isActive, canBegin = _this$props2.canBegin;
					this.mounted = true;
					if (!isActive || !canBegin) return;
					this.runAnimation(this.props);
				}
			},
			{
				key: "componentDidUpdate",
				value: function componentDidUpdate(prevProps) {
					var _this$props3 = this.props, isActive = _this$props3.isActive, canBegin = _this$props3.canBegin, attributeName = _this$props3.attributeName, shouldReAnimate = _this$props3.shouldReAnimate, to = _this$props3.to, currentFrom = _this$props3.from;
					var style = this.state.style;
					if (!canBegin) return;
					if (!isActive) {
						var newState = { style: attributeName ? _defineProperty({}, attributeName, to) : to };
						if (this.state && style) {
							if (attributeName && style[attributeName] !== to || !attributeName && style !== to) this.setState(newState);
						}
						return;
					}
					if ((0, _fastEquals.deepEqual)(prevProps.to, to) && prevProps.canBegin && prevProps.isActive) return;
					var isTriggered = !prevProps.canBegin || !prevProps.isActive;
					if (this.manager) this.manager.stop();
					if (this.stopJSAnimation) this.stopJSAnimation();
					var from = isTriggered || shouldReAnimate ? currentFrom : prevProps.to;
					if (this.state && style) {
						var _newState = { style: attributeName ? _defineProperty({}, attributeName, from) : from };
						if (attributeName && style[attributeName] !== from || !attributeName && style !== from) this.setState(_newState);
					}
					this.runAnimation(_objectSpread(_objectSpread({}, this.props), {}, {
						from,
						begin: 0
					}));
				}
			},
			{
				key: "componentWillUnmount",
				value: function componentWillUnmount() {
					this.mounted = false;
					var onAnimationEnd = this.props.onAnimationEnd;
					if (this.unSubscribe) this.unSubscribe();
					if (this.manager) {
						this.manager.stop();
						this.manager = null;
					}
					if (this.stopJSAnimation) this.stopJSAnimation();
					if (onAnimationEnd) onAnimationEnd();
				}
			},
			{
				key: "handleStyleChange",
				value: function handleStyleChange(style) {
					this.changeStyle(style);
				}
			},
			{
				key: "changeStyle",
				value: function changeStyle(style) {
					if (this.mounted) this.setState({ style });
				}
			},
			{
				key: "runJSAnimation",
				value: function runJSAnimation(props) {
					var _this2 = this;
					var from = props.from, to = props.to, duration = props.duration, easing = props.easing, begin = props.begin, onAnimationEnd = props.onAnimationEnd, onAnimationStart = props.onAnimationStart;
					var startAnimation = (0, _configUpdate.default)(from, to, (0, _easing.configEasing)(easing), duration, this.changeStyle);
					this.manager.start([
						onAnimationStart,
						begin,
						function finalStartAnimation() {
							_this2.stopJSAnimation = startAnimation();
						},
						duration,
						onAnimationEnd
					]);
				}
			},
			{
				key: "runStepAnimation",
				value: function runStepAnimation(props) {
					var _this3 = this;
					var steps = props.steps, begin = props.begin, onAnimationStart = props.onAnimationStart;
					var _steps$ = steps[0], initialStyle = _steps$.style, _steps$$duration = _steps$.duration, initialTime = _steps$$duration === void 0 ? 0 : _steps$$duration;
					return this.manager.start([onAnimationStart].concat(_toConsumableArray(steps.reduce(function addStyle(sequence, nextItem, index) {
						if (index === 0) return sequence;
						var duration = nextItem.duration, _nextItem$easing = nextItem.easing, easing = _nextItem$easing === void 0 ? "ease" : _nextItem$easing, style = nextItem.style, nextProperties = nextItem.properties, onAnimationEnd = nextItem.onAnimationEnd;
						var preItem = index > 0 ? steps[index - 1] : nextItem;
						var properties = nextProperties || Object.keys(style);
						if (typeof easing === "function" || easing === "spring") return [].concat(_toConsumableArray(sequence), [_this3.runJSAnimation.bind(_this3, {
							from: preItem.style,
							to: style,
							duration,
							easing
						}), duration]);
						var transition = (0, _util.getTransitionVal)(properties, duration, easing);
						var newStyle = _objectSpread(_objectSpread(_objectSpread({}, preItem.style), style), {}, { transition });
						return [].concat(_toConsumableArray(sequence), [
							newStyle,
							duration,
							onAnimationEnd
						]).filter(_util.identity);
					}, [initialStyle, Math.max(initialTime, begin)])), [props.onAnimationEnd]));
				}
			},
			{
				key: "runAnimation",
				value: function runAnimation(props) {
					if (!this.manager) this.manager = (0, _AnimateManager.default)();
					var begin = props.begin, duration = props.duration, attributeName = props.attributeName, propsTo = props.to, easing = props.easing, onAnimationStart = props.onAnimationStart, onAnimationEnd = props.onAnimationEnd, steps = props.steps, children = props.children;
					var manager = this.manager;
					this.unSubscribe = manager.subscribe(this.handleStyleChange);
					if (typeof easing === "function" || typeof children === "function" || easing === "spring") {
						this.runJSAnimation(props);
						return;
					}
					if (steps.length > 1) {
						this.runStepAnimation(props);
						return;
					}
					var to = attributeName ? _defineProperty({}, attributeName, propsTo) : propsTo;
					var transition = (0, _util.getTransitionVal)(Object.keys(to), duration, easing);
					manager.start([
						onAnimationStart,
						begin,
						_objectSpread(_objectSpread({}, to), {}, { transition }),
						duration,
						onAnimationEnd
					]);
				}
			},
			{
				key: "render",
				value: function render() {
					var _this$props4 = this.props, children = _this$props4.children;
					_this$props4.begin;
					var duration = _this$props4.duration;
					_this$props4.attributeName;
					_this$props4.easing;
					var isActive = _this$props4.isActive;
					_this$props4.steps;
					_this$props4.from;
					_this$props4.to;
					_this$props4.canBegin;
					_this$props4.onAnimationEnd;
					_this$props4.shouldReAnimate;
					_this$props4.onAnimationReStart;
					var others = _objectWithoutProperties(_this$props4, _excluded);
					var count = _react.Children.count(children);
					var stateStyle = this.state.style;
					if (typeof children === "function") return children(stateStyle);
					if (!isActive || count === 0 || duration <= 0) return children;
					var cloneContainer = function cloneContainer(container) {
						var _container$props = container.props, _container$props$styl = _container$props.style, style = _container$props$styl === void 0 ? {} : _container$props$styl, className = _container$props.className;
						return /* @__PURE__ */ (0, _react.cloneElement)(container, _objectSpread(_objectSpread({}, others), {}, {
							style: _objectSpread(_objectSpread({}, style), stateStyle),
							className
						}));
					};
					if (count === 1) return cloneContainer(_react.Children.only(children));
					return /*#__PURE__*/ _react.default.createElement("div", null, _react.Children.map(children, function(child) {
						return cloneContainer(child);
					}));
				}
			}
		]);
		return Animate;
	}(_react.PureComponent);
	Animate.displayName = "Animate";
	Animate.defaultProps = {
		begin: 0,
		duration: 1e3,
		from: "",
		to: "",
		attributeName: "",
		easing: "ease",
		isActive: true,
		canBegin: true,
		steps: [],
		onAnimationEnd: function onAnimationEnd() {},
		onAnimationStart: function onAnimationStart() {}
	};
	Animate.propTypes = {
		from: _propTypes.default.oneOfType([_propTypes.default.object, _propTypes.default.string]),
		to: _propTypes.default.oneOfType([_propTypes.default.object, _propTypes.default.string]),
		attributeName: _propTypes.default.string,
		duration: _propTypes.default.number,
		begin: _propTypes.default.number,
		easing: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.func]),
		steps: _propTypes.default.arrayOf(_propTypes.default.shape({
			duration: _propTypes.default.number.isRequired,
			style: _propTypes.default.object.isRequired,
			easing: _propTypes.default.oneOfType([_propTypes.default.oneOf([
				"ease",
				"ease-in",
				"ease-out",
				"ease-in-out",
				"linear"
			]), _propTypes.default.func]),
			properties: _propTypes.default.arrayOf("string"),
			onAnimationEnd: _propTypes.default.func
		})),
		children: _propTypes.default.oneOfType([_propTypes.default.node, _propTypes.default.func]),
		isActive: _propTypes.default.bool,
		canBegin: _propTypes.default.bool,
		onAnimationEnd: _propTypes.default.func,
		shouldReAnimate: _propTypes.default.bool,
		onAnimationStart: _propTypes.default.func,
		onAnimationReStart: _propTypes.default.func
	};
	exports.default = Animate;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/config.js
var require_config = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports.default = void 0;
	exports.default = { disabled: false };
	module.exports = exports.default;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/utils/PropTypes.js
var require_PropTypes = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.classNamesShape = exports.timeoutsShape = void 0;
	var _propTypes = _interopRequireDefault(require_prop_types());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	exports.timeoutsShape = process.env.NODE_ENV !== "production" ? _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.shape({
		enter: _propTypes.default.number,
		exit: _propTypes.default.number,
		appear: _propTypes.default.number
	}).isRequired]) : null;
	exports.classNamesShape = process.env.NODE_ENV !== "production" ? _propTypes.default.oneOfType([
		_propTypes.default.string,
		_propTypes.default.shape({
			enter: _propTypes.default.string,
			exit: _propTypes.default.string,
			active: _propTypes.default.string
		}),
		_propTypes.default.shape({
			enter: _propTypes.default.string,
			enterDone: _propTypes.default.string,
			enterActive: _propTypes.default.string,
			exit: _propTypes.default.string,
			exitDone: _propTypes.default.string,
			exitActive: _propTypes.default.string
		})
	]) : null;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/TransitionGroupContext.js
var require_TransitionGroupContext = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports.default = void 0;
	var _react = _interopRequireDefault(require_react());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	exports.default = _react.default.createContext(null);
	module.exports = exports.default;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/utils/reflow.js
var require_reflow = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.forceReflow = void 0;
	exports.forceReflow = function forceReflow(node) {
		return node.scrollTop;
	};
}));
//#endregion
//#region node_modules/react-transition-group/cjs/Transition.js
var require_Transition = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.default = exports.EXITING = exports.ENTERED = exports.ENTERING = exports.EXITED = exports.UNMOUNTED = void 0;
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _react = _interopRequireDefault(require_react());
	var _reactDom = _interopRequireDefault(require_react_dom());
	var _config = _interopRequireDefault(require_config());
	var _PropTypes = require_PropTypes();
	var _TransitionGroupContext = _interopRequireDefault(require_TransitionGroupContext());
	var _reflow = require_reflow();
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;
		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}
		return target;
	}
	function _inheritsLoose(subClass, superClass) {
		subClass.prototype = Object.create(superClass.prototype);
		subClass.prototype.constructor = subClass;
		subClass.__proto__ = superClass;
	}
	var UNMOUNTED = "unmounted";
	exports.UNMOUNTED = UNMOUNTED;
	var EXITED = "exited";
	exports.EXITED = EXITED;
	var ENTERING = "entering";
	exports.ENTERING = ENTERING;
	var ENTERED = "entered";
	exports.ENTERED = ENTERED;
	var EXITING = "exiting";
	/**
	* The Transition component lets you describe a transition from one component
	* state to another _over time_ with a simple declarative API. Most commonly
	* it's used to animate the mounting and unmounting of a component, but can also
	* be used to describe in-place transition states as well.
	*
	* ---
	*
	* **Note**: `Transition` is a platform-agnostic base component. If you're using
	* transitions in CSS, you'll probably want to use
	* [`CSSTransition`](https://reactcommunity.org/react-transition-group/css-transition)
	* instead. It inherits all the features of `Transition`, but contains
	* additional features necessary to play nice with CSS transitions (hence the
	* name of the component).
	*
	* ---
	*
	* By default the `Transition` component does not alter the behavior of the
	* component it renders, it only tracks "enter" and "exit" states for the
	* components. It's up to you to give meaning and effect to those states. For
	* example we can add styles to a component when it enters or exits:
	*
	* ```jsx
	* import { Transition } from 'react-transition-group';
	*
	* const duration = 300;
	*
	* const defaultStyle = {
	*   transition: `opacity ${duration}ms ease-in-out`,
	*   opacity: 0,
	* }
	*
	* const transitionStyles = {
	*   entering: { opacity: 1 },
	*   entered:  { opacity: 1 },
	*   exiting:  { opacity: 0 },
	*   exited:  { opacity: 0 },
	* };
	*
	* const Fade = ({ in: inProp }) => (
	*   <Transition in={inProp} timeout={duration}>
	*     {state => (
	*       <div style={{
	*         ...defaultStyle,
	*         ...transitionStyles[state]
	*       }}>
	*         I'm a fade Transition!
	*       </div>
	*     )}
	*   </Transition>
	* );
	* ```
	*
	* There are 4 main states a Transition can be in:
	*  - `'entering'`
	*  - `'entered'`
	*  - `'exiting'`
	*  - `'exited'`
	*
	* Transition state is toggled via the `in` prop. When `true` the component
	* begins the "Enter" stage. During this stage, the component will shift from
	* its current transition state, to `'entering'` for the duration of the
	* transition and then to the `'entered'` stage once it's complete. Let's take
	* the following example (we'll use the
	* [useState](https://reactjs.org/docs/hooks-reference.html#usestate) hook):
	*
	* ```jsx
	* function App() {
	*   const [inProp, setInProp] = useState(false);
	*   return (
	*     <div>
	*       <Transition in={inProp} timeout={500}>
	*         {state => (
	*           // ...
	*         )}
	*       </Transition>
	*       <button onClick={() => setInProp(true)}>
	*         Click to Enter
	*       </button>
	*     </div>
	*   );
	* }
	* ```
	*
	* When the button is clicked the component will shift to the `'entering'` state
	* and stay there for 500ms (the value of `timeout`) before it finally switches
	* to `'entered'`.
	*
	* When `in` is `false` the same thing happens except the state moves from
	* `'exiting'` to `'exited'`.
	*/
	exports.EXITING = EXITING;
	var Transition = /*#__PURE__*/ function(_React$Component) {
		_inheritsLoose(Transition, _React$Component);
		function Transition(props, context) {
			var _this = _React$Component.call(this, props, context) || this;
			var parentGroup = context;
			var appear = parentGroup && !parentGroup.isMounting ? props.enter : props.appear;
			var initialStatus;
			_this.appearStatus = null;
			if (props.in) if (appear) {
				initialStatus = EXITED;
				_this.appearStatus = ENTERING;
			} else initialStatus = ENTERED;
			else if (props.unmountOnExit || props.mountOnEnter) initialStatus = UNMOUNTED;
			else initialStatus = EXITED;
			_this.state = { status: initialStatus };
			_this.nextCallback = null;
			return _this;
		}
		Transition.getDerivedStateFromProps = function getDerivedStateFromProps(_ref, prevState) {
			if (_ref.in && prevState.status === UNMOUNTED) return { status: EXITED };
			return null;
		};
		var _proto = Transition.prototype;
		_proto.componentDidMount = function componentDidMount() {
			this.updateStatus(true, this.appearStatus);
		};
		_proto.componentDidUpdate = function componentDidUpdate(prevProps) {
			var nextStatus = null;
			if (prevProps !== this.props) {
				var status = this.state.status;
				if (this.props.in) {
					if (status !== ENTERING && status !== ENTERED) nextStatus = ENTERING;
				} else if (status === ENTERING || status === ENTERED) nextStatus = EXITING;
			}
			this.updateStatus(false, nextStatus);
		};
		_proto.componentWillUnmount = function componentWillUnmount() {
			this.cancelNextCallback();
		};
		_proto.getTimeouts = function getTimeouts() {
			var timeout = this.props.timeout;
			var exit = enter = appear = timeout, enter, appear;
			if (timeout != null && typeof timeout !== "number") {
				exit = timeout.exit;
				enter = timeout.enter;
				appear = timeout.appear !== void 0 ? timeout.appear : enter;
			}
			return {
				exit,
				enter,
				appear
			};
		};
		_proto.updateStatus = function updateStatus(mounting, nextStatus) {
			if (mounting === void 0) mounting = false;
			if (nextStatus !== null) {
				this.cancelNextCallback();
				if (nextStatus === ENTERING) {
					if (this.props.unmountOnExit || this.props.mountOnEnter) {
						var node = this.props.nodeRef ? this.props.nodeRef.current : _reactDom.default.findDOMNode(this);
						if (node) (0, _reflow.forceReflow)(node);
					}
					this.performEnter(mounting);
				} else this.performExit();
			} else if (this.props.unmountOnExit && this.state.status === EXITED) this.setState({ status: UNMOUNTED });
		};
		_proto.performEnter = function performEnter(mounting) {
			var _this2 = this;
			var enter = this.props.enter;
			var appearing = this.context ? this.context.isMounting : mounting;
			var _ref2 = this.props.nodeRef ? [appearing] : [_reactDom.default.findDOMNode(this), appearing], maybeNode = _ref2[0], maybeAppearing = _ref2[1];
			var timeouts = this.getTimeouts();
			var enterTimeout = appearing ? timeouts.appear : timeouts.enter;
			if (!mounting && !enter || _config.default.disabled) {
				this.safeSetState({ status: ENTERED }, function() {
					_this2.props.onEntered(maybeNode);
				});
				return;
			}
			this.props.onEnter(maybeNode, maybeAppearing);
			this.safeSetState({ status: ENTERING }, function() {
				_this2.props.onEntering(maybeNode, maybeAppearing);
				_this2.onTransitionEnd(enterTimeout, function() {
					_this2.safeSetState({ status: ENTERED }, function() {
						_this2.props.onEntered(maybeNode, maybeAppearing);
					});
				});
			});
		};
		_proto.performExit = function performExit() {
			var _this3 = this;
			var exit = this.props.exit;
			var timeouts = this.getTimeouts();
			var maybeNode = this.props.nodeRef ? void 0 : _reactDom.default.findDOMNode(this);
			if (!exit || _config.default.disabled) {
				this.safeSetState({ status: EXITED }, function() {
					_this3.props.onExited(maybeNode);
				});
				return;
			}
			this.props.onExit(maybeNode);
			this.safeSetState({ status: EXITING }, function() {
				_this3.props.onExiting(maybeNode);
				_this3.onTransitionEnd(timeouts.exit, function() {
					_this3.safeSetState({ status: EXITED }, function() {
						_this3.props.onExited(maybeNode);
					});
				});
			});
		};
		_proto.cancelNextCallback = function cancelNextCallback() {
			if (this.nextCallback !== null) {
				this.nextCallback.cancel();
				this.nextCallback = null;
			}
		};
		_proto.safeSetState = function safeSetState(nextState, callback) {
			callback = this.setNextCallback(callback);
			this.setState(nextState, callback);
		};
		_proto.setNextCallback = function setNextCallback(callback) {
			var _this4 = this;
			var active = true;
			this.nextCallback = function(event) {
				if (active) {
					active = false;
					_this4.nextCallback = null;
					callback(event);
				}
			};
			this.nextCallback.cancel = function() {
				active = false;
			};
			return this.nextCallback;
		};
		_proto.onTransitionEnd = function onTransitionEnd(timeout, handler) {
			this.setNextCallback(handler);
			var node = this.props.nodeRef ? this.props.nodeRef.current : _reactDom.default.findDOMNode(this);
			var doesNotHaveTimeoutOrListener = timeout == null && !this.props.addEndListener;
			if (!node || doesNotHaveTimeoutOrListener) {
				setTimeout(this.nextCallback, 0);
				return;
			}
			if (this.props.addEndListener) {
				var _ref3 = this.props.nodeRef ? [this.nextCallback] : [node, this.nextCallback], maybeNode = _ref3[0], maybeNextCallback = _ref3[1];
				this.props.addEndListener(maybeNode, maybeNextCallback);
			}
			if (timeout != null) setTimeout(this.nextCallback, timeout);
		};
		_proto.render = function render() {
			var status = this.state.status;
			if (status === UNMOUNTED) return null;
			var _this$props = this.props, children = _this$props.children;
			_this$props.in;
			_this$props.mountOnEnter;
			_this$props.unmountOnExit;
			_this$props.appear;
			_this$props.enter;
			_this$props.exit;
			_this$props.timeout;
			_this$props.addEndListener;
			_this$props.onEnter;
			_this$props.onEntering;
			_this$props.onEntered;
			_this$props.onExit;
			_this$props.onExiting;
			_this$props.onExited;
			_this$props.nodeRef;
			var childProps = _objectWithoutPropertiesLoose(_this$props, [
				"children",
				"in",
				"mountOnEnter",
				"unmountOnExit",
				"appear",
				"enter",
				"exit",
				"timeout",
				"addEndListener",
				"onEnter",
				"onEntering",
				"onEntered",
				"onExit",
				"onExiting",
				"onExited",
				"nodeRef"
			]);
			return /*#__PURE__*/ _react.default.createElement(_TransitionGroupContext.default.Provider, { value: null }, typeof children === "function" ? children(status, childProps) : _react.default.cloneElement(_react.default.Children.only(children), childProps));
		};
		return Transition;
	}(_react.default.Component);
	Transition.contextType = _TransitionGroupContext.default;
	Transition.propTypes = process.env.NODE_ENV !== "production" ? {
		/**
		* A React reference to DOM element that need to transition:
		* https://stackoverflow.com/a/51127130/4671932
		*
		*   - When `nodeRef` prop is used, `node` is not passed to callback functions
		*      (e.g. `onEnter`) because user already has direct access to the node.
		*   - When changing `key` prop of `Transition` in a `TransitionGroup` a new
		*     `nodeRef` need to be provided to `Transition` with changed `key` prop
		*     (see
		*     [test/CSSTransition-test.js](https://github.com/reactjs/react-transition-group/blob/13435f897b3ab71f6e19d724f145596f5910581c/test/CSSTransition-test.js#L362-L437)).
		*/
		nodeRef: _propTypes.default.shape({ current: typeof Element === "undefined" ? _propTypes.default.any : function(propValue, key, componentName, location, propFullName, secret) {
			var value = propValue[key];
			return _propTypes.default.instanceOf(value && "ownerDocument" in value ? value.ownerDocument.defaultView.Element : Element)(propValue, key, componentName, location, propFullName, secret);
		} }),
		/**
		* A `function` child can be used instead of a React element. This function is
		* called with the current transition status (`'entering'`, `'entered'`,
		* `'exiting'`, `'exited'`), which can be used to apply context
		* specific props to a component.
		*
		* ```jsx
		* <Transition in={this.state.in} timeout={150}>
		*   {state => (
		*     <MyComponent className={`fade fade-${state}`} />
		*   )}
		* </Transition>
		* ```
		*/
		children: _propTypes.default.oneOfType([_propTypes.default.func.isRequired, _propTypes.default.element.isRequired]).isRequired,
		/**
		* Show the component; triggers the enter or exit states
		*/
		in: _propTypes.default.bool,
		/**
		* By default the child component is mounted immediately along with
		* the parent `Transition` component. If you want to "lazy mount" the component on the
		* first `in={true}` you can set `mountOnEnter`. After the first enter transition the component will stay
		* mounted, even on "exited", unless you also specify `unmountOnExit`.
		*/
		mountOnEnter: _propTypes.default.bool,
		/**
		* By default the child component stays mounted after it reaches the `'exited'` state.
		* Set `unmountOnExit` if you'd prefer to unmount the component after it finishes exiting.
		*/
		unmountOnExit: _propTypes.default.bool,
		/**
		* By default the child component does not perform the enter transition when
		* it first mounts, regardless of the value of `in`. If you want this
		* behavior, set both `appear` and `in` to `true`.
		*
		* > **Note**: there are no special appear states like `appearing`/`appeared`, this prop
		* > only adds an additional enter transition. However, in the
		* > `<CSSTransition>` component that first enter transition does result in
		* > additional `.appear-*` classes, that way you can choose to style it
		* > differently.
		*/
		appear: _propTypes.default.bool,
		/**
		* Enable or disable enter transitions.
		*/
		enter: _propTypes.default.bool,
		/**
		* Enable or disable exit transitions.
		*/
		exit: _propTypes.default.bool,
		/**
		* The duration of the transition, in milliseconds.
		* Required unless `addEndListener` is provided.
		*
		* You may specify a single timeout for all transitions:
		*
		* ```jsx
		* timeout={500}
		* ```
		*
		* or individually:
		*
		* ```jsx
		* timeout={{
		*  appear: 500,
		*  enter: 300,
		*  exit: 500,
		* }}
		* ```
		*
		* - `appear` defaults to the value of `enter`
		* - `enter` defaults to `0`
		* - `exit` defaults to `0`
		*
		* @type {number | { enter?: number, exit?: number, appear?: number }}
		*/
		timeout: function timeout(props) {
			var pt = _PropTypes.timeoutsShape;
			if (!props.addEndListener) pt = pt.isRequired;
			for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
			return pt.apply(void 0, [props].concat(args));
		},
		/**
		* Add a custom transition end trigger. Called with the transitioning
		* DOM node and a `done` callback. Allows for more fine grained transition end
		* logic. Timeouts are still used as a fallback if provided.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* ```jsx
		* addEndListener={(node, done) => {
		*   // use the css transitionend event to mark the finish of a transition
		*   node.addEventListener('transitionend', done, false);
		* }}
		* ```
		*/
		addEndListener: _propTypes.default.func,
		/**
		* Callback fired before the "entering" status is applied. An extra parameter
		* `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* @type Function(node: HtmlElement, isAppearing: bool) -> void
		*/
		onEnter: _propTypes.default.func,
		/**
		* Callback fired after the "entering" status is applied. An extra parameter
		* `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* @type Function(node: HtmlElement, isAppearing: bool)
		*/
		onEntering: _propTypes.default.func,
		/**
		* Callback fired after the "entered" status is applied. An extra parameter
		* `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* @type Function(node: HtmlElement, isAppearing: bool) -> void
		*/
		onEntered: _propTypes.default.func,
		/**
		* Callback fired before the "exiting" status is applied.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* @type Function(node: HtmlElement) -> void
		*/
		onExit: _propTypes.default.func,
		/**
		* Callback fired after the "exiting" status is applied.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* @type Function(node: HtmlElement) -> void
		*/
		onExiting: _propTypes.default.func,
		/**
		* Callback fired after the "exited" status is applied.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed
		*
		* @type Function(node: HtmlElement) -> void
		*/
		onExited: _propTypes.default.func
	} : {};
	function noop() {}
	Transition.defaultProps = {
		in: false,
		mountOnEnter: false,
		unmountOnExit: false,
		appear: false,
		enter: true,
		exit: true,
		onEnter: noop,
		onEntering: noop,
		onEntered: noop,
		onExit: noop,
		onExiting: noop,
		onExited: noop
	};
	Transition.UNMOUNTED = UNMOUNTED;
	Transition.EXITED = EXITED;
	Transition.ENTERING = ENTERING;
	Transition.ENTERED = ENTERED;
	Transition.EXITING = EXITING;
	exports.default = Transition;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/CSSTransition.js
var require_CSSTransition = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports.default = void 0;
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _addClass2 = _interopRequireDefault(require_addClass());
	var _removeClass = _interopRequireDefault(require_removeClass());
	var _react = _interopRequireDefault(require_react());
	var _Transition = _interopRequireDefault(require_Transition());
	var _PropTypes = require_PropTypes();
	var _reflow = require_reflow();
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _extends() {
		_extends = Object.assign || function(target) {
			for (var i = 1; i < arguments.length; i++) {
				var source = arguments[i];
				for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
			}
			return target;
		};
		return _extends.apply(this, arguments);
	}
	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;
		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}
		return target;
	}
	function _inheritsLoose(subClass, superClass) {
		subClass.prototype = Object.create(superClass.prototype);
		subClass.prototype.constructor = subClass;
		subClass.__proto__ = superClass;
	}
	var _addClass = function addClass(node, classes) {
		return node && classes && classes.split(" ").forEach(function(c) {
			return (0, _addClass2.default)(node, c);
		});
	};
	var removeClass = function removeClass(node, classes) {
		return node && classes && classes.split(" ").forEach(function(c) {
			return (0, _removeClass.default)(node, c);
		});
	};
	/**
	* A transition component inspired by the excellent
	* [ng-animate](https://docs.angularjs.org/api/ngAnimate) library, you should
	* use it if you're using CSS transitions or animations. It's built upon the
	* [`Transition`](https://reactcommunity.org/react-transition-group/transition)
	* component, so it inherits all of its props.
	*
	* `CSSTransition` applies a pair of class names during the `appear`, `enter`,
	* and `exit` states of the transition. The first class is applied and then a
	* second `*-active` class in order to activate the CSS transition. After the
	* transition, matching `*-done` class names are applied to persist the
	* transition state.
	*
	* ```jsx
	* function App() {
	*   const [inProp, setInProp] = useState(false);
	*   return (
	*     <div>
	*       <CSSTransition in={inProp} timeout={200} classNames="my-node">
	*         <div>
	*           {"I'll receive my-node-* classes"}
	*         </div>
	*       </CSSTransition>
	*       <button type="button" onClick={() => setInProp(true)}>
	*         Click to Enter
	*       </button>
	*     </div>
	*   );
	* }
	* ```
	*
	* When the `in` prop is set to `true`, the child component will first receive
	* the class `example-enter`, then the `example-enter-active` will be added in
	* the next tick. `CSSTransition` [forces a
	* reflow](https://github.com/reactjs/react-transition-group/blob/5007303e729a74be66a21c3e2205e4916821524b/src/CSSTransition.js#L208-L215)
	* between before adding the `example-enter-active`. This is an important trick
	* because it allows us to transition between `example-enter` and
	* `example-enter-active` even though they were added immediately one after
	* another. Most notably, this is what makes it possible for us to animate
	* _appearance_.
	*
	* ```css
	* .my-node-enter {
	*   opacity: 0;
	* }
	* .my-node-enter-active {
	*   opacity: 1;
	*   transition: opacity 200ms;
	* }
	* .my-node-exit {
	*   opacity: 1;
	* }
	* .my-node-exit-active {
	*   opacity: 0;
	*   transition: opacity 200ms;
	* }
	* ```
	*
	* `*-active` classes represent which styles you want to animate **to**, so it's
	* important to add `transition` declaration only to them, otherwise transitions
	* might not behave as intended! This might not be obvious when the transitions
	* are symmetrical, i.e. when `*-enter-active` is the same as `*-exit`, like in
	* the example above (minus `transition`), but it becomes apparent in more
	* complex transitions.
	*
	* **Note**: If you're using the
	* [`appear`](http://reactcommunity.org/react-transition-group/transition#Transition-prop-appear)
	* prop, make sure to define styles for `.appear-*` classes as well.
	*/
	var CSSTransition = /*#__PURE__*/ function(_React$Component) {
		_inheritsLoose(CSSTransition, _React$Component);
		function CSSTransition() {
			var _this;
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			_this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
			_this.appliedClasses = {
				appear: {},
				enter: {},
				exit: {}
			};
			_this.onEnter = function(maybeNode, maybeAppearing) {
				var _this$resolveArgument = _this.resolveArguments(maybeNode, maybeAppearing), node = _this$resolveArgument[0], appearing = _this$resolveArgument[1];
				_this.removeClasses(node, "exit");
				_this.addClass(node, appearing ? "appear" : "enter", "base");
				if (_this.props.onEnter) _this.props.onEnter(maybeNode, maybeAppearing);
			};
			_this.onEntering = function(maybeNode, maybeAppearing) {
				var _this$resolveArgument2 = _this.resolveArguments(maybeNode, maybeAppearing), node = _this$resolveArgument2[0];
				var type = _this$resolveArgument2[1] ? "appear" : "enter";
				_this.addClass(node, type, "active");
				if (_this.props.onEntering) _this.props.onEntering(maybeNode, maybeAppearing);
			};
			_this.onEntered = function(maybeNode, maybeAppearing) {
				var _this$resolveArgument3 = _this.resolveArguments(maybeNode, maybeAppearing), node = _this$resolveArgument3[0];
				var type = _this$resolveArgument3[1] ? "appear" : "enter";
				_this.removeClasses(node, type);
				_this.addClass(node, type, "done");
				if (_this.props.onEntered) _this.props.onEntered(maybeNode, maybeAppearing);
			};
			_this.onExit = function(maybeNode) {
				var node = _this.resolveArguments(maybeNode)[0];
				_this.removeClasses(node, "appear");
				_this.removeClasses(node, "enter");
				_this.addClass(node, "exit", "base");
				if (_this.props.onExit) _this.props.onExit(maybeNode);
			};
			_this.onExiting = function(maybeNode) {
				var node = _this.resolveArguments(maybeNode)[0];
				_this.addClass(node, "exit", "active");
				if (_this.props.onExiting) _this.props.onExiting(maybeNode);
			};
			_this.onExited = function(maybeNode) {
				var node = _this.resolveArguments(maybeNode)[0];
				_this.removeClasses(node, "exit");
				_this.addClass(node, "exit", "done");
				if (_this.props.onExited) _this.props.onExited(maybeNode);
			};
			_this.resolveArguments = function(maybeNode, maybeAppearing) {
				return _this.props.nodeRef ? [_this.props.nodeRef.current, maybeNode] : [maybeNode, maybeAppearing];
			};
			_this.getClassNames = function(type) {
				var classNames = _this.props.classNames;
				var isStringClassNames = typeof classNames === "string";
				var prefix = isStringClassNames && classNames ? classNames + "-" : "";
				var baseClassName = isStringClassNames ? "" + prefix + type : classNames[type];
				return {
					baseClassName,
					activeClassName: isStringClassNames ? baseClassName + "-active" : classNames[type + "Active"],
					doneClassName: isStringClassNames ? baseClassName + "-done" : classNames[type + "Done"]
				};
			};
			return _this;
		}
		var _proto = CSSTransition.prototype;
		_proto.addClass = function addClass(node, type, phase) {
			var className = this.getClassNames(type)[phase + "ClassName"];
			var doneClassName = this.getClassNames("enter").doneClassName;
			if (type === "appear" && phase === "done" && doneClassName) className += " " + doneClassName;
			if (phase === "active") {
				if (node) (0, _reflow.forceReflow)(node);
			}
			if (className) {
				this.appliedClasses[type][phase] = className;
				_addClass(node, className);
			}
		};
		_proto.removeClasses = function removeClasses(node, type) {
			var _this$appliedClasses$ = this.appliedClasses[type], baseClassName = _this$appliedClasses$.base, activeClassName = _this$appliedClasses$.active, doneClassName = _this$appliedClasses$.done;
			this.appliedClasses[type] = {};
			if (baseClassName) removeClass(node, baseClassName);
			if (activeClassName) removeClass(node, activeClassName);
			if (doneClassName) removeClass(node, doneClassName);
		};
		_proto.render = function render() {
			var _this$props = this.props;
			_this$props.classNames;
			var props = _objectWithoutPropertiesLoose(_this$props, ["classNames"]);
			return /*#__PURE__*/ _react.default.createElement(_Transition.default, _extends({}, props, {
				onEnter: this.onEnter,
				onEntered: this.onEntered,
				onEntering: this.onEntering,
				onExit: this.onExit,
				onExiting: this.onExiting,
				onExited: this.onExited
			}));
		};
		return CSSTransition;
	}(_react.default.Component);
	CSSTransition.defaultProps = { classNames: "" };
	CSSTransition.propTypes = process.env.NODE_ENV !== "production" ? _extends({}, _Transition.default.propTypes, {
		/**
		* The animation classNames applied to the component as it appears, enters,
		* exits or has finished the transition. A single name can be provided, which
		* will be suffixed for each stage, e.g. `classNames="fade"` applies:
		*
		* - `fade-appear`, `fade-appear-active`, `fade-appear-done`
		* - `fade-enter`, `fade-enter-active`, `fade-enter-done`
		* - `fade-exit`, `fade-exit-active`, `fade-exit-done`
		*
		* A few details to note about how these classes are applied:
		*
		* 1. They are _joined_ with the ones that are already defined on the child
		*    component, so if you want to add some base styles, you can use
		*    `className` without worrying that it will be overridden.
		*
		* 2. If the transition component mounts with `in={false}`, no classes are
		*    applied yet. You might be expecting `*-exit-done`, but if you think
		*    about it, a component cannot finish exiting if it hasn't entered yet.
		*
		* 2. `fade-appear-done` and `fade-enter-done` will _both_ be applied. This
		*    allows you to define different behavior for when appearing is done and
		*    when regular entering is done, using selectors like
		*    `.fade-enter-done:not(.fade-appear-done)`. For example, you could apply
		*    an epic entrance animation when element first appears in the DOM using
		*    [Animate.css](https://daneden.github.io/animate.css/). Otherwise you can
		*    simply use `fade-enter-done` for defining both cases.
		*
		* Each individual classNames can also be specified independently like:
		*
		* ```js
		* classNames={{
		*  appear: 'my-appear',
		*  appearActive: 'my-active-appear',
		*  appearDone: 'my-done-appear',
		*  enter: 'my-enter',
		*  enterActive: 'my-active-enter',
		*  enterDone: 'my-done-enter',
		*  exit: 'my-exit',
		*  exitActive: 'my-active-exit',
		*  exitDone: 'my-done-exit',
		* }}
		* ```
		*
		* If you want to set these classes using CSS Modules:
		*
		* ```js
		* import styles from './styles.css';
		* ```
		*
		* you might want to use camelCase in your CSS file, that way could simply
		* spread them instead of listing them one by one:
		*
		* ```js
		* classNames={{ ...styles }}
		* ```
		*
		* @type {string | {
		*  appear?: string,
		*  appearActive?: string,
		*  appearDone?: string,
		*  enter?: string,
		*  enterActive?: string,
		*  enterDone?: string,
		*  exit?: string,
		*  exitActive?: string,
		*  exitDone?: string,
		* }}
		*/
		classNames: _PropTypes.classNamesShape,
		/**
		* A `<Transition>` callback fired immediately after the 'enter' or 'appear' class is
		* applied.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* @type Function(node: HtmlElement, isAppearing: bool)
		*/
		onEnter: _propTypes.default.func,
		/**
		* A `<Transition>` callback fired immediately after the 'enter-active' or
		* 'appear-active' class is applied.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* @type Function(node: HtmlElement, isAppearing: bool)
		*/
		onEntering: _propTypes.default.func,
		/**
		* A `<Transition>` callback fired immediately after the 'enter' or
		* 'appear' classes are **removed** and the `done` class is added to the DOM node.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed.
		*
		* @type Function(node: HtmlElement, isAppearing: bool)
		*/
		onEntered: _propTypes.default.func,
		/**
		* A `<Transition>` callback fired immediately after the 'exit' class is
		* applied.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed
		*
		* @type Function(node: HtmlElement)
		*/
		onExit: _propTypes.default.func,
		/**
		* A `<Transition>` callback fired immediately after the 'exit-active' is applied.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed
		*
		* @type Function(node: HtmlElement)
		*/
		onExiting: _propTypes.default.func,
		/**
		* A `<Transition>` callback fired immediately after the 'exit' classes
		* are **removed** and the `exit-done` class is added to the DOM node.
		*
		* **Note**: when `nodeRef` prop is passed, `node` is not passed
		*
		* @type Function(node: HtmlElement)
		*/
		onExited: _propTypes.default.func
	}) : {};
	exports.default = CSSTransition;
	module.exports = exports.default;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/utils/ChildMapping.js
var require_ChildMapping = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.getChildMapping = getChildMapping;
	exports.mergeChildMappings = mergeChildMappings;
	exports.getInitialChildMapping = getInitialChildMapping;
	exports.getNextChildMapping = getNextChildMapping;
	var _react = require_react();
	/**
	* Given `this.props.children`, return an object mapping key to child.
	*
	* @param {*} children `this.props.children`
	* @return {object} Mapping of key to child
	*/
	function getChildMapping(children, mapFn) {
		var mapper = function mapper(child) {
			return mapFn && (0, _react.isValidElement)(child) ? mapFn(child) : child;
		};
		var result = Object.create(null);
		if (children) _react.Children.map(children, function(c) {
			return c;
		}).forEach(function(child) {
			result[child.key] = mapper(child);
		});
		return result;
	}
	/**
	* When you're adding or removing children some may be added or removed in the
	* same render pass. We want to show *both* since we want to simultaneously
	* animate elements in and out. This function takes a previous set of keys
	* and a new set of keys and merges them with its best guess of the correct
	* ordering. In the future we may expose some of the utilities in
	* ReactMultiChild to make this easy, but for now React itself does not
	* directly have this concept of the union of prevChildren and nextChildren
	* so we implement it here.
	*
	* @param {object} prev prev children as returned from
	* `ReactTransitionChildMapping.getChildMapping()`.
	* @param {object} next next children as returned from
	* `ReactTransitionChildMapping.getChildMapping()`.
	* @return {object} a key set that contains all keys in `prev` and all keys
	* in `next` in a reasonable order.
	*/
	function mergeChildMappings(prev, next) {
		prev = prev || {};
		next = next || {};
		function getValueForKey(key) {
			return key in next ? next[key] : prev[key];
		}
		var nextKeysPending = Object.create(null);
		var pendingKeys = [];
		for (var prevKey in prev) if (prevKey in next) {
			if (pendingKeys.length) {
				nextKeysPending[prevKey] = pendingKeys;
				pendingKeys = [];
			}
		} else pendingKeys.push(prevKey);
		var i;
		var childMapping = {};
		for (var nextKey in next) {
			if (nextKeysPending[nextKey]) for (i = 0; i < nextKeysPending[nextKey].length; i++) {
				var pendingNextKey = nextKeysPending[nextKey][i];
				childMapping[nextKeysPending[nextKey][i]] = getValueForKey(pendingNextKey);
			}
			childMapping[nextKey] = getValueForKey(nextKey);
		}
		for (i = 0; i < pendingKeys.length; i++) childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i]);
		return childMapping;
	}
	function getProp(child, prop, props) {
		return props[prop] != null ? props[prop] : child.props[prop];
	}
	function getInitialChildMapping(props, onExited) {
		return getChildMapping(props.children, function(child) {
			return (0, _react.cloneElement)(child, {
				onExited: onExited.bind(null, child),
				in: true,
				appear: getProp(child, "appear", props),
				enter: getProp(child, "enter", props),
				exit: getProp(child, "exit", props)
			});
		});
	}
	function getNextChildMapping(nextProps, prevChildMapping, onExited) {
		var nextChildMapping = getChildMapping(nextProps.children);
		var children = mergeChildMappings(prevChildMapping, nextChildMapping);
		Object.keys(children).forEach(function(key) {
			var child = children[key];
			if (!(0, _react.isValidElement)(child)) return;
			var hasPrev = key in prevChildMapping;
			var hasNext = key in nextChildMapping;
			var prevChild = prevChildMapping[key];
			var isLeaving = (0, _react.isValidElement)(prevChild) && !prevChild.props.in;
			if (hasNext && (!hasPrev || isLeaving)) children[key] = (0, _react.cloneElement)(child, {
				onExited: onExited.bind(null, child),
				in: true,
				exit: getProp(child, "exit", nextProps),
				enter: getProp(child, "enter", nextProps)
			});
			else if (!hasNext && hasPrev && !isLeaving) children[key] = (0, _react.cloneElement)(child, { in: false });
			else if (hasNext && hasPrev && (0, _react.isValidElement)(prevChild)) children[key] = (0, _react.cloneElement)(child, {
				onExited: onExited.bind(null, child),
				in: prevChild.props.in,
				exit: getProp(child, "exit", nextProps),
				enter: getProp(child, "enter", nextProps)
			});
		});
		return children;
	}
}));
//#endregion
//#region node_modules/react-transition-group/cjs/TransitionGroup.js
var require_TransitionGroup = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports.default = void 0;
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _react = _interopRequireDefault(require_react());
	var _TransitionGroupContext = _interopRequireDefault(require_TransitionGroupContext());
	var _ChildMapping = require_ChildMapping();
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;
		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}
		return target;
	}
	function _extends() {
		_extends = Object.assign || function(target) {
			for (var i = 1; i < arguments.length; i++) {
				var source = arguments[i];
				for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
			}
			return target;
		};
		return _extends.apply(this, arguments);
	}
	function _assertThisInitialized(self) {
		if (self === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		return self;
	}
	function _inheritsLoose(subClass, superClass) {
		subClass.prototype = Object.create(superClass.prototype);
		subClass.prototype.constructor = subClass;
		subClass.__proto__ = superClass;
	}
	var values = Object.values || function(obj) {
		return Object.keys(obj).map(function(k) {
			return obj[k];
		});
	};
	var defaultProps = {
		component: "div",
		childFactory: function childFactory(child) {
			return child;
		}
	};
	/**
	* The `<TransitionGroup>` component manages a set of transition components
	* (`<Transition>` and `<CSSTransition>`) in a list. Like with the transition
	* components, `<TransitionGroup>` is a state machine for managing the mounting
	* and unmounting of components over time.
	*
	* Consider the example below. As items are removed or added to the TodoList the
	* `in` prop is toggled automatically by the `<TransitionGroup>`.
	*
	* Note that `<TransitionGroup>`  does not define any animation behavior!
	* Exactly _how_ a list item animates is up to the individual transition
	* component. This means you can mix and match animations across different list
	* items.
	*/
	var TransitionGroup = /*#__PURE__*/ function(_React$Component) {
		_inheritsLoose(TransitionGroup, _React$Component);
		function TransitionGroup(props, context) {
			var _this = _React$Component.call(this, props, context) || this;
			_this.state = {
				contextValue: { isMounting: true },
				handleExited: _this.handleExited.bind(_assertThisInitialized(_this)),
				firstRender: true
			};
			return _this;
		}
		var _proto = TransitionGroup.prototype;
		_proto.componentDidMount = function componentDidMount() {
			this.mounted = true;
			this.setState({ contextValue: { isMounting: false } });
		};
		_proto.componentWillUnmount = function componentWillUnmount() {
			this.mounted = false;
		};
		TransitionGroup.getDerivedStateFromProps = function getDerivedStateFromProps(nextProps, _ref) {
			var prevChildMapping = _ref.children, handleExited = _ref.handleExited;
			return {
				children: _ref.firstRender ? (0, _ChildMapping.getInitialChildMapping)(nextProps, handleExited) : (0, _ChildMapping.getNextChildMapping)(nextProps, prevChildMapping, handleExited),
				firstRender: false
			};
		};
		_proto.handleExited = function handleExited(child, node) {
			var currentChildMapping = (0, _ChildMapping.getChildMapping)(this.props.children);
			if (child.key in currentChildMapping) return;
			if (child.props.onExited) child.props.onExited(node);
			if (this.mounted) this.setState(function(state) {
				var children = _extends({}, state.children);
				delete children[child.key];
				return { children };
			});
		};
		_proto.render = function render() {
			var _this$props = this.props, Component = _this$props.component, childFactory = _this$props.childFactory, props = _objectWithoutPropertiesLoose(_this$props, ["component", "childFactory"]);
			var contextValue = this.state.contextValue;
			var children = values(this.state.children).map(childFactory);
			delete props.appear;
			delete props.enter;
			delete props.exit;
			if (Component === null) return /*#__PURE__*/ _react.default.createElement(_TransitionGroupContext.default.Provider, { value: contextValue }, children);
			return /*#__PURE__*/ _react.default.createElement(_TransitionGroupContext.default.Provider, { value: contextValue }, /*#__PURE__*/ _react.default.createElement(Component, props, children));
		};
		return TransitionGroup;
	}(_react.default.Component);
	TransitionGroup.propTypes = process.env.NODE_ENV !== "production" ? {
		/**
		* `<TransitionGroup>` renders a `<div>` by default. You can change this
		* behavior by providing a `component` prop.
		* If you use React v16+ and would like to avoid a wrapping `<div>` element
		* you can pass in `component={null}`. This is useful if the wrapping div
		* borks your css styles.
		*/
		component: _propTypes.default.any,
		/**
		* A set of `<Transition>` components, that are toggled `in` and out as they
		* leave. the `<TransitionGroup>` will inject specific transition props, so
		* remember to spread them through if you are wrapping the `<Transition>` as
		* with our `<Fade>` example.
		*
		* While this component is meant for multiple `Transition` or `CSSTransition`
		* children, sometimes you may want to have a single transition child with
		* content that you want to be transitioned out and in when you change it
		* (e.g. routes, images etc.) In that case you can change the `key` prop of
		* the transition child as you change its content, this will cause
		* `TransitionGroup` to transition the child out and back in.
		*/
		children: _propTypes.default.node,
		/**
		* A convenience prop that enables or disables appear animations
		* for all children. Note that specifying this will override any defaults set
		* on individual children Transitions.
		*/
		appear: _propTypes.default.bool,
		/**
		* A convenience prop that enables or disables enter animations
		* for all children. Note that specifying this will override any defaults set
		* on individual children Transitions.
		*/
		enter: _propTypes.default.bool,
		/**
		* A convenience prop that enables or disables exit animations
		* for all children. Note that specifying this will override any defaults set
		* on individual children Transitions.
		*/
		exit: _propTypes.default.bool,
		/**
		* You may need to apply reactive updates to a child as it is exiting.
		* This is generally done by using `cloneElement` however in the case of an exiting
		* child the element has already been removed and not accessible to the consumer.
		*
		* If you do need to update a child as it leaves you can provide a `childFactory`
		* to wrap every child, even the ones that are leaving.
		*
		* @type Function(child: ReactElement) -> ReactElement
		*/
		childFactory: _propTypes.default.func
	} : {};
	TransitionGroup.defaultProps = defaultProps;
	exports.default = TransitionGroup;
	module.exports = exports.default;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/ReplaceTransition.js
var require_ReplaceTransition = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports.default = void 0;
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _react = _interopRequireDefault(require_react());
	var _reactDom = _interopRequireDefault(require_react_dom());
	var _TransitionGroup = _interopRequireDefault(require_TransitionGroup());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;
		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}
		return target;
	}
	function _inheritsLoose(subClass, superClass) {
		subClass.prototype = Object.create(superClass.prototype);
		subClass.prototype.constructor = subClass;
		subClass.__proto__ = superClass;
	}
	/**
	* The `<ReplaceTransition>` component is a specialized `Transition` component
	* that animates between two children.
	*
	* ```jsx
	* <ReplaceTransition in>
	*   <Fade><div>I appear first</div></Fade>
	*   <Fade><div>I replace the above</div></Fade>
	* </ReplaceTransition>
	* ```
	*/
	var ReplaceTransition = /*#__PURE__*/ function(_React$Component) {
		_inheritsLoose(ReplaceTransition, _React$Component);
		function ReplaceTransition() {
			var _this;
			for (var _len = arguments.length, _args = new Array(_len), _key = 0; _key < _len; _key++) _args[_key] = arguments[_key];
			_this = _React$Component.call.apply(_React$Component, [this].concat(_args)) || this;
			_this.handleEnter = function() {
				for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
				return _this.handleLifecycle("onEnter", 0, args);
			};
			_this.handleEntering = function() {
				for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) args[_key3] = arguments[_key3];
				return _this.handleLifecycle("onEntering", 0, args);
			};
			_this.handleEntered = function() {
				for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) args[_key4] = arguments[_key4];
				return _this.handleLifecycle("onEntered", 0, args);
			};
			_this.handleExit = function() {
				for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) args[_key5] = arguments[_key5];
				return _this.handleLifecycle("onExit", 1, args);
			};
			_this.handleExiting = function() {
				for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) args[_key6] = arguments[_key6];
				return _this.handleLifecycle("onExiting", 1, args);
			};
			_this.handleExited = function() {
				for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) args[_key7] = arguments[_key7];
				return _this.handleLifecycle("onExited", 1, args);
			};
			return _this;
		}
		var _proto = ReplaceTransition.prototype;
		_proto.handleLifecycle = function handleLifecycle(handler, idx, originalArgs) {
			var _child$props;
			var children = this.props.children;
			var child = _react.default.Children.toArray(children)[idx];
			if (child.props[handler]) (_child$props = child.props)[handler].apply(_child$props, originalArgs);
			if (this.props[handler]) {
				var maybeNode = child.props.nodeRef ? void 0 : _reactDom.default.findDOMNode(this);
				this.props[handler](maybeNode);
			}
		};
		_proto.render = function render() {
			var _this$props = this.props, children = _this$props.children, inProp = _this$props.in, props = _objectWithoutPropertiesLoose(_this$props, ["children", "in"]);
			var _React$Children$toArr = _react.default.Children.toArray(children), first = _React$Children$toArr[0], second = _React$Children$toArr[1];
			delete props.onEnter;
			delete props.onEntering;
			delete props.onEntered;
			delete props.onExit;
			delete props.onExiting;
			delete props.onExited;
			return /*#__PURE__*/ _react.default.createElement(_TransitionGroup.default, props, inProp ? _react.default.cloneElement(first, {
				key: "first",
				onEnter: this.handleEnter,
				onEntering: this.handleEntering,
				onEntered: this.handleEntered
			}) : _react.default.cloneElement(second, {
				key: "second",
				onEnter: this.handleExit,
				onEntering: this.handleExiting,
				onEntered: this.handleExited
			}));
		};
		return ReplaceTransition;
	}(_react.default.Component);
	ReplaceTransition.propTypes = process.env.NODE_ENV !== "production" ? {
		in: _propTypes.default.bool.isRequired,
		children: function children(props, propName) {
			if (_react.default.Children.count(props[propName]) !== 2) return /* @__PURE__ */ new Error("\"" + propName + "\" must be exactly two transition components.");
			return null;
		}
	} : {};
	exports.default = ReplaceTransition;
	module.exports = exports.default;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/SwitchTransition.js
var require_SwitchTransition = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.default = exports.modes = void 0;
	var _react = _interopRequireDefault(require_react());
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _Transition = require_Transition();
	var _TransitionGroupContext = _interopRequireDefault(require_TransitionGroupContext());
	var _leaveRenders;
	var _enterRenders;
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _inheritsLoose(subClass, superClass) {
		subClass.prototype = Object.create(superClass.prototype);
		subClass.prototype.constructor = subClass;
		subClass.__proto__ = superClass;
	}
	function areChildrenDifferent(oldChildren, newChildren) {
		if (oldChildren === newChildren) return false;
		if (_react.default.isValidElement(oldChildren) && _react.default.isValidElement(newChildren) && oldChildren.key != null && oldChildren.key === newChildren.key) return false;
		return true;
	}
	/**
	* Enum of modes for SwitchTransition component
	* @enum { string }
	*/
	var modes = {
		out: "out-in",
		in: "in-out"
	};
	exports.modes = modes;
	var callHook = function callHook(element, name, cb) {
		return function() {
			var _element$props;
			element.props[name] && (_element$props = element.props)[name].apply(_element$props, arguments);
			cb();
		};
	};
	var leaveRenders = (_leaveRenders = {}, _leaveRenders[modes.out] = function(_ref) {
		var current = _ref.current, changeState = _ref.changeState;
		return _react.default.cloneElement(current, {
			in: false,
			onExited: callHook(current, "onExited", function() {
				changeState(_Transition.ENTERING, null);
			})
		});
	}, _leaveRenders[modes.in] = function(_ref2) {
		var current = _ref2.current, changeState = _ref2.changeState, children = _ref2.children;
		return [current, _react.default.cloneElement(children, {
			in: true,
			onEntered: callHook(children, "onEntered", function() {
				changeState(_Transition.ENTERING);
			})
		})];
	}, _leaveRenders);
	var enterRenders = (_enterRenders = {}, _enterRenders[modes.out] = function(_ref3) {
		var children = _ref3.children, changeState = _ref3.changeState;
		return _react.default.cloneElement(children, {
			in: true,
			onEntered: callHook(children, "onEntered", function() {
				changeState(_Transition.ENTERED, _react.default.cloneElement(children, { in: true }));
			})
		});
	}, _enterRenders[modes.in] = function(_ref4) {
		var current = _ref4.current, children = _ref4.children, changeState = _ref4.changeState;
		return [_react.default.cloneElement(current, {
			in: false,
			onExited: callHook(current, "onExited", function() {
				changeState(_Transition.ENTERED, _react.default.cloneElement(children, { in: true }));
			})
		}), _react.default.cloneElement(children, { in: true })];
	}, _enterRenders);
	/**
	* A transition component inspired by the [vue transition modes](https://vuejs.org/v2/guide/transitions.html#Transition-Modes).
	* You can use it when you want to control the render between state transitions.
	* Based on the selected mode and the child's key which is the `Transition` or `CSSTransition` component, the `SwitchTransition` makes a consistent transition between them.
	*
	* If the `out-in` mode is selected, the `SwitchTransition` waits until the old child leaves and then inserts a new child.
	* If the `in-out` mode is selected, the `SwitchTransition` inserts a new child first, waits for the new child to enter and then removes the old child.
	*
	* **Note**: If you want the animation to happen simultaneously
	* (that is, to have the old child removed and a new child inserted **at the same time**),
	* you should use
	* [`TransitionGroup`](https://reactcommunity.org/react-transition-group/transition-group)
	* instead.
	*
	* ```jsx
	* function App() {
	*  const [state, setState] = useState(false);
	*  return (
	*    <SwitchTransition>
	*      <CSSTransition
	*        key={state ? "Goodbye, world!" : "Hello, world!"}
	*        addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}
	*        classNames='fade'
	*      >
	*        <button onClick={() => setState(state => !state)}>
	*          {state ? "Goodbye, world!" : "Hello, world!"}
	*        </button>
	*      </CSSTransition>
	*    </SwitchTransition>
	*  );
	* }
	* ```
	*
	* ```css
	* .fade-enter{
	*    opacity: 0;
	* }
	* .fade-exit{
	*    opacity: 1;
	* }
	* .fade-enter-active{
	*    opacity: 1;
	* }
	* .fade-exit-active{
	*    opacity: 0;
	* }
	* .fade-enter-active,
	* .fade-exit-active{
	*    transition: opacity 500ms;
	* }
	* ```
	*/
	var SwitchTransition = /*#__PURE__*/ function(_React$Component) {
		_inheritsLoose(SwitchTransition, _React$Component);
		function SwitchTransition() {
			var _this;
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			_this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
			_this.state = {
				status: _Transition.ENTERED,
				current: null
			};
			_this.appeared = false;
			_this.changeState = function(status, current) {
				if (current === void 0) current = _this.state.current;
				_this.setState({
					status,
					current
				});
			};
			return _this;
		}
		var _proto = SwitchTransition.prototype;
		_proto.componentDidMount = function componentDidMount() {
			this.appeared = true;
		};
		SwitchTransition.getDerivedStateFromProps = function getDerivedStateFromProps(props, state) {
			if (props.children == null) return { current: null };
			if (state.status === _Transition.ENTERING && props.mode === modes.in) return { status: _Transition.ENTERING };
			if (state.current && areChildrenDifferent(state.current, props.children)) return { status: _Transition.EXITING };
			return { current: _react.default.cloneElement(props.children, { in: true }) };
		};
		_proto.render = function render() {
			var _this$props = this.props, children = _this$props.children, mode = _this$props.mode, _this$state = this.state, status = _this$state.status, current = _this$state.current;
			var data = {
				children,
				current,
				changeState: this.changeState,
				status
			};
			var component;
			switch (status) {
				case _Transition.ENTERING:
					component = enterRenders[mode](data);
					break;
				case _Transition.EXITING:
					component = leaveRenders[mode](data);
					break;
				case _Transition.ENTERED: component = current;
			}
			return /*#__PURE__*/ _react.default.createElement(_TransitionGroupContext.default.Provider, { value: { isMounting: !this.appeared } }, component);
		};
		return SwitchTransition;
	}(_react.default.Component);
	SwitchTransition.propTypes = process.env.NODE_ENV !== "production" ? {
		/**
		* Transition modes.
		* `out-in`: Current element transitions out first, then when complete, the new element transitions in.
		* `in-out`: New element transitions in first, then when complete, the current element transitions out.
		*
		* @type {'out-in'|'in-out'}
		*/
		mode: _propTypes.default.oneOf([modes.in, modes.out]),
		/**
		* Any `Transition` or `CSSTransition` component.
		*/
		children: _propTypes.default.oneOfType([_propTypes.default.element.isRequired])
	} : {};
	SwitchTransition.defaultProps = { mode: modes.out };
	exports.default = SwitchTransition;
}));
//#endregion
//#region node_modules/react-transition-group/cjs/index.js
var require_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.config = exports.Transition = exports.TransitionGroup = exports.SwitchTransition = exports.ReplaceTransition = exports.CSSTransition = void 0;
	exports.CSSTransition = _interopRequireDefault(require_CSSTransition()).default;
	exports.ReplaceTransition = _interopRequireDefault(require_ReplaceTransition()).default;
	exports.SwitchTransition = _interopRequireDefault(require_SwitchTransition()).default;
	exports.TransitionGroup = _interopRequireDefault(require_TransitionGroup()).default;
	exports.Transition = _interopRequireDefault(require_Transition()).default;
	exports.config = _interopRequireDefault(require_config()).default;
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
}));
//#endregion
//#region node_modules/react-smooth/lib/AnimateGroupChild.js
var require_AnimateGroupChild = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _react = _interopRequireWildcard(require_react());
	var _reactTransitionGroup = require_cjs();
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _Animate = _interopRequireDefault(require_Animate());
	var _excluded = [
		"children",
		"appearOptions",
		"enterOptions",
		"leaveOptions"
	];
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _getRequireWildcardCache(e) {
		if ("function" != typeof WeakMap) return null;
		var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
		return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {
			return e ? t : r;
		})(e);
	}
	function _interopRequireWildcard(e, r) {
		if (!r && e && e.__esModule) return e;
		if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e };
		var t = _getRequireWildcardCache(r);
		if (t && t.has(e)) return t.get(e);
		var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
		for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) {
			var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
			i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
		}
		return n.default = e, t && t.set(e, n), n;
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function _extends() {
		_extends = Object.assign ? Object.assign.bind() : function(target) {
			for (var i = 1; i < arguments.length; i++) {
				var source = arguments[i];
				for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
			}
			return target;
		};
		return _extends.apply(this, arguments);
	}
	function _objectWithoutProperties(source, excluded) {
		if (source == null) return {};
		var target = _objectWithoutPropertiesLoose(source, excluded);
		var key, i;
		if (Object.getOwnPropertySymbols) {
			var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
			for (i = 0; i < sourceSymbolKeys.length; i++) {
				key = sourceSymbolKeys[i];
				if (excluded.indexOf(key) >= 0) continue;
				if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
				target[key] = source[key];
			}
		}
		return target;
	}
	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;
		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}
		return target;
	}
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
		}
	}
	function _createClass(Constructor, protoProps, staticProps) {
		if (protoProps) _defineProperties(Constructor.prototype, protoProps);
		if (staticProps) _defineProperties(Constructor, staticProps);
		Object.defineProperty(Constructor, "prototype", { writable: false });
		return Constructor;
	}
	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) throw new TypeError("Super expression must either be null or a function");
		subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: {
			value: subClass,
			writable: true,
			configurable: true
		} });
		Object.defineProperty(subClass, "prototype", { writable: false });
		if (superClass) _setPrototypeOf(subClass, superClass);
	}
	function _setPrototypeOf(o, p) {
		_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
			o.__proto__ = p;
			return o;
		};
		return _setPrototypeOf(o, p);
	}
	function _createSuper(Derived) {
		var hasNativeReflectConstruct = _isNativeReflectConstruct();
		return function _createSuperInternal() {
			var Super = _getPrototypeOf(Derived), result;
			if (hasNativeReflectConstruct) {
				var NewTarget = _getPrototypeOf(this).constructor;
				result = Reflect.construct(Super, arguments, NewTarget);
			} else result = Super.apply(this, arguments);
			return _possibleConstructorReturn(this, result);
		};
	}
	function _possibleConstructorReturn(self, call) {
		if (call && (_typeof(call) === "object" || typeof call === "function")) return call;
		else if (call !== void 0) throw new TypeError("Derived constructors may only return object or undefined");
		return _assertThisInitialized(self);
	}
	function _assertThisInitialized(self) {
		if (self === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		return self;
	}
	function _isNativeReflectConstruct() {
		if (typeof Reflect === "undefined" || !Reflect.construct) return false;
		if (Reflect.construct.sham) return false;
		if (typeof Proxy === "function") return true;
		try {
			Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
			return true;
		} catch (e) {
			return false;
		}
	}
	function _getPrototypeOf(o) {
		_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
			return o.__proto__ || Object.getPrototypeOf(o);
		};
		return _getPrototypeOf(o);
	}
	function _defineProperty(obj, key, value) {
		key = _toPropertyKey(key);
		if (key in obj) Object.defineProperty(obj, key, {
			value,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else obj[key] = value;
		return obj;
	}
	function _toPropertyKey(arg) {
		var key = _toPrimitive(arg, "string");
		return _typeof(key) === "symbol" ? key : String(key);
	}
	function _toPrimitive(input, hint) {
		if (_typeof(input) !== "object" || input === null) return input;
		var prim = input[Symbol.toPrimitive];
		if (prim !== void 0) {
			var res = prim.call(input, hint || "default");
			if (_typeof(res) !== "object") return res;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return (hint === "string" ? String : Number)(input);
	}
	var parseDurationOfSingleTransition = function parseDurationOfSingleTransition() {
		var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		var steps = options.steps, duration = options.duration;
		if (steps && steps.length) return steps.reduce(function(result, entry) {
			return result + (Number.isFinite(entry.duration) && entry.duration > 0 ? entry.duration : 0);
		}, 0);
		if (Number.isFinite(duration)) return duration;
		return 0;
	};
	var AnimateGroupChild = /*#__PURE__*/ function(_Component) {
		_inherits(AnimateGroupChild, _Component);
		var _super = _createSuper(AnimateGroupChild);
		function AnimateGroupChild() {
			var _this;
			_classCallCheck(this, AnimateGroupChild);
			_this = _super.call(this);
			_defineProperty(_assertThisInitialized(_this), "handleEnter", function(node, isAppearing) {
				var _this$props = _this.props, appearOptions = _this$props.appearOptions, enterOptions = _this$props.enterOptions;
				_this.handleStyleActive(isAppearing ? appearOptions : enterOptions);
			});
			_defineProperty(_assertThisInitialized(_this), "handleExit", function() {
				var leaveOptions = _this.props.leaveOptions;
				_this.handleStyleActive(leaveOptions);
			});
			_this.state = { isActive: false };
			return _this;
		}
		_createClass(AnimateGroupChild, [
			{
				key: "handleStyleActive",
				value: function handleStyleActive(style) {
					if (style) {
						var onAnimationEnd = style.onAnimationEnd ? function() {
							style.onAnimationEnd();
						} : null;
						this.setState(_objectSpread(_objectSpread({}, style), {}, {
							onAnimationEnd,
							isActive: true
						}));
					}
				}
			},
			{
				key: "parseTimeout",
				value: function parseTimeout() {
					var _this$props2 = this.props, appearOptions = _this$props2.appearOptions, enterOptions = _this$props2.enterOptions, leaveOptions = _this$props2.leaveOptions;
					return parseDurationOfSingleTransition(appearOptions) + parseDurationOfSingleTransition(enterOptions) + parseDurationOfSingleTransition(leaveOptions);
				}
			},
			{
				key: "render",
				value: function render() {
					var _this2 = this, _this$props3 = this.props, children = _this$props3.children;
					_this$props3.appearOptions;
					_this$props3.enterOptions;
					_this$props3.leaveOptions;
					var props = _objectWithoutProperties(_this$props3, _excluded);
					return /*#__PURE__*/ _react.default.createElement(_reactTransitionGroup.Transition, _extends({}, props, {
						onEnter: this.handleEnter,
						onExit: this.handleExit,
						timeout: this.parseTimeout()
					}), function() {
						return /*#__PURE__*/ _react.default.createElement(_Animate.default, _this2.state, _react.Children.only(children));
					});
				}
			}
		]);
		return AnimateGroupChild;
	}(_react.Component);
	AnimateGroupChild.propTypes = {
		appearOptions: _propTypes.default.object,
		enterOptions: _propTypes.default.object,
		leaveOptions: _propTypes.default.object,
		children: _propTypes.default.element
	};
	exports.default = AnimateGroupChild;
}));
//#endregion
//#region node_modules/react-smooth/lib/AnimateGroup.js
var require_AnimateGroup = /* @__PURE__ */ __commonJSMin(((exports) => {
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _react = _interopRequireWildcard(require_react());
	var _reactTransitionGroup = require_cjs();
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _AnimateGroupChild = _interopRequireDefault(require_AnimateGroupChild());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _getRequireWildcardCache(e) {
		if ("function" != typeof WeakMap) return null;
		var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
		return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {
			return e ? t : r;
		})(e);
	}
	function _interopRequireWildcard(e, r) {
		if (!r && e && e.__esModule) return e;
		if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e };
		var t = _getRequireWildcardCache(r);
		if (t && t.has(e)) return t.get(e);
		var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
		for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) {
			var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
			i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
		}
		return n.default = e, t && t.set(e, n), n;
	}
	function AnimateGroup(props) {
		var component = props.component, children = props.children, appear = props.appear, enter = props.enter, leave = props.leave;
		return /*#__PURE__*/ _react.default.createElement(_reactTransitionGroup.TransitionGroup, { component }, _react.Children.map(children, function(child, index) {
			return /*#__PURE__*/ _react.default.createElement(_AnimateGroupChild.default, {
				appearOptions: appear,
				enterOptions: enter,
				leaveOptions: leave,
				key: "child-".concat(index)
			}, child);
		}));
	}
	AnimateGroup.propTypes = {
		appear: _propTypes.default.object,
		enter: _propTypes.default.object,
		leave: _propTypes.default.object,
		children: _propTypes.default.oneOfType([_propTypes.default.array, _propTypes.default.element]),
		component: _propTypes.default.any
	};
	AnimateGroup.defaultProps = { component: "span" };
	exports.default = AnimateGroup;
}));
//#endregion
//#region node_modules/react-smooth/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	Object.defineProperty(exports, "AnimateGroup", {
		enumerable: true,
		get: function get() {
			return _AnimateGroup.default;
		}
	});
	Object.defineProperty(exports, "configBezier", {
		enumerable: true,
		get: function get() {
			return _easing.configBezier;
		}
	});
	Object.defineProperty(exports, "configSpring", {
		enumerable: true,
		get: function get() {
			return _easing.configSpring;
		}
	});
	exports.default = void 0;
	var _Animate = _interopRequireDefault(require_Animate());
	var _easing = require_easing();
	var _AnimateGroup = _interopRequireDefault(require_AnimateGroup());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	exports.default = _Animate.default;
}));
//#endregion
export { require_lib as t };
