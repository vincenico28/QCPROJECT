import { a as __require, s as __toESM, t as __commonJSMin } from "../../_runtime.mjs";
import { l as require_react_dom, u as require_react } from "../@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime, t as createContextScope } from "../radix-ui__react-context+react.mjs";
import { t as composeEventHandlers } from "../radix-ui__primitive.mjs";
import { n as useComposedRefs } from "../radix-ui__react-compose-refs.mjs";
//#region node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var useLayoutEffect2 = globalThis?.document ? import_react.useLayoutEffect : () => {};
//#endregion
//#region node_modules/@radix-ui/react-id/dist/index.mjs
var __defProp$11 = Object.defineProperty;
var __name$11 = (target, value) => __defProp$11(target, "name", {
	value,
	configurable: true
});
var useReactId = import_react[" useId ".trim().toString()] || (() => void 0);
var count$1 = 0;
function useId(deterministicId) {
	const [id, setId] = import_react.useState(useReactId());
	useLayoutEffect2(() => {
		if (!deterministicId) setId((reactId) => reactId ?? String(count$1++));
	}, [deterministicId]);
	return deterministicId || (id ? `radix-${id}` : "");
}
__name$11(useId, "useId");
//#endregion
//#region node_modules/@radix-ui/react-use-effect-event/dist/index.mjs
var __defProp$10 = Object.defineProperty;
var __name$10 = (target, value) => __defProp$10(target, "name", {
	value,
	configurable: true
});
var useReactEffectEvent = import_react[" useEffectEvent ".trim().toString()];
var useReactInsertionEffect = import_react[" useInsertionEffect ".trim().toString()];
function useEffectEvent(callback) {
	if (typeof useReactEffectEvent === "function") return useReactEffectEvent(callback);
	const ref = import_react.useRef(() => {
		throw new Error("Cannot call an event handler while rendering.");
	});
	if (typeof useReactInsertionEffect === "function") useReactInsertionEffect(() => {
		ref.current = callback;
	});
	else useLayoutEffect2(() => {
		ref.current = callback;
	});
	return import_react.useMemo(() => ((...args) => ref.current?.(...args)), []);
}
__name$10(useEffectEvent, "useEffectEvent");
//#endregion
//#region node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var __defProp$9 = Object.defineProperty;
var __name$9 = (target, value) => __defProp$9(target, "name", {
	value,
	configurable: true
});
var useInsertionEffect = import_react[" useInsertionEffect ".trim().toString()] || useLayoutEffect2;
function useControllableState({ prop, defaultProp, onChange = /* @__PURE__ */ __name$9(() => {}, "onChange"), caller }) {
	const [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState({
		defaultProp,
		onChange
	});
	const isControlled = prop !== void 0;
	return [isControlled ? prop : uncontrolledProp, import_react.useCallback((nextValue) => {
		if (isControlled) {
			const value2 = isFunction(nextValue) ? nextValue(prop) : nextValue;
			if (value2 !== prop) onChangeRef.current?.(value2);
		} else setUncontrolledProp(nextValue);
	}, [
		isControlled,
		prop,
		setUncontrolledProp,
		onChangeRef
	])];
}
__name$9(useControllableState, "useControllableState");
function useUncontrolledState({ defaultProp, onChange }) {
	const [value, setValue] = import_react.useState(defaultProp);
	const prevValueRef = import_react.useRef(value);
	const onChangeRef = import_react.useRef(onChange);
	useInsertionEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);
	import_react.useEffect(() => {
		if (prevValueRef.current !== value) {
			onChangeRef.current?.(value);
			prevValueRef.current = value;
		}
	}, [value, prevValueRef]);
	return [
		value,
		setValue,
		onChangeRef
	];
}
__name$9(useUncontrolledState, "useUncontrolledState");
function isFunction(value) {
	return typeof value === "function";
}
__name$9(isFunction, "isFunction");
var SYNC_STATE = Symbol("RADIX:SYNC_STATE");
function useControllableStateReducer(reducer, userArgs, initialArg, init) {
	const { prop: controlledState, defaultProp, onChange: onChangeProp, caller } = userArgs;
	const isControlled = controlledState !== void 0;
	const onChange = useEffectEvent(onChangeProp);
	const args = [{
		...initialArg,
		state: defaultProp
	}];
	if (init) args.push(init);
	const [internalState, dispatch] = import_react.useReducer((state2, action) => {
		if (action.type === SYNC_STATE) return {
			...state2,
			state: action.state
		};
		const next = reducer(state2, action);
		if (isControlled && !Object.is(next.state, state2.state)) onChange(next.state);
		return next;
	}, ...args);
	const uncontrolledState = internalState.state;
	const prevValueRef = import_react.useRef(uncontrolledState);
	import_react.useEffect(() => {
		if (prevValueRef.current !== uncontrolledState) {
			prevValueRef.current = uncontrolledState;
			if (!isControlled) onChange(uncontrolledState);
		}
	}, [
		uncontrolledState,
		prevValueRef,
		isControlled
	]);
	const state = import_react.useMemo(() => {
		if (controlledState !== void 0) return {
			...internalState,
			state: controlledState
		};
		return internalState;
	}, [internalState, controlledState]);
	import_react.useEffect(() => {
		if (isControlled && !Object.is(controlledState, internalState.state)) dispatch({
			type: SYNC_STATE,
			state: controlledState
		});
	}, [
		controlledState,
		internalState.state,
		isControlled
	]);
	return [state, dispatch];
}
__name$9(useControllableStateReducer, "useControllableStateReducer");
//#endregion
//#region node_modules/@radix-ui/react-slot/dist/index.mjs
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var __defProp$8 = Object.defineProperty;
var __name$8 = (target, value) => __defProp$8(target, "name", {
	value,
	configurable: true
});
// @__NO_SIDE_EFFECTS__
function createSlot(ownerName) {
	const Slot2 = import_react.forwardRef((props, forwardedRef) => {
		let { children, ...slotProps } = props;
		let slottableElement = null;
		let hasSlottable = false;
		const newChildren = [];
		if (isLazyComponent(children) && typeof use === "function") children = use(children._payload);
		import_react.Children.forEach(children, (maybeSlottable) => {
			if (isSlottable(maybeSlottable)) {
				hasSlottable = true;
				const slottable = maybeSlottable;
				let child = "child" in slottable.props ? slottable.props.child : slottable.props.children;
				if (isLazyComponent(child) && typeof use === "function") child = use(child._payload);
				slottableElement = getSlottableElementFromSlottable(slottable, child);
				newChildren.push(slottableElement?.props?.children);
			} else newChildren.push(maybeSlottable);
		});
		if (slottableElement) slottableElement = import_react.cloneElement(slottableElement, void 0, newChildren);
		else if (!hasSlottable && import_react.Children.count(children) === 1 && import_react.isValidElement(children)) slottableElement = children;
		const slottableElementRef = slottableElement ? getElementRef$1(slottableElement) : void 0;
		const composedRef = useComposedRefs(forwardedRef, slottableElementRef);
		if (!slottableElement) {
			if (children || children === 0) throw new Error(hasSlottable ? createSlottableError(ownerName) : createSlotError(ownerName));
			return children;
		}
		const mergedProps = mergeProps(slotProps, slottableElement.props ?? {});
		if (slottableElement.type !== import_react.Fragment) mergedProps.ref = forwardedRef ? composedRef : slottableElementRef;
		return import_react.cloneElement(slottableElement, mergedProps);
	});
	Slot2.displayName = `${ownerName}.Slot`;
	return Slot2;
}
__name$8(createSlot, "createSlot");
var SLOTTABLE_IDENTIFIER = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function createSlottable(ownerName) {
	const Slottable2 = /* @__PURE__ */ __name$8((props) => "child" in props ? props.children(props.child) : props.children, "Slottable");
	Slottable2.displayName = `${ownerName}.Slottable`;
	Slottable2.__radixId = SLOTTABLE_IDENTIFIER;
	return Slottable2;
}
__name$8(createSlottable, "createSlottable");
var getSlottableElementFromSlottable = /* @__PURE__ */ __name$8((slottable, child) => {
	if ("child" in slottable.props) {
		const child2 = slottable.props.child;
		if (!import_react.isValidElement(child2)) return null;
		return import_react.cloneElement(child2, void 0, slottable.props.children(child2.props.children));
	}
	return import_react.isValidElement(child) ? child : null;
}, "getSlottableElementFromSlottable");
function mergeProps(slotProps, childProps) {
	const overrideProps = { ...childProps };
	for (const propName in childProps) {
		const slotPropValue = slotProps[propName];
		const childPropValue = childProps[propName];
		if (/^on[A-Z]/.test(propName)) {
			if (slotPropValue && childPropValue) overrideProps[propName] = (...args) => {
				const result = childPropValue(...args);
				slotPropValue(...args);
				return result;
			};
			else if (slotPropValue) overrideProps[propName] = slotPropValue;
		} else if (propName === "style") overrideProps[propName] = {
			...slotPropValue,
			...childPropValue
		};
		else if (propName === "className") overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
	}
	return {
		...slotProps,
		...overrideProps
	};
}
__name$8(mergeProps, "mergeProps");
function getElementRef$1(element) {
	let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
	let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
	if (mayWarn) return element.ref;
	getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
	mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
	if (mayWarn) return element.props.ref;
	return element.props.ref || element.ref;
}
__name$8(getElementRef$1, "getElementRef");
function isSlottable(child) {
	return import_react.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
__name$8(isSlottable, "isSlottable");
var REACT_LAZY_TYPE = Symbol.for("react.lazy");
function isLazyComponent(element) {
	return element != null && typeof element === "object" && "$$typeof" in element && element.$$typeof === REACT_LAZY_TYPE && "_payload" in element && isPromiseLike(element._payload);
}
__name$8(isLazyComponent, "isLazyComponent");
function isPromiseLike(value) {
	return typeof value === "object" && value !== null && "then" in value;
}
__name$8(isPromiseLike, "isPromiseLike");
var createSlotError = /* @__PURE__ */ __name$8((ownerName) => {
	return `${ownerName} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`;
}, "createSlotError");
var createSlottableError = /* @__PURE__ */ __name$8((ownerName) => {
	return `${ownerName} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`;
}, "createSlottableError");
var use = import_react[" use ".trim().toString()];
//#endregion
//#region node_modules/@radix-ui/react-primitive/dist/index.mjs
var import_jsx_runtime = require_jsx_runtime();
var __defProp$7 = Object.defineProperty;
var __name$7 = (target, value) => __defProp$7(target, "name", {
	value,
	configurable: true
});
var Primitive = [
	"a",
	"button",
	"div",
	"form",
	"h2",
	"h3",
	"img",
	"input",
	"label",
	"li",
	"nav",
	"ol",
	"p",
	"select",
	"span",
	"svg",
	"ul"
].reduce((primitive, node) => {
	const Slot = /* @__PURE__ */ createSlot(`Primitive.${node}`);
	const Node = import_react.forwardRef((props, forwardedRef) => {
		const { asChild, ...primitiveProps } = props;
		const Comp = asChild ? Slot : node;
		if (typeof window !== "undefined") window[Symbol.for("radix-ui")] = true;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, {
			...primitiveProps,
			ref: forwardedRef
		});
	});
	Node.displayName = `Primitive.${node}`;
	return {
		...primitive,
		[node]: Node
	};
}, {});
function dispatchDiscreteCustomEvent(target, event) {
	if (target) import_react_dom.flushSync(() => target.dispatchEvent(event));
}
__name$7(dispatchDiscreteCustomEvent, "dispatchDiscreteCustomEvent");
//#endregion
//#region node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var __defProp$6 = Object.defineProperty;
var __name$6 = (target, value) => __defProp$6(target, "name", {
	value,
	configurable: true
});
function useCallbackRef(callback) {
	const callbackRef = import_react.useRef(callback);
	import_react.useEffect(() => {
		callbackRef.current = callback;
	});
	return import_react.useMemo(() => ((...args) => callbackRef.current?.(...args)), []);
}
__name$6(useCallbackRef, "useCallbackRef");
//#endregion
//#region node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
var __defProp$5 = Object.defineProperty;
var __name$5 = (target, value) => __defProp$5(target, "name", {
	value,
	configurable: true
});
var CONTEXT_UPDATE = "dismissableLayer.update";
var POINTER_DOWN_OUTSIDE = "dismissableLayer.pointerDownOutside";
var FOCUS_OUTSIDE = "dismissableLayer.focusOutside";
var originalBodyPointerEvents;
var DismissableLayerContext = import_react.createContext({
	layers: /* @__PURE__ */ new Set(),
	layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
	branches: /* @__PURE__ */ new Set(),
	dismissableSurfaces: /* @__PURE__ */ new Set()
});
var DismissableLayer = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name$5(function DismissableLayer2(props, forwardedRef) {
	const { disableOutsidePointerEvents = false, deferPointerDownOutside = false, onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside, onDismiss, ...layerProps } = props;
	const context = import_react.useContext(DismissableLayerContext);
	const [node, setNode] = import_react.useState(null);
	const ownerDocument = node?.ownerDocument ?? globalThis?.document;
	const [, force] = import_react.useState({});
	const composedRefs = useComposedRefs(forwardedRef, setNode);
	const layers = Array.from(context.layers);
	const [highestLayerWithOutsidePointerEventsDisabled] = [...context.layersWithOutsidePointerEventsDisabled].slice(-1);
	const highestLayerWithOutsidePointerEventsDisabledIndex = highestLayerWithOutsidePointerEventsDisabled ? layers.indexOf(highestLayerWithOutsidePointerEventsDisabled) : -1;
	const index = node ? layers.indexOf(node) : -1;
	const isBodyPointerEventsDisabled = context.layersWithOutsidePointerEventsDisabled.size > 0;
	const isPointerEventsEnabled = index >= highestLayerWithOutsidePointerEventsDisabledIndex;
	const isDeferredPointerDownOutsideRef = import_react.useRef(false);
	const pointerDownOutside = usePointerDownOutside((event) => {
		onPointerDownOutside?.(event);
		onInteractOutside?.(event);
		if (!event.defaultPrevented) onDismiss?.();
	}, {
		ownerDocument,
		deferPointerDownOutside,
		isDeferredPointerDownOutsideRef,
		dismissableSurfaces: context.dismissableSurfaces,
		shouldHandlePointerDownOutside: import_react.useCallback((target) => {
			if (!(target instanceof Node)) return false;
			const isPointerDownOnBranch = [...context.branches].some((branch) => branch.contains(target));
			return isPointerEventsEnabled && !isPointerDownOnBranch;
		}, [context.branches, isPointerEventsEnabled])
	});
	const focusOutside = useFocusOutside((event) => {
		if (deferPointerDownOutside && isDeferredPointerDownOutsideRef.current) return;
		const target = event.target;
		if ([...context.branches].some((branch) => branch.contains(target))) return;
		onFocusOutside?.(event);
		onInteractOutside?.(event);
		if (!event.defaultPrevented) onDismiss?.();
	}, ownerDocument);
	const isHighestLayer = node ? index === layers.length - 1 : false;
	const handleKeyDown = useCallbackRef((event) => {
		if (event.key !== "Escape") return;
		onEscapeKeyDown?.(event);
		if (!event.defaultPrevented && onDismiss) {
			event.preventDefault();
			onDismiss();
		}
	});
	import_react.useEffect(() => {
		if (!isHighestLayer) return;
		ownerDocument.addEventListener("keydown", handleKeyDown, { capture: true });
		return () => ownerDocument.removeEventListener("keydown", handleKeyDown, { capture: true });
	}, [
		ownerDocument,
		isHighestLayer,
		handleKeyDown
	]);
	import_react.useEffect(() => {
		if (!node) return;
		if (disableOutsidePointerEvents) {
			if (context.layersWithOutsidePointerEventsDisabled.size === 0) {
				originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
				ownerDocument.body.style.pointerEvents = "none";
			}
			context.layersWithOutsidePointerEventsDisabled.add(node);
		}
		context.layers.add(node);
		dispatchUpdate();
		return () => {
			if (disableOutsidePointerEvents) {
				context.layersWithOutsidePointerEventsDisabled.delete(node);
				if (context.layersWithOutsidePointerEventsDisabled.size === 0) ownerDocument.body.style.pointerEvents = originalBodyPointerEvents;
			}
		};
	}, [
		node,
		ownerDocument,
		disableOutsidePointerEvents,
		context
	]);
	import_react.useEffect(() => {
		return () => {
			if (!node) return;
			context.layers.delete(node);
			context.layersWithOutsidePointerEventsDisabled.delete(node);
			dispatchUpdate();
		};
	}, [node, context]);
	import_react.useEffect(() => {
		const handleUpdate = /* @__PURE__ */ __name$5(() => force({}), "handleUpdate");
		document.addEventListener(CONTEXT_UPDATE, handleUpdate);
		return () => document.removeEventListener(CONTEXT_UPDATE, handleUpdate);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.div, {
		...layerProps,
		ref: composedRefs,
		style: {
			pointerEvents: isBodyPointerEventsDisabled ? isPointerEventsEnabled ? "auto" : "none" : void 0,
			...props.style
		},
		onFocusCapture: composeEventHandlers(props.onFocusCapture, focusOutside.onFocusCapture),
		onBlurCapture: composeEventHandlers(props.onBlurCapture, focusOutside.onBlurCapture),
		onPointerDownCapture: composeEventHandlers(props.onPointerDownCapture, pointerDownOutside.onPointerDownCapture)
	});
}, "DismissableLayer"));
function useDismissableLayerSurface() {
	const context = import_react.useContext(DismissableLayerContext);
	const [node, setNode] = import_react.useState(null);
	import_react.useEffect(() => {
		if (!node) return;
		context.dismissableSurfaces.add(node);
		return () => {
			context.dismissableSurfaces.delete(node);
		};
	}, [node, context.dismissableSurfaces]);
	return setNode;
}
__name$5(useDismissableLayerSurface, "useDismissableLayerSurface");
var IS_TRUE = /* @__PURE__ */ __name$5(() => true, "IS_TRUE");
function usePointerDownOutside(onPointerDownOutside, args) {
	const { ownerDocument = globalThis?.document, deferPointerDownOutside = false, isDeferredPointerDownOutsideRef, dismissableSurfaces, shouldHandlePointerDownOutside = IS_TRUE } = args;
	const handlePointerDownOutside = useCallbackRef(onPointerDownOutside);
	const isPointerInsideReactTreeRef = import_react.useRef(false);
	const isPointerDownOutsideRef = import_react.useRef(false);
	const interceptedOutsideInteractionEventsRef = import_react.useRef(/* @__PURE__ */ new Map());
	const handleClickRef = import_react.useRef(() => {});
	import_react.useEffect(() => {
		function resetOutsideInteraction() {
			isPointerDownOutsideRef.current = false;
			isDeferredPointerDownOutsideRef.current = false;
			interceptedOutsideInteractionEventsRef.current.clear();
		}
		__name$5(resetOutsideInteraction, "resetOutsideInteraction");
		function isOutsideInteractionIntercepted() {
			return Array.from(interceptedOutsideInteractionEventsRef.current.values()).some(Boolean);
		}
		__name$5(isOutsideInteractionIntercepted, "isOutsideInteractionIntercepted");
		function handleInteractionCapture(event) {
			if (!isPointerDownOutsideRef.current) return;
			const target = event.target;
			if (!(target instanceof Node && [...dismissableSurfaces].some((surface) => surface.contains(target)))) interceptedOutsideInteractionEventsRef.current.set(event.type, true);
			if (event.type === "click") window.setTimeout(() => {
				if (isPointerDownOutsideRef.current) handleClickRef.current();
			}, 0);
		}
		__name$5(handleInteractionCapture, "handleInteractionCapture");
		function handleInteractionBubble(event) {
			if (isPointerDownOutsideRef.current) interceptedOutsideInteractionEventsRef.current.set(event.type, false);
		}
		__name$5(handleInteractionBubble, "handleInteractionBubble");
		const handlePointerDown = /* @__PURE__ */ __name$5((event) => {
			if (event.target && !isPointerInsideReactTreeRef.current) {
				let handleAndDispatchPointerDownOutsideEvent2 = function() {
					ownerDocument.removeEventListener("click", handleClickRef.current);
					const wasOutsideInteractionIntercepted = isOutsideInteractionIntercepted();
					resetOutsideInteraction();
					if (!wasOutsideInteractionIntercepted) handleAndDispatchCustomEvent(POINTER_DOWN_OUTSIDE, handlePointerDownOutside, eventDetail, { discrete: true });
				};
				__name$5(handleAndDispatchPointerDownOutsideEvent2, "handleAndDispatchPointerDownOutsideEvent");
				if (!shouldHandlePointerDownOutside(event.target)) {
					ownerDocument.removeEventListener("click", handleClickRef.current);
					resetOutsideInteraction();
					isPointerInsideReactTreeRef.current = false;
					return;
				}
				const eventDetail = { originalEvent: event };
				isPointerDownOutsideRef.current = true;
				isDeferredPointerDownOutsideRef.current = deferPointerDownOutside && event.button === 0;
				interceptedOutsideInteractionEventsRef.current.clear();
				if (!deferPointerDownOutside || event.button !== 0) handleAndDispatchPointerDownOutsideEvent2();
				else {
					ownerDocument.removeEventListener("click", handleClickRef.current);
					handleClickRef.current = handleAndDispatchPointerDownOutsideEvent2;
					ownerDocument.addEventListener("click", handleClickRef.current, { once: true });
				}
			} else {
				ownerDocument.removeEventListener("click", handleClickRef.current);
				resetOutsideInteraction();
			}
			isPointerInsideReactTreeRef.current = false;
		}, "handlePointerDown");
		const outsideInteractionEvents = [
			"pointerup",
			"mousedown",
			"mouseup",
			"touchstart",
			"touchend",
			"click"
		];
		for (const eventName of outsideInteractionEvents) {
			ownerDocument.addEventListener(eventName, handleInteractionCapture, true);
			ownerDocument.addEventListener(eventName, handleInteractionBubble);
		}
		const timerId = window.setTimeout(() => {
			ownerDocument.addEventListener("pointerdown", handlePointerDown);
		}, 0);
		return () => {
			window.clearTimeout(timerId);
			ownerDocument.removeEventListener("pointerdown", handlePointerDown);
			ownerDocument.removeEventListener("click", handleClickRef.current);
			for (const eventName of outsideInteractionEvents) {
				ownerDocument.removeEventListener(eventName, handleInteractionCapture, true);
				ownerDocument.removeEventListener(eventName, handleInteractionBubble);
			}
		};
	}, [
		ownerDocument,
		handlePointerDownOutside,
		deferPointerDownOutside,
		isDeferredPointerDownOutsideRef,
		dismissableSurfaces,
		shouldHandlePointerDownOutside
	]);
	return { onPointerDownCapture: /* @__PURE__ */ __name$5(() => isPointerInsideReactTreeRef.current = true, "onPointerDownCapture") };
}
__name$5(usePointerDownOutside, "usePointerDownOutside");
function useFocusOutside(onFocusOutside, ownerDocument = globalThis?.document) {
	const handleFocusOutside = useCallbackRef(onFocusOutside);
	const isFocusInsideReactTreeRef = import_react.useRef(false);
	import_react.useEffect(() => {
		const handleFocus = /* @__PURE__ */ __name$5((event) => {
			if (event.target && !isFocusInsideReactTreeRef.current) handleAndDispatchCustomEvent(FOCUS_OUTSIDE, handleFocusOutside, { originalEvent: event }, { discrete: false });
		}, "handleFocus");
		ownerDocument.addEventListener("focusin", handleFocus);
		return () => ownerDocument.removeEventListener("focusin", handleFocus);
	}, [ownerDocument, handleFocusOutside]);
	return {
		onFocusCapture: /* @__PURE__ */ __name$5(() => isFocusInsideReactTreeRef.current = true, "onFocusCapture"),
		onBlurCapture: /* @__PURE__ */ __name$5(() => isFocusInsideReactTreeRef.current = false, "onBlurCapture")
	};
}
__name$5(useFocusOutside, "useFocusOutside");
function dispatchUpdate() {
	const event = new CustomEvent(CONTEXT_UPDATE);
	document.dispatchEvent(event);
}
__name$5(dispatchUpdate, "dispatchUpdate");
function handleAndDispatchCustomEvent(name, handler, detail, { discrete }) {
	const target = detail.originalEvent.target;
	const event = new CustomEvent(name, {
		bubbles: false,
		cancelable: true,
		detail
	});
	if (handler) target.addEventListener(name, handler, { once: true });
	if (discrete) dispatchDiscreteCustomEvent(target, event);
	else target.dispatchEvent(event);
}
__name$5(handleAndDispatchCustomEvent, "handleAndDispatchCustomEvent");
//#endregion
//#region node_modules/@radix-ui/react-focus-scope/dist/index.mjs
var __defProp$4 = Object.defineProperty;
var __name$4 = (target, value) => __defProp$4(target, "name", {
	value,
	configurable: true
});
var AUTOFOCUS_ON_MOUNT = "focusScope.autoFocusOnMount";
var AUTOFOCUS_ON_UNMOUNT = "focusScope.autoFocusOnUnmount";
var EVENT_OPTIONS = {
	bubbles: false,
	cancelable: true
};
var FocusScope = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name$4(function FocusScope2(props, forwardedRef) {
	const { loop = false, trapped = false, onMountAutoFocus: onMountAutoFocusProp, onUnmountAutoFocus: onUnmountAutoFocusProp, ...scopeProps } = props;
	const [container, setContainer] = import_react.useState(null);
	const onMountAutoFocus = useCallbackRef(onMountAutoFocusProp);
	const onUnmountAutoFocus = useCallbackRef(onUnmountAutoFocusProp);
	const lastFocusedElementRef = import_react.useRef(null);
	const composedRefs = useComposedRefs(forwardedRef, setContainer);
	const focusScope = import_react.useRef({
		paused: false,
		pause() {
			this.paused = true;
		},
		resume() {
			this.paused = false;
		}
	}).current;
	import_react.useEffect(() => {
		if (trapped) {
			let handleFocusIn2 = function(event) {
				if (focusScope.paused || !container) return;
				const target = event.target;
				if (container.contains(target)) lastFocusedElementRef.current = target;
				else focus(lastFocusedElementRef.current, { select: true });
			}, handleFocusOut2 = function(event) {
				if (focusScope.paused || !container) return;
				const relatedTarget = event.relatedTarget;
				if (relatedTarget === null) return;
				if (!container.contains(relatedTarget)) focus(lastFocusedElementRef.current, { select: true });
			}, handleMutations2 = function(mutations) {
				if (document.activeElement !== document.body) return;
				for (const mutation of mutations) if (mutation.removedNodes.length > 0) focus(container);
			};
			__name$4(handleFocusIn2, "handleFocusIn");
			__name$4(handleFocusOut2, "handleFocusOut");
			__name$4(handleMutations2, "handleMutations");
			document.addEventListener("focusin", handleFocusIn2);
			document.addEventListener("focusout", handleFocusOut2);
			const mutationObserver = new MutationObserver(handleMutations2);
			if (container) mutationObserver.observe(container, {
				childList: true,
				subtree: true
			});
			return () => {
				document.removeEventListener("focusin", handleFocusIn2);
				document.removeEventListener("focusout", handleFocusOut2);
				mutationObserver.disconnect();
			};
		}
	}, [
		trapped,
		container,
		focusScope.paused
	]);
	import_react.useEffect(() => {
		if (container) {
			focusScopesStack.add(focusScope);
			const previouslyFocusedElement = document.activeElement;
			if (!container.contains(previouslyFocusedElement)) {
				const mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT, EVENT_OPTIONS);
				container.addEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
				container.dispatchEvent(mountEvent);
				if (!mountEvent.defaultPrevented) {
					focusFirst(removeLinks(getTabbableCandidates(container)), { select: true });
					if (document.activeElement === previouslyFocusedElement) focus(container);
				}
			}
			return () => {
				container.removeEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
				setTimeout(() => {
					const unmountEvent = new CustomEvent(AUTOFOCUS_ON_UNMOUNT, EVENT_OPTIONS);
					container.addEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
					container.dispatchEvent(unmountEvent);
					if (!unmountEvent.defaultPrevented) focus(previouslyFocusedElement ?? document.body, { select: true });
					container.removeEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
					focusScopesStack.remove(focusScope);
				}, 0);
			};
		}
	}, [
		container,
		onMountAutoFocus,
		onUnmountAutoFocus,
		focusScope
	]);
	const handleKeyDown = import_react.useCallback((event) => {
		if (!loop && !trapped) return;
		if (focusScope.paused) return;
		const isTabKey = event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey;
		const focusedElement = document.activeElement;
		if (isTabKey && focusedElement) {
			const container2 = event.currentTarget;
			const [first, last] = getTabbableEdges(container2);
			if (!(first && last)) {
				if (focusedElement === container2) event.preventDefault();
			} else if (!event.shiftKey && focusedElement === last) {
				event.preventDefault();
				if (loop) focus(first, { select: true });
			} else if (event.shiftKey && focusedElement === first) {
				event.preventDefault();
				if (loop) focus(last, { select: true });
			}
		}
	}, [
		loop,
		trapped,
		focusScope.paused
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.div, {
		tabIndex: -1,
		...scopeProps,
		ref: composedRefs,
		onKeyDown: handleKeyDown
	});
}, "FocusScope"));
function focusFirst(candidates, { select = false } = {}) {
	const previouslyFocusedElement = document.activeElement;
	for (const candidate of candidates) {
		focus(candidate, { select });
		if (document.activeElement !== previouslyFocusedElement) return;
	}
}
__name$4(focusFirst, "focusFirst");
function getTabbableEdges(container) {
	const candidates = getTabbableCandidates(container);
	return [findVisible(candidates, container), findVisible(candidates.reverse(), container)];
}
__name$4(getTabbableEdges, "getTabbableEdges");
function getTabbableCandidates(container) {
	const nodes = [];
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, { acceptNode: /* @__PURE__ */ __name$4((node) => {
		const isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
		if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
		return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
	}, "acceptNode") });
	while (walker.nextNode()) nodes.push(walker.currentNode);
	return nodes;
}
__name$4(getTabbableCandidates, "getTabbableCandidates");
function findVisible(elements, container) {
	const canUseCheckVisibility = typeof container.checkVisibility === "function" && container.checkVisibility({ checkVisibilityCSS: true });
	for (const element of elements) if (!(canUseCheckVisibility ? !element.checkVisibility({ checkVisibilityCSS: true }) : isHidden(element, { upTo: container }))) return element;
}
__name$4(findVisible, "findVisible");
function isHidden(node, { upTo }) {
	if (getComputedStyle(node).visibility === "hidden") return true;
	while (node) {
		if (upTo !== void 0 && node === upTo) return false;
		if (getComputedStyle(node).display === "none") return true;
		node = node.parentElement;
	}
	return false;
}
__name$4(isHidden, "isHidden");
function isSelectableInput(element) {
	return element instanceof HTMLInputElement && "select" in element;
}
__name$4(isSelectableInput, "isSelectableInput");
function focus(element, { select = false } = {}) {
	if (element && element.focus) {
		const previouslyFocusedElement = document.activeElement;
		element.focus({ preventScroll: true });
		if (element !== previouslyFocusedElement && isSelectableInput(element) && select) element.select();
	}
}
__name$4(focus, "focus");
var focusScopesStack = createFocusScopesStack();
function createFocusScopesStack() {
	let stack = [];
	return {
		add(focusScope) {
			const activeFocusScope = stack[0];
			if (focusScope !== activeFocusScope) activeFocusScope?.pause();
			stack = arrayRemove(stack, focusScope);
			stack.unshift(focusScope);
		},
		remove(focusScope) {
			stack = arrayRemove(stack, focusScope);
			stack[0]?.resume();
		}
	};
}
__name$4(createFocusScopesStack, "createFocusScopesStack");
function arrayRemove(array, item) {
	const updatedArray = [...array];
	const index = updatedArray.indexOf(item);
	if (index !== -1) updatedArray.splice(index, 1);
	return updatedArray;
}
__name$4(arrayRemove, "arrayRemove");
function removeLinks(items) {
	return items.filter((item) => item.tagName !== "A");
}
__name$4(removeLinks, "removeLinks");
//#endregion
//#region node_modules/@radix-ui/react-portal/dist/index.mjs
var __defProp$3 = Object.defineProperty;
var __name$3 = (target, value) => __defProp$3(target, "name", {
	value,
	configurable: true
});
var Portal = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name$3(function Portal2(props, forwardedRef) {
	const { container: containerProp, ...portalProps } = props;
	const [mounted, setMounted] = import_react.useState(false);
	useLayoutEffect2(() => setMounted(true), []);
	const container = containerProp || mounted && globalThis?.document?.body;
	return container ? import_react_dom.createPortal(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.div, {
		...portalProps,
		ref: forwardedRef
	}), container) : null;
}, "Portal"));
//#endregion
//#region node_modules/@radix-ui/react-presence/dist/index.mjs
var __defProp$2 = Object.defineProperty;
var __name$2 = (target, value) => __defProp$2(target, "name", {
	value,
	configurable: true
});
function useStateMachine(initialState, machine) {
	return import_react.useReducer((state, event) => {
		return machine[state][event] ?? state;
	}, initialState);
}
__name$2(useStateMachine, "useStateMachine");
var Presence = /* @__PURE__ */ __name$2((props) => {
	const { present, children } = props;
	const presence = usePresence(present);
	const child = typeof children === "function" ? children({ present: presence.isPresent }) : import_react.Children.only(children);
	const ref = useStableComposedRefs(presence.ref, getElementRef(child));
	return typeof children === "function" || presence.isPresent ? import_react.cloneElement(child, { ref }) : null;
}, "Presence");
function usePresence(present) {
	const [node, setNode] = import_react.useState();
	const stylesRef = import_react.useRef(null);
	const prevPresentRef = import_react.useRef(present);
	const prevAnimationNameRef = import_react.useRef("none");
	const mountAnimationNameRef = import_react.useRef(void 0);
	const [state, send] = useStateMachine(present ? "mounted" : "unmounted", {
		mounted: {
			UNMOUNT: "unmounted",
			ANIMATION_OUT: "unmountSuspended"
		},
		unmountSuspended: {
			MOUNT: "mounted",
			ANIMATION_END: "unmounted"
		},
		unmounted: { MOUNT: "mounted" }
	});
	import_react.useEffect(() => {
		if (state === "mounted") {
			prevAnimationNameRef.current = mountAnimationNameRef.current ?? getAnimationName(stylesRef.current);
			mountAnimationNameRef.current = void 0;
		} else prevAnimationNameRef.current = "none";
	}, [state]);
	useLayoutEffect2(() => {
		const styles = stylesRef.current;
		const wasPresent = prevPresentRef.current;
		if (wasPresent !== present) {
			const prevAnimationName = prevAnimationNameRef.current;
			const currentAnimationName = getAnimationName(styles);
			if (present) {
				mountAnimationNameRef.current = currentAnimationName;
				send("MOUNT");
			} else if (currentAnimationName === "none" || styles?.display === "none") send("UNMOUNT");
			else if (wasPresent && prevAnimationName !== currentAnimationName) send("ANIMATION_OUT");
			else send("UNMOUNT");
			prevPresentRef.current = present;
		}
	}, [present, send]);
	useLayoutEffect2(() => {
		if (node) {
			let timeoutId;
			const ownerWindow = node.ownerDocument.defaultView ?? window;
			const handleAnimationEnd = /* @__PURE__ */ __name$2((event) => {
				const isCurrentAnimation = getAnimationName(stylesRef.current).includes(CSS.escape(event.animationName));
				if (event.target === node && isCurrentAnimation) {
					send("ANIMATION_END");
					if (!prevPresentRef.current) {
						const currentFillMode = node.style.animationFillMode;
						node.style.animationFillMode = "forwards";
						timeoutId = ownerWindow.setTimeout(() => {
							if (node.style.animationFillMode === "forwards") node.style.animationFillMode = currentFillMode;
						});
					}
				}
			}, "handleAnimationEnd");
			const handleAnimationStart = /* @__PURE__ */ __name$2((event) => {
				if (event.target === node) prevAnimationNameRef.current = getAnimationName(stylesRef.current);
			}, "handleAnimationStart");
			node.addEventListener("animationstart", handleAnimationStart);
			node.addEventListener("animationcancel", handleAnimationEnd);
			node.addEventListener("animationend", handleAnimationEnd);
			return () => {
				ownerWindow.clearTimeout(timeoutId);
				node.removeEventListener("animationstart", handleAnimationStart);
				node.removeEventListener("animationcancel", handleAnimationEnd);
				node.removeEventListener("animationend", handleAnimationEnd);
			};
		} else send("ANIMATION_END");
	}, [node, send]);
	return {
		isPresent: ["mounted", "unmountSuspended"].includes(state),
		ref: import_react.useCallback((node2) => {
			if (node2) {
				const styles = getComputedStyle(node2);
				stylesRef.current = styles;
				mountAnimationNameRef.current = getAnimationName(styles);
			} else stylesRef.current = null;
			setNode(node2);
		}, [])
	};
}
__name$2(usePresence, "usePresence");
function setRef(ref, value) {
	if (typeof ref === "function") return ref(value);
	else if (ref !== null && ref !== void 0) ref.current = value;
}
__name$2(setRef, "setRef");
function useStableComposedRefs(...refs) {
	const refsRef = import_react.useRef(refs);
	refsRef.current = refs;
	return import_react.useCallback((node) => {
		const currentRefs = refsRef.current;
		let hasCleanup = false;
		const cleanups = currentRefs.map((ref) => {
			const cleanup = setRef(ref, node);
			if (!hasCleanup && typeof cleanup === "function") hasCleanup = true;
			return cleanup;
		});
		if (hasCleanup) return () => {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				if (typeof cleanup === "function") cleanup();
				else setRef(currentRefs[i], null);
			}
		};
	}, []);
}
__name$2(useStableComposedRefs, "useStableComposedRefs");
function getAnimationName(styles) {
	return styles?.animationName || "none";
}
__name$2(getAnimationName, "getAnimationName");
function getElementRef(element) {
	let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
	let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
	if (mayWarn) return element.ref;
	getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
	mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
	if (mayWarn) return element.props.ref;
	return element.props.ref || element.ref;
}
__name$2(getElementRef, "getElementRef");
//#endregion
//#region node_modules/@radix-ui/react-focus-guards/dist/index.mjs
var __defProp$1 = Object.defineProperty;
var __name$1 = (target, value) => __defProp$1(target, "name", {
	value,
	configurable: true
});
var count = 0;
var guards = null;
function FocusGuards(props) {
	useFocusGuards();
	return props.children;
}
__name$1(FocusGuards, "FocusGuards");
function useFocusGuards() {
	import_react.useEffect(() => {
		if (!guards) guards = {
			start: createFocusGuard(),
			end: createFocusGuard()
		};
		const { start, end } = guards;
		if (document.body.firstElementChild !== start) document.body.insertAdjacentElement("afterbegin", start);
		if (document.body.lastElementChild !== end) document.body.insertAdjacentElement("beforeend", end);
		count++;
		return () => {
			if (count === 1) {
				guards?.start.remove();
				guards?.end.remove();
				guards = null;
			}
			count = Math.max(0, count - 1);
		};
	}, []);
}
__name$1(useFocusGuards, "useFocusGuards");
function createFocusGuard() {
	const element = document.createElement("span");
	element.setAttribute("data-radix-focus-guard", "");
	element.tabIndex = 0;
	element.style.outline = "none";
	element.style.opacity = "0";
	element.style.position = "fixed";
	element.style.pointerEvents = "none";
	return element;
}
__name$1(createFocusGuard, "createFocusGuard");
//#endregion
//#region node_modules/react-remove-scroll-bar/dist/es5/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.removedBarSizeVariable = exports.noScrollbarsClassName = exports.fullWidthClassName = exports.zeroRightClassName = void 0;
	exports.zeroRightClassName = "right-scroll-bar-position";
	exports.fullWidthClassName = "width-before-scroll-bar";
	exports.noScrollbarsClassName = "with-scroll-bars-hidden";
	/**
	* Name of a CSS variable containing the amount of "hidden" scrollbar
	* ! might be undefined ! use will fallback!
	*/
	exports.removedBarSizeVariable = "--removed-body-scroll-bar-size";
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/assignRef.js
var require_assignRef = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.assignRef = void 0;
	/**
	* Assigns a value for a given ref, no matter of the ref format
	* @param {RefObject} ref - a callback function or ref object
	* @param value - a new value
	*
	* @see https://github.com/theKashey/use-callback-ref#assignref
	* @example
	* const refObject = useRef();
	* const refFn = (ref) => {....}
	*
	* assignRef(refObject, "refValue");
	* assignRef(refFn, "refValue");
	*/
	function assignRef(ref, value) {
		if (typeof ref === "function") ref(value);
		else if (ref) ref.current = value;
		return ref;
	}
	exports.assignRef = assignRef;
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/useRef.js
var require_useRef = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.useCallbackRef = void 0;
	var react_1 = require_react();
	/**
	* creates a MutableRef with ref change callback
	* @param initialValue - initial ref value
	* @param {Function} callback - a callback to run when value changes
	*
	* @example
	* const ref = useCallbackRef(0, (newValue, oldValue) => console.log(oldValue, '->', newValue);
	* ref.current = 1;
	* // prints 0 -> 1
	*
	* @see https://reactjs.org/docs/hooks-reference.html#useref
	* @see https://github.com/theKashey/use-callback-ref#usecallbackref---to-replace-reactuseref
	* @returns {MutableRefObject}
	*/
	function useCallbackRef(initialValue, callback) {
		var ref = (0, react_1.useState)(function() {
			return {
				value: initialValue,
				callback,
				facade: {
					get current() {
						return ref.value;
					},
					set current(value) {
						var last = ref.value;
						if (last !== value) {
							ref.value = value;
							ref.callback(value, last);
						}
					}
				}
			};
		})[0];
		ref.callback = callback;
		return ref.facade;
	}
	exports.useCallbackRef = useCallbackRef;
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/createRef.js
var require_createRef = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createCallbackRef = void 0;
	/**
	* creates a Ref object with on change callback
	* @param callback
	* @returns {RefObject}
	*
	* @see {@link useCallbackRef}
	* @see https://reactjs.org/docs/refs-and-the-dom.html#creating-refs
	*/
	function createCallbackRef(callback) {
		var current = null;
		return {
			get current() {
				return current;
			},
			set current(value) {
				var last = current;
				if (last !== value) {
					current = value;
					callback(value, last);
				}
			}
		};
	}
	exports.createCallbackRef = createCallbackRef;
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/mergeRef.js
var require_mergeRef = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.mergeRefs = void 0;
	var assignRef_1 = require_assignRef();
	var createRef_1 = require_createRef();
	/**
	* Merges two or more refs together providing a single interface to set their value
	* @param {RefObject|Ref} refs
	* @returns {MutableRefObject} - a new ref, which translates all changes to {refs}
	*
	* @see {@link useMergeRefs} to be used in ReactComponents
	* @example
	* const Component = React.forwardRef((props, ref) => {
	*   const ownRef = useRef();
	*   const domRef = mergeRefs([ref, ownRef]); // 👈 merge together
	*   return <div ref={domRef}>...</div>
	* }
	*/
	function mergeRefs(refs) {
		return (0, createRef_1.createCallbackRef)(function(newValue) {
			return refs.forEach(function(ref) {
				return (0, assignRef_1.assignRef)(ref, newValue);
			});
		});
	}
	exports.mergeRefs = mergeRefs;
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/useMergeRef.js
var require_useMergeRef = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.useMergeRefs = void 0;
	var React$2 = __require("tslib").__importStar(require_react());
	var assignRef_1 = require_assignRef();
	var useRef_1 = require_useRef();
	var useIsomorphicLayoutEffect = typeof window !== "undefined" ? React$2.useLayoutEffect : React$2.useEffect;
	var currentValues = /* @__PURE__ */ new WeakMap();
	/**
	* Merges two or more refs together providing a single interface to set their value
	* @param {RefObject|Ref} refs
	* @returns {MutableRefObject} - a new ref, which translates all changes to {refs}
	*
	* @see {@link mergeRefs} a version without buit-in memoization
	* @see https://github.com/theKashey/use-callback-ref#usemergerefs
	* @example
	* const Component = React.forwardRef((props, ref) => {
	*   const ownRef = useRef();
	*   const domRef = useMergeRefs([ref, ownRef]); // 👈 merge together
	*   return <div ref={domRef}>...</div>
	* }
	*/
	function useMergeRefs(refs, defaultValue) {
		var callbackRef = (0, useRef_1.useCallbackRef)(defaultValue || null, function(newValue) {
			return refs.forEach(function(ref) {
				return (0, assignRef_1.assignRef)(ref, newValue);
			});
		});
		useIsomorphicLayoutEffect(function() {
			var oldValue = currentValues.get(callbackRef);
			if (oldValue) {
				var prevRefs_1 = new Set(oldValue);
				var nextRefs_1 = new Set(refs);
				var current_1 = callbackRef.current;
				prevRefs_1.forEach(function(ref) {
					if (!nextRefs_1.has(ref)) (0, assignRef_1.assignRef)(ref, null);
				});
				nextRefs_1.forEach(function(ref) {
					if (!prevRefs_1.has(ref)) (0, assignRef_1.assignRef)(ref, current_1);
				});
			}
			currentValues.set(callbackRef, refs);
		}, [refs]);
		return callbackRef;
	}
	exports.useMergeRefs = useMergeRefs;
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/useTransformRef.js
var require_useTransformRef = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.useTransformRef = void 0;
	var assignRef_1 = require_assignRef();
	var useRef_1 = require_useRef();
	/**
	* Create a _lense_ on Ref, making it possible to transform ref value
	* @param {ReactRef} ref
	* @param {Function} transformer. 👉 Ref would be __NOT updated__ on `transformer` update.
	* @returns {RefObject}
	*
	* @see https://github.com/theKashey/use-callback-ref#usetransformref-to-replace-reactuseimperativehandle
	* @example
	*
	* const ResizableWithRef = forwardRef((props, ref) =>
	*  <Resizable {...props} ref={useTransformRef(ref, i => i ? i.resizable : null)}/>
	* );
	*/
	function useTransformRef(ref, transformer) {
		return (0, useRef_1.useCallbackRef)(null, function(value) {
			return (0, assignRef_1.assignRef)(ref, transformer(value));
		});
	}
	exports.useTransformRef = useTransformRef;
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/transformRef.js
var require_transformRef = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.transformRef = void 0;
	var assignRef_1 = require_assignRef();
	var createRef_1 = require_createRef();
	/**
	* Transforms one ref to another
	* @example
	* ```tsx
	* const ResizableWithRef = forwardRef((props, ref) =>
	*   <Resizable {...props} ref={transformRef(ref, i => i ? i.resizable : null)}/>
	* );
	* ```
	*/
	function transformRef(ref, transformer) {
		return (0, createRef_1.createCallbackRef)(function(value) {
			return (0, assignRef_1.assignRef)(ref, transformer(value));
		});
	}
	exports.transformRef = transformRef;
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/refToCallback.js
var require_refToCallback = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.useRefToCallback = exports.refToCallback = void 0;
	/**
	* Unmemoized version of {@link useRefToCallback}
	* @see {@link useRefToCallback}
	* @param ref
	*/
	function refToCallback(ref) {
		return function(newValue) {
			if (typeof ref === "function") ref(newValue);
			else if (ref) ref.current = newValue;
		};
	}
	exports.refToCallback = refToCallback;
	var nullCallback = function() {
		return null;
	};
	var weakMem = /* @__PURE__ */ new WeakMap();
	var weakMemoize = function(ref) {
		var usedRef = ref || nullCallback;
		var storedRef = weakMem.get(usedRef);
		if (storedRef) return storedRef;
		var cb = refToCallback(usedRef);
		weakMem.set(usedRef, cb);
		return cb;
	};
	/**
	* Transforms a given `ref` into `callback`.
	*
	* To transform `callback` into ref use {@link useCallbackRef|useCallbackRef(undefined, callback)}
	*
	* @param {ReactRef} ref
	* @returns {Function}
	*
	* @see https://github.com/theKashey/use-callback-ref#reftocallback
	*
	* @example
	* const ref = useRef(0);
	* const setRef = useRefToCallback(ref);
	* 👉 setRef(10);
	* ✅ ref.current === 10
	*/
	function useRefToCallback(ref) {
		return weakMemoize(ref);
	}
	exports.useRefToCallback = useRefToCallback;
}));
//#endregion
//#region node_modules/use-callback-ref/dist/es5/index.js
var require_es5$6 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.useRefToCallback = exports.refToCallback = exports.transformRef = exports.useTransformRef = exports.useMergeRefs = exports.mergeRefs = exports.createCallbackRef = exports.useCallbackRef = exports.assignRef = void 0;
	var assignRef_1 = require_assignRef();
	Object.defineProperty(exports, "assignRef", {
		enumerable: true,
		get: function() {
			return assignRef_1.assignRef;
		}
	});
	var useRef_1 = require_useRef();
	Object.defineProperty(exports, "useCallbackRef", {
		enumerable: true,
		get: function() {
			return useRef_1.useCallbackRef;
		}
	});
	var createRef_1 = require_createRef();
	Object.defineProperty(exports, "createCallbackRef", {
		enumerable: true,
		get: function() {
			return createRef_1.createCallbackRef;
		}
	});
	var mergeRef_1 = require_mergeRef();
	Object.defineProperty(exports, "mergeRefs", {
		enumerable: true,
		get: function() {
			return mergeRef_1.mergeRefs;
		}
	});
	var useMergeRef_1 = require_useMergeRef();
	Object.defineProperty(exports, "useMergeRefs", {
		enumerable: true,
		get: function() {
			return useMergeRef_1.useMergeRefs;
		}
	});
	var useTransformRef_1 = require_useTransformRef();
	Object.defineProperty(exports, "useTransformRef", {
		enumerable: true,
		get: function() {
			return useTransformRef_1.useTransformRef;
		}
	});
	var transformRef_1 = require_transformRef();
	Object.defineProperty(exports, "transformRef", {
		enumerable: true,
		get: function() {
			return transformRef_1.transformRef;
		}
	});
	var refToCallback_1 = require_refToCallback();
	Object.defineProperty(exports, "refToCallback", {
		enumerable: true,
		get: function() {
			return refToCallback_1.refToCallback;
		}
	});
	Object.defineProperty(exports, "useRefToCallback", {
		enumerable: true,
		get: function() {
			return refToCallback_1.useRefToCallback;
		}
	});
}));
//#endregion
//#region node_modules/detect-node-es/es5/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports.isNode = Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
}));
//#endregion
//#region node_modules/use-sidecar/dist/es5/env.js
var require_env = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.env = void 0;
	exports.env = {
		isNode: require_node().isNode,
		forceCache: false
	};
}));
//#endregion
//#region node_modules/use-sidecar/dist/es5/hook.js
var require_hook$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.useSidecar = void 0;
	var react_1 = require_react();
	var env_1 = require_env();
	var cache = /* @__PURE__ */ new WeakMap();
	var NO_OPTIONS = {};
	function useSidecar(importer, effect) {
		var options = effect && effect.options || NO_OPTIONS;
		if (env_1.env.isNode && !options.ssr) return [null, null];
		return useRealSidecar(importer, effect);
	}
	exports.useSidecar = useSidecar;
	function useRealSidecar(importer, effect) {
		var options = effect && effect.options || NO_OPTIONS;
		var couldUseCache = env_1.env.forceCache || env_1.env.isNode && !!options.ssr || !options.async;
		var _a = (0, react_1.useState)(couldUseCache ? function() {
			return cache.get(importer);
		} : void 0), Car = _a[0], setCar = _a[1];
		var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
		(0, react_1.useEffect)(function() {
			if (!Car) importer().then(function(car) {
				var resolved = effect ? effect.read() : car.default || car;
				if (!resolved) {
					console.error("Sidecar error: with importer", importer);
					var error_1;
					if (effect) {
						console.error("Sidecar error: with medium", effect);
						error_1 = /* @__PURE__ */ new Error("Sidecar medium was not found");
					} else error_1 = /* @__PURE__ */ new Error("Sidecar was not found in exports");
					setError(function() {
						return error_1;
					});
					throw error_1;
				}
				cache.set(importer, resolved);
				setCar(function() {
					return resolved;
				});
			}, function(e) {
				return setError(function() {
					return e;
				});
			});
		}, []);
		return [Car, error];
	}
}));
//#endregion
//#region node_modules/use-sidecar/dist/es5/hoc.js
var require_hoc = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.sidecar = void 0;
	var tslib_1$6 = __require("tslib");
	var React = tslib_1$6.__importStar(require_react());
	var hook_1 = require_hook$1();
	function sidecar(importer, errorComponent) {
		var ErrorCase = function() {
			return errorComponent;
		};
		return function Sidecar(props) {
			var _a = (0, hook_1.useSidecar)(importer, props.sideCar), Car = _a[0];
			if (_a[1] && errorComponent) return ErrorCase;
			return Car ? React.createElement(Car, tslib_1$6.__assign({}, props)) : null;
		};
	}
	exports.sidecar = sidecar;
}));
//#endregion
//#region node_modules/use-sidecar/dist/es5/config.js
var require_config = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.setConfig = exports.config = void 0;
	exports.config = { onError: function(e) {
		return console.error(e);
	} };
	var setConfig = function(conf) {
		Object.assign(exports.config, conf);
	};
	exports.setConfig = setConfig;
}));
//#endregion
//#region node_modules/use-sidecar/dist/es5/medium.js
var require_medium$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createSidecarMedium = exports.createMedium = void 0;
	var tslib_1$5 = __require("tslib");
	function ItoI(a) {
		return a;
	}
	function innerCreateMedium(defaults, middleware) {
		if (middleware === void 0) middleware = ItoI;
		var buffer = [];
		var assigned = false;
		return {
			read: function() {
				if (assigned) throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
				if (buffer.length) return buffer[buffer.length - 1];
				return defaults;
			},
			useMedium: function(data) {
				var item = middleware(data, assigned);
				buffer.push(item);
				return function() {
					buffer = buffer.filter(function(x) {
						return x !== item;
					});
				};
			},
			assignSyncMedium: function(cb) {
				assigned = true;
				while (buffer.length) {
					var cbs = buffer;
					buffer = [];
					cbs.forEach(cb);
				}
				buffer = {
					push: function(x) {
						return cb(x);
					},
					filter: function() {
						return buffer;
					}
				};
			},
			assignMedium: function(cb) {
				assigned = true;
				var pendingQueue = [];
				if (buffer.length) {
					var cbs = buffer;
					buffer = [];
					cbs.forEach(cb);
					pendingQueue = buffer;
				}
				var executeQueue = function() {
					var cbs = pendingQueue;
					pendingQueue = [];
					cbs.forEach(cb);
				};
				var cycle = function() {
					return Promise.resolve().then(executeQueue);
				};
				cycle();
				buffer = {
					push: function(x) {
						pendingQueue.push(x);
						cycle();
					},
					filter: function(filter) {
						pendingQueue = pendingQueue.filter(filter);
						return buffer;
					}
				};
			}
		};
	}
	function createMedium(defaults, middleware) {
		if (middleware === void 0) middleware = ItoI;
		return innerCreateMedium(defaults, middleware);
	}
	exports.createMedium = createMedium;
	function createSidecarMedium(options) {
		if (options === void 0) options = {};
		var medium = innerCreateMedium(null);
		medium.options = tslib_1$5.__assign({
			async: true,
			ssr: false
		}, options);
		return medium;
	}
	exports.createSidecarMedium = createSidecarMedium;
}));
//#endregion
//#region node_modules/use-sidecar/dist/es5/renderProp.js
var require_renderProp = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.renderCar = void 0;
	var tslib_1$4 = __require("tslib");
	var React = tslib_1$4.__importStar(require_react());
	var react_1 = require_react();
	function renderCar(WrappedComponent, defaults) {
		function State(_a) {
			var stateRef = _a.stateRef, props = _a.props;
			var renderTarget = (0, react_1.useCallback)(function SideTarget() {
				var args = [];
				for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
				(0, react_1.useLayoutEffect)(function() {
					stateRef.current(args);
				});
				return null;
			}, []);
			return React.createElement(WrappedComponent, tslib_1$4.__assign({}, props, { children: renderTarget }));
		}
		var Children = React.memo(function(_a) {
			var stateRef = _a.stateRef, defaultState = _a.defaultState, children = _a.children;
			var _b = (0, react_1.useState)(defaultState.current), state = _b[0], setState = _b[1];
			(0, react_1.useEffect)(function() {
				stateRef.current = setState;
			}, []);
			return children.apply(void 0, state);
		}, function() {
			return true;
		});
		return function Combiner(props) {
			var defaultState = React.useRef(defaults(props));
			var ref = React.useRef(function(state) {
				return defaultState.current = state;
			});
			return React.createElement(React.Fragment, null, React.createElement(State, {
				stateRef: ref,
				props
			}), React.createElement(Children, {
				stateRef: ref,
				defaultState,
				children: props.children
			}));
		};
	}
	exports.renderCar = renderCar;
}));
//#endregion
//#region node_modules/use-sidecar/dist/es5/exports.js
var require_exports = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.exportSidecar = void 0;
	var tslib_1$3 = __require("tslib");
	var React = tslib_1$3.__importStar(require_react());
	var SideCar = function(_a) {
		var sideCar = _a.sideCar, rest = tslib_1$3.__rest(_a, ["sideCar"]);
		if (!sideCar) throw new Error("Sidecar: please provide `sideCar` property to import the right car");
		var Target = sideCar.read();
		if (!Target) throw new Error("Sidecar medium not found");
		return React.createElement(Target, tslib_1$3.__assign({}, rest));
	};
	SideCar.isSideCarExport = true;
	function exportSidecar(medium, exported) {
		medium.useMedium(exported);
		return SideCar;
	}
	exports.exportSidecar = exportSidecar;
}));
//#endregion
//#region node_modules/use-sidecar/dist/es5/index.js
var require_es5$5 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.exportSidecar = exports.renderCar = exports.createSidecarMedium = exports.createMedium = exports.setConfig = exports.useSidecar = exports.sidecar = void 0;
	var hoc_1 = require_hoc();
	Object.defineProperty(exports, "sidecar", {
		enumerable: true,
		get: function() {
			return hoc_1.sidecar;
		}
	});
	var hook_1 = require_hook$1();
	Object.defineProperty(exports, "useSidecar", {
		enumerable: true,
		get: function() {
			return hook_1.useSidecar;
		}
	});
	var config_1 = require_config();
	Object.defineProperty(exports, "setConfig", {
		enumerable: true,
		get: function() {
			return config_1.setConfig;
		}
	});
	var medium_1 = require_medium$1();
	Object.defineProperty(exports, "createMedium", {
		enumerable: true,
		get: function() {
			return medium_1.createMedium;
		}
	});
	Object.defineProperty(exports, "createSidecarMedium", {
		enumerable: true,
		get: function() {
			return medium_1.createSidecarMedium;
		}
	});
	var renderProp_1 = require_renderProp();
	Object.defineProperty(exports, "renderCar", {
		enumerable: true,
		get: function() {
			return renderProp_1.renderCar;
		}
	});
	var exports_1 = require_exports();
	Object.defineProperty(exports, "exportSidecar", {
		enumerable: true,
		get: function() {
			return exports_1.exportSidecar;
		}
	});
}));
//#endregion
//#region node_modules/react-remove-scroll/dist/es5/medium.js
var require_medium = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.effectCar = void 0;
	exports.effectCar = (0, require_es5$5().createSidecarMedium)();
}));
//#endregion
//#region node_modules/react-remove-scroll/dist/es5/UI.js
var require_UI = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.RemoveScroll = void 0;
	var tslib_1$2 = __require("tslib");
	var React = tslib_1$2.__importStar(require_react());
	var constants_1 = require_constants();
	var use_callback_ref_1 = require_es5$6();
	var medium_1 = require_medium();
	var nothing = function() {};
	/**
	* Removes scrollbar from the page and contain the scroll within the Lock
	*/
	var RemoveScroll = React.forwardRef(function(props, parentRef) {
		var ref = React.useRef(null);
		var _a = React.useState({
			onScrollCapture: nothing,
			onWheelCapture: nothing,
			onTouchMoveCapture: nothing
		}), callbacks = _a[0], setCallbacks = _a[1];
		var forwardProps = props.forwardProps, children = props.children, className = props.className, removeScrollBar = props.removeScrollBar, enabled = props.enabled, shards = props.shards, sideCar = props.sideCar, noRelative = props.noRelative, noIsolation = props.noIsolation, inert = props.inert, allowPinchZoom = props.allowPinchZoom, _b = props.as, Container = _b === void 0 ? "div" : _b, gapMode = props.gapMode, rest = tslib_1$2.__rest(props, [
			"forwardProps",
			"children",
			"className",
			"removeScrollBar",
			"enabled",
			"shards",
			"sideCar",
			"noRelative",
			"noIsolation",
			"inert",
			"allowPinchZoom",
			"as",
			"gapMode"
		]);
		var SideCar = sideCar;
		var containerRef = (0, use_callback_ref_1.useMergeRefs)([ref, parentRef]);
		var containerProps = tslib_1$2.__assign(tslib_1$2.__assign({}, rest), callbacks);
		return React.createElement(React.Fragment, null, enabled && React.createElement(SideCar, {
			sideCar: medium_1.effectCar,
			removeScrollBar,
			shards,
			noRelative,
			noIsolation,
			inert,
			setCallbacks,
			allowPinchZoom: !!allowPinchZoom,
			lockRef: ref,
			gapMode
		}), forwardProps ? React.cloneElement(React.Children.only(children), tslib_1$2.__assign(tslib_1$2.__assign({}, containerProps), { ref: containerRef })) : React.createElement(Container, tslib_1$2.__assign({}, containerProps, {
			className,
			ref: containerRef
		}), children));
	});
	exports.RemoveScroll = RemoveScroll;
	RemoveScroll.defaultProps = {
		enabled: true,
		removeScrollBar: true,
		inert: false
	};
	RemoveScroll.classNames = {
		fullWidth: constants_1.fullWidthClassName,
		zeroRight: constants_1.zeroRightClassName
	};
}));
//#endregion
//#region node_modules/get-nonce/dist/es5/index.js
var require_es5$4 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var currentNonce;
	exports.setNonce = function(nonce) {
		currentNonce = nonce;
	};
	exports.getNonce = function() {
		if (currentNonce) return currentNonce;
		if (typeof __webpack_nonce__ !== "undefined") return __webpack_nonce__;
	};
}));
//#endregion
//#region node_modules/react-style-singleton/dist/es5/singleton.js
var require_singleton = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.stylesheetSingleton = void 0;
	var get_nonce_1 = require_es5$4();
	function makeStyleTag() {
		if (!document) return null;
		var tag = document.createElement("style");
		tag.type = "text/css";
		var nonce = (0, get_nonce_1.getNonce)();
		if (nonce) tag.setAttribute("nonce", nonce);
		return tag;
	}
	function injectStyles(tag, css) {
		if (tag.styleSheet) tag.styleSheet.cssText = css;
		else tag.appendChild(document.createTextNode(css));
	}
	function insertStyleTag(tag) {
		(document.head || document.getElementsByTagName("head")[0]).appendChild(tag);
	}
	var stylesheetSingleton = function() {
		var counter = 0;
		var stylesheet = null;
		return {
			add: function(style) {
				if (counter == 0) {
					if (stylesheet = makeStyleTag()) {
						injectStyles(stylesheet, style);
						insertStyleTag(stylesheet);
					}
				}
				counter++;
			},
			remove: function() {
				counter--;
				if (!counter && stylesheet) {
					stylesheet.parentNode && stylesheet.parentNode.removeChild(stylesheet);
					stylesheet = null;
				}
			}
		};
	};
	exports.stylesheetSingleton = stylesheetSingleton;
}));
//#endregion
//#region node_modules/react-style-singleton/dist/es5/hook.js
var require_hook = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.styleHookSingleton = void 0;
	var React$1 = __require("tslib").__importStar(require_react());
	var singleton_1 = require_singleton();
	/**
	* creates a hook to control style singleton
	* @see {@link styleSingleton} for a safer component version
	* @example
	* ```tsx
	* const useStyle = styleHookSingleton();
	* ///
	* useStyle('body { overflow: hidden}');
	*/
	var styleHookSingleton = function() {
		var sheet = (0, singleton_1.stylesheetSingleton)();
		return function(styles, isDynamic) {
			React$1.useEffect(function() {
				sheet.add(styles);
				return function() {
					sheet.remove();
				};
			}, [styles && isDynamic]);
		};
	};
	exports.styleHookSingleton = styleHookSingleton;
}));
//#endregion
//#region node_modules/react-style-singleton/dist/es5/component.js
var require_component$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.styleSingleton = void 0;
	var hook_1 = require_hook();
	/**
	* create a Component to add styles on demand
	* - styles are added when first instance is mounted
	* - styles are removed when the last instance is unmounted
	* - changing styles in runtime does nothing unless dynamic is set. But with multiple components that can lead to the undefined behavior
	*/
	var styleSingleton = function() {
		var useStyle = (0, hook_1.styleHookSingleton)();
		var Sheet = function(_a) {
			var styles = _a.styles, dynamic = _a.dynamic;
			useStyle(styles, dynamic);
			return null;
		};
		return Sheet;
	};
	exports.styleSingleton = styleSingleton;
}));
//#endregion
//#region node_modules/react-style-singleton/dist/es5/index.js
var require_es5$3 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.styleHookSingleton = exports.stylesheetSingleton = exports.styleSingleton = void 0;
	var component_1 = require_component$1();
	Object.defineProperty(exports, "styleSingleton", {
		enumerable: true,
		get: function() {
			return component_1.styleSingleton;
		}
	});
	var singleton_1 = require_singleton();
	Object.defineProperty(exports, "stylesheetSingleton", {
		enumerable: true,
		get: function() {
			return singleton_1.stylesheetSingleton;
		}
	});
	var hook_1 = require_hook();
	Object.defineProperty(exports, "styleHookSingleton", {
		enumerable: true,
		get: function() {
			return hook_1.styleHookSingleton;
		}
	});
}));
//#endregion
//#region node_modules/react-remove-scroll-bar/dist/es5/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getGapWidth = exports.zeroGap = void 0;
	exports.zeroGap = {
		left: 0,
		top: 0,
		right: 0,
		gap: 0
	};
	var parse = function(x) {
		return parseInt(x || "", 10) || 0;
	};
	var getOffset = function(gapMode) {
		var cs = window.getComputedStyle(document.body);
		var left = cs[gapMode === "padding" ? "paddingLeft" : "marginLeft"];
		var top = cs[gapMode === "padding" ? "paddingTop" : "marginTop"];
		var right = cs[gapMode === "padding" ? "paddingRight" : "marginRight"];
		return [
			parse(left),
			parse(top),
			parse(right)
		];
	};
	var getGapWidth = function(gapMode) {
		if (gapMode === void 0) gapMode = "margin";
		if (typeof window === "undefined") return exports.zeroGap;
		var offsets = getOffset(gapMode);
		var documentWidth = document.documentElement.clientWidth;
		var windowWidth = window.innerWidth;
		return {
			left: offsets[0],
			top: offsets[1],
			right: offsets[2],
			gap: Math.max(0, windowWidth - documentWidth + offsets[2] - offsets[0])
		};
	};
	exports.getGapWidth = getGapWidth;
}));
//#endregion
//#region node_modules/react-remove-scroll-bar/dist/es5/component.js
var require_component = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.RemoveScrollBar = exports.useLockAttribute = exports.lockAttribute = void 0;
	var React = __require("tslib").__importStar(require_react());
	var react_style_singleton_1 = require_es5$3();
	var constants_1 = require_constants();
	var utils_1 = require_utils();
	var Style = (0, react_style_singleton_1.styleSingleton)();
	exports.lockAttribute = "data-scroll-locked";
	var getStyles = function(_a, allowRelative, gapMode, important) {
		var left = _a.left, top = _a.top, right = _a.right, gap = _a.gap;
		if (gapMode === void 0) gapMode = "margin";
		return "\n  .".concat(constants_1.noScrollbarsClassName, " {\n   overflow: hidden ").concat(important, ";\n   padding-right: ").concat(gap, "px ").concat(important, ";\n  }\n  body[").concat(exports.lockAttribute, "] {\n    overflow: hidden ").concat(important, ";\n    overscroll-behavior: contain;\n    ").concat([
			allowRelative && "position: relative ".concat(important, ";"),
			gapMode === "margin" && "\n    padding-left: ".concat(left, "px;\n    padding-top: ").concat(top, "px;\n    padding-right: ").concat(right, "px;\n    margin-left:0;\n    margin-top:0;\n    margin-right: ").concat(gap, "px ").concat(important, ";\n    "),
			gapMode === "padding" && "padding-right: ".concat(gap, "px ").concat(important, ";")
		].filter(Boolean).join(""), "\n  }\n  \n  .").concat(constants_1.zeroRightClassName, " {\n    right: ").concat(gap, "px ").concat(important, ";\n  }\n  \n  .").concat(constants_1.fullWidthClassName, " {\n    margin-right: ").concat(gap, "px ").concat(important, ";\n  }\n  \n  .").concat(constants_1.zeroRightClassName, " .").concat(constants_1.zeroRightClassName, " {\n    right: 0 ").concat(important, ";\n  }\n  \n  .").concat(constants_1.fullWidthClassName, " .").concat(constants_1.fullWidthClassName, " {\n    margin-right: 0 ").concat(important, ";\n  }\n  \n  body[").concat(exports.lockAttribute, "] {\n    ").concat(constants_1.removedBarSizeVariable, ": ").concat(gap, "px;\n  }\n");
	};
	var getCurrentUseCounter = function() {
		var counter = parseInt(document.body.getAttribute(exports.lockAttribute) || "0", 10);
		return isFinite(counter) ? counter : 0;
	};
	var useLockAttribute = function() {
		React.useEffect(function() {
			document.body.setAttribute(exports.lockAttribute, (getCurrentUseCounter() + 1).toString());
			return function() {
				var newCounter = getCurrentUseCounter() - 1;
				if (newCounter <= 0) document.body.removeAttribute(exports.lockAttribute);
				else document.body.setAttribute(exports.lockAttribute, newCounter.toString());
			};
		}, []);
	};
	exports.useLockAttribute = useLockAttribute;
	/**
	* Removes page scrollbar and blocks page scroll when mounted
	*/
	var RemoveScrollBar = function(_a) {
		var noRelative = _a.noRelative, noImportant = _a.noImportant, _b = _a.gapMode, gapMode = _b === void 0 ? "margin" : _b;
		(0, exports.useLockAttribute)();
		var gap = React.useMemo(function() {
			return (0, utils_1.getGapWidth)(gapMode);
		}, [gapMode]);
		return React.createElement(Style, { styles: getStyles(gap, !noRelative, gapMode, !noImportant ? "!important" : "") });
	};
	exports.RemoveScrollBar = RemoveScrollBar;
}));
//#endregion
//#region node_modules/react-remove-scroll-bar/dist/es5/index.js
var require_es5$2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getGapWidth = exports.removedBarSizeVariable = exports.noScrollbarsClassName = exports.fullWidthClassName = exports.zeroRightClassName = exports.RemoveScrollBar = void 0;
	var component_1 = require_component();
	Object.defineProperty(exports, "RemoveScrollBar", {
		enumerable: true,
		get: function() {
			return component_1.RemoveScrollBar;
		}
	});
	var constants_1 = require_constants();
	Object.defineProperty(exports, "zeroRightClassName", {
		enumerable: true,
		get: function() {
			return constants_1.zeroRightClassName;
		}
	});
	Object.defineProperty(exports, "fullWidthClassName", {
		enumerable: true,
		get: function() {
			return constants_1.fullWidthClassName;
		}
	});
	Object.defineProperty(exports, "noScrollbarsClassName", {
		enumerable: true,
		get: function() {
			return constants_1.noScrollbarsClassName;
		}
	});
	Object.defineProperty(exports, "removedBarSizeVariable", {
		enumerable: true,
		get: function() {
			return constants_1.removedBarSizeVariable;
		}
	});
	var utils_1 = require_utils();
	Object.defineProperty(exports, "getGapWidth", {
		enumerable: true,
		get: function() {
			return utils_1.getGapWidth;
		}
	});
}));
//#endregion
//#region node_modules/react-remove-scroll/dist/es5/aggresiveCapture.js
var require_aggresiveCapture = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.nonPassive = void 0;
	var passiveSupported = false;
	if (typeof window !== "undefined") try {
		var options = Object.defineProperty({}, "passive", { get: function() {
			passiveSupported = true;
			return true;
		} });
		window.addEventListener("test", options, options);
		window.removeEventListener("test", options, options);
	} catch (err) {
		passiveSupported = false;
	}
	exports.nonPassive = passiveSupported ? { passive: false } : false;
}));
//#endregion
//#region node_modules/react-remove-scroll/dist/es5/handleScroll.js
var require_handleScroll = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.handleScroll = exports.locationCouldBeScrolled = void 0;
	var alwaysContainsScroll = function(node) {
		return node.tagName === "TEXTAREA";
	};
	var elementCanBeScrolled = function(node, overflow) {
		if (!(node instanceof Element)) return false;
		var styles = window.getComputedStyle(node);
		return styles[overflow] !== "hidden" && !(styles.overflowY === styles.overflowX && !alwaysContainsScroll(node) && styles[overflow] === "visible");
	};
	var elementCouldBeVScrolled = function(node) {
		return elementCanBeScrolled(node, "overflowY");
	};
	var elementCouldBeHScrolled = function(node) {
		return elementCanBeScrolled(node, "overflowX");
	};
	var locationCouldBeScrolled = function(axis, node) {
		var ownerDocument = node.ownerDocument;
		var current = node;
		do {
			if (typeof ShadowRoot !== "undefined" && current instanceof ShadowRoot) current = current.host;
			if (elementCouldBeScrolled(axis, current)) {
				var _a = getScrollVariables(axis, current);
				if (_a[1] > _a[2]) return true;
			}
			current = current.parentNode;
		} while (current && current !== ownerDocument.body);
		return false;
	};
	exports.locationCouldBeScrolled = locationCouldBeScrolled;
	var getVScrollVariables = function(_a) {
		return [
			_a.scrollTop,
			_a.scrollHeight,
			_a.clientHeight
		];
	};
	var getHScrollVariables = function(_a) {
		return [
			_a.scrollLeft,
			_a.scrollWidth,
			_a.clientWidth
		];
	};
	var elementCouldBeScrolled = function(axis, node) {
		return axis === "v" ? elementCouldBeVScrolled(node) : elementCouldBeHScrolled(node);
	};
	var getScrollVariables = function(axis, node) {
		return axis === "v" ? getVScrollVariables(node) : getHScrollVariables(node);
	};
	var getDirectionFactor = function(axis, direction) {
		/**
		* If the element's direction is rtl (right-to-left), then scrollLeft is 0 when the scrollbar is at its rightmost position,
		* and then increasingly negative as you scroll towards the end of the content.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
		*/
		return axis === "h" && direction === "rtl" ? -1 : 1;
	};
	var handleScroll = function(axis, endTarget, event, sourceDelta, noOverscroll) {
		var directionFactor = getDirectionFactor(axis, window.getComputedStyle(endTarget).direction);
		var delta = directionFactor * sourceDelta;
		var target = event.target;
		var targetInLock = endTarget.contains(target);
		var shouldCancelScroll = false;
		var isDeltaPositive = delta > 0;
		var availableScroll = 0;
		var availableScrollTop = 0;
		do {
			if (!target) break;
			var _a = getScrollVariables(axis, target), position = _a[0];
			var elementScroll = _a[1] - _a[2] - directionFactor * position;
			if (position || elementScroll) {
				if (elementCouldBeScrolled(axis, target)) {
					availableScroll += elementScroll;
					availableScrollTop += position;
				}
			}
			var parent_1 = target.parentNode;
			target = parent_1 && parent_1.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? parent_1.host : parent_1;
		} while (!targetInLock && target !== document.body || targetInLock && (endTarget.contains(target) || endTarget === target));
		if (isDeltaPositive && (noOverscroll && Math.abs(availableScroll) < 1 || !noOverscroll && delta > availableScroll)) shouldCancelScroll = true;
		else if (!isDeltaPositive && (noOverscroll && Math.abs(availableScrollTop) < 1 || !noOverscroll && -delta > availableScrollTop)) shouldCancelScroll = true;
		return shouldCancelScroll;
	};
	exports.handleScroll = handleScroll;
}));
//#endregion
//#region node_modules/react-remove-scroll/dist/es5/SideEffect.js
var require_SideEffect = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.RemoveScrollSideCar = exports.getDeltaXY = exports.getTouchXY = void 0;
	var tslib_1$1 = __require("tslib");
	var React = tslib_1$1.__importStar(require_react());
	var react_remove_scroll_bar_1 = require_es5$2();
	var react_style_singleton_1 = require_es5$3();
	var aggresiveCapture_1 = require_aggresiveCapture();
	var handleScroll_1 = require_handleScroll();
	var getTouchXY = function(event) {
		return "changedTouches" in event ? [event.changedTouches[0].clientX, event.changedTouches[0].clientY] : [0, 0];
	};
	exports.getTouchXY = getTouchXY;
	var getDeltaXY = function(event) {
		return [event.deltaX, event.deltaY];
	};
	exports.getDeltaXY = getDeltaXY;
	var extractRef = function(ref) {
		return ref && "current" in ref ? ref.current : ref;
	};
	var deltaCompare = function(x, y) {
		return x[0] === y[0] && x[1] === y[1];
	};
	var generateStyle = function(id) {
		return "\n  .block-interactivity-".concat(id, " {pointer-events: none;}\n  .allow-interactivity-").concat(id, " {pointer-events: all;}\n");
	};
	var idCounter = 0;
	var lockStack = [];
	function RemoveScrollSideCar(props) {
		var shouldPreventQueue = React.useRef([]);
		var touchStartRef = React.useRef([0, 0]);
		var activeAxis = React.useRef();
		var id = React.useState(idCounter++)[0];
		var Style = React.useState(react_style_singleton_1.styleSingleton)[0];
		var lastProps = React.useRef(props);
		React.useEffect(function() {
			lastProps.current = props;
		}, [props]);
		React.useEffect(function() {
			if (props.inert) {
				document.body.classList.add("block-interactivity-".concat(id));
				var allow_1 = tslib_1$1.__spreadArray([props.lockRef.current], (props.shards || []).map(extractRef), true).filter(Boolean);
				allow_1.forEach(function(el) {
					return el.classList.add("allow-interactivity-".concat(id));
				});
				return function() {
					document.body.classList.remove("block-interactivity-".concat(id));
					allow_1.forEach(function(el) {
						return el.classList.remove("allow-interactivity-".concat(id));
					});
				};
			}
		}, [
			props.inert,
			props.lockRef.current,
			props.shards
		]);
		var shouldCancelEvent = React.useCallback(function(event, parent) {
			if ("touches" in event && event.touches.length === 2 || event.type === "wheel" && event.ctrlKey) return !lastProps.current.allowPinchZoom;
			var touch = (0, exports.getTouchXY)(event);
			var touchStart = touchStartRef.current;
			var deltaX = "deltaX" in event ? event.deltaX : touchStart[0] - touch[0];
			var deltaY = "deltaY" in event ? event.deltaY : touchStart[1] - touch[1];
			var currentAxis;
			var target = event.target;
			var moveDirection = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
			if ("touches" in event && moveDirection === "h" && target.type === "range") return false;
			var selection = window.getSelection();
			var anchorNode = selection && selection.anchorNode;
			if (anchorNode ? anchorNode === target || anchorNode.contains(target) : false) return false;
			var canBeScrolledInMainDirection = (0, handleScroll_1.locationCouldBeScrolled)(moveDirection, target);
			if (!canBeScrolledInMainDirection) return true;
			if (canBeScrolledInMainDirection) currentAxis = moveDirection;
			else {
				currentAxis = moveDirection === "v" ? "h" : "v";
				canBeScrolledInMainDirection = (0, handleScroll_1.locationCouldBeScrolled)(moveDirection, target);
			}
			if (!canBeScrolledInMainDirection) return false;
			if (!activeAxis.current && "changedTouches" in event && (deltaX || deltaY)) activeAxis.current = currentAxis;
			if (!currentAxis) return true;
			var cancelingAxis = activeAxis.current || currentAxis;
			return (0, handleScroll_1.handleScroll)(cancelingAxis, parent, event, cancelingAxis === "h" ? deltaX : deltaY, true);
		}, []);
		var shouldPrevent = React.useCallback(function(_event) {
			var event = _event;
			if (!lockStack.length || lockStack[lockStack.length - 1] !== Style) return;
			var delta = "deltaY" in event ? (0, exports.getDeltaXY)(event) : (0, exports.getTouchXY)(event);
			var sourceEvent = shouldPreventQueue.current.filter(function(e) {
				return e.name === event.type && (e.target === event.target || event.target === e.shadowParent) && deltaCompare(e.delta, delta);
			})[0];
			if (sourceEvent && sourceEvent.should) {
				if (event.cancelable) event.preventDefault();
				return;
			}
			if (!sourceEvent) {
				var shardNodes = (lastProps.current.shards || []).map(extractRef).filter(Boolean).filter(function(node) {
					return node.contains(event.target);
				});
				if (shardNodes.length > 0 ? shouldCancelEvent(event, shardNodes[0]) : !lastProps.current.noIsolation) {
					if (event.cancelable) event.preventDefault();
				}
			}
		}, []);
		var shouldCancel = React.useCallback(function(name, delta, target, should) {
			var event = {
				name,
				delta,
				target,
				should,
				shadowParent: getOutermostShadowParent(target)
			};
			shouldPreventQueue.current.push(event);
			setTimeout(function() {
				shouldPreventQueue.current = shouldPreventQueue.current.filter(function(e) {
					return e !== event;
				});
			}, 1);
		}, []);
		var scrollTouchStart = React.useCallback(function(event) {
			touchStartRef.current = (0, exports.getTouchXY)(event);
			activeAxis.current = void 0;
		}, []);
		var scrollWheel = React.useCallback(function(event) {
			shouldCancel(event.type, (0, exports.getDeltaXY)(event), event.target, shouldCancelEvent(event, props.lockRef.current));
		}, []);
		var scrollTouchMove = React.useCallback(function(event) {
			shouldCancel(event.type, (0, exports.getTouchXY)(event), event.target, shouldCancelEvent(event, props.lockRef.current));
		}, []);
		React.useEffect(function() {
			lockStack.push(Style);
			props.setCallbacks({
				onScrollCapture: scrollWheel,
				onWheelCapture: scrollWheel,
				onTouchMoveCapture: scrollTouchMove
			});
			document.addEventListener("wheel", shouldPrevent, aggresiveCapture_1.nonPassive);
			document.addEventListener("touchmove", shouldPrevent, aggresiveCapture_1.nonPassive);
			document.addEventListener("touchstart", scrollTouchStart, aggresiveCapture_1.nonPassive);
			return function() {
				lockStack = lockStack.filter(function(inst) {
					return inst !== Style;
				});
				document.removeEventListener("wheel", shouldPrevent, aggresiveCapture_1.nonPassive);
				document.removeEventListener("touchmove", shouldPrevent, aggresiveCapture_1.nonPassive);
				document.removeEventListener("touchstart", scrollTouchStart, aggresiveCapture_1.nonPassive);
			};
		}, []);
		var removeScrollBar = props.removeScrollBar, inert = props.inert;
		return React.createElement(React.Fragment, null, inert ? React.createElement(Style, { styles: generateStyle(id) }) : null, removeScrollBar ? React.createElement(react_remove_scroll_bar_1.RemoveScrollBar, {
			noRelative: props.noRelative,
			gapMode: props.gapMode
		}) : null);
	}
	exports.RemoveScrollSideCar = RemoveScrollSideCar;
	function getOutermostShadowParent(node) {
		var shadowParent = null;
		while (node !== null) {
			if (node instanceof ShadowRoot) {
				shadowParent = node.host;
				node = node.host;
			}
			node = node.parentNode;
		}
		return shadowParent;
	}
}));
//#endregion
//#region node_modules/react-remove-scroll/dist/es5/sidecar.js
var require_sidecar = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var use_sidecar_1 = require_es5$5();
	var SideEffect_1 = require_SideEffect();
	var medium_1 = require_medium();
	exports.default = (0, use_sidecar_1.exportSidecar)(medium_1.effectCar, SideEffect_1.RemoveScrollSideCar);
}));
//#endregion
//#region node_modules/react-remove-scroll/dist/es5/Combination.js
var require_Combination = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var tslib_1 = __require("tslib");
	var React = tslib_1.__importStar(require_react());
	var UI_1 = require_UI();
	var sidecar_1 = tslib_1.__importDefault(require_sidecar());
	var ReactRemoveScroll = React.forwardRef(function(props, ref) {
		return React.createElement(UI_1.RemoveScroll, tslib_1.__assign({}, props, {
			ref,
			sideCar: sidecar_1.default
		}));
	});
	ReactRemoveScroll.classNames = UI_1.RemoveScroll.classNames;
	exports.default = ReactRemoveScroll;
}));
//#endregion
//#region node_modules/react-remove-scroll/dist/es5/index.js
var require_es5$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.RemoveScroll = void 0;
	exports.RemoveScroll = __require("tslib").__importDefault(require_Combination()).default;
}));
//#endregion
//#region node_modules/aria-hidden/dist/es5/index.js
var require_es5 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.suppressOthers = exports.supportsInert = exports.inertOthers = exports.hideOthers = void 0;
	var getDefaultParent = function(originalTarget) {
		if (typeof document === "undefined") return null;
		return (Array.isArray(originalTarget) ? originalTarget[0] : originalTarget).ownerDocument.body;
	};
	var counterMap = /* @__PURE__ */ new WeakMap();
	var uncontrolledNodes = /* @__PURE__ */ new WeakMap();
	var markerMap = {};
	var lockCount = 0;
	var unwrapHost = function(node) {
		return node && (node.host || unwrapHost(node.parentNode));
	};
	var correctTargets = function(parent, targets) {
		return targets.map(function(target) {
			if (parent.contains(target)) return target;
			var correctedTarget = unwrapHost(target);
			if (correctedTarget && parent.contains(correctedTarget)) return correctedTarget;
			console.error("aria-hidden", target, "in not contained inside", parent, ". Doing nothing");
			return null;
		}).filter(function(x) {
			return Boolean(x);
		});
	};
	/**
	* Marks everything except given node(or nodes) as aria-hidden
	* @param {Element | Element[]} originalTarget - elements to keep on the page
	* @param [parentNode] - top element, defaults to document.body
	* @param {String} [markerName] - a special attribute to mark every node
	* @param {String} [controlAttribute] - html Attribute to control
	* @return {Undo} undo command
	*/
	var applyAttributeToOthers = function(originalTarget, parentNode, markerName, controlAttribute) {
		var targets = correctTargets(parentNode, Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
		if (!markerMap[markerName]) markerMap[markerName] = /* @__PURE__ */ new WeakMap();
		var markerCounter = markerMap[markerName];
		var hiddenNodes = [];
		var elementsToKeep = /* @__PURE__ */ new Set();
		var elementsToStop = new Set(targets);
		var keep = function(el) {
			if (!el || elementsToKeep.has(el)) return;
			elementsToKeep.add(el);
			keep(el.parentNode);
		};
		targets.forEach(keep);
		var deep = function(parent) {
			if (!parent || elementsToStop.has(parent)) return;
			Array.prototype.forEach.call(parent.children, function(node) {
				if (elementsToKeep.has(node)) deep(node);
				else try {
					var attr = node.getAttribute(controlAttribute);
					var alreadyHidden = attr !== null && attr !== "false";
					var counterValue = (counterMap.get(node) || 0) + 1;
					var markerValue = (markerCounter.get(node) || 0) + 1;
					counterMap.set(node, counterValue);
					markerCounter.set(node, markerValue);
					hiddenNodes.push(node);
					if (counterValue === 1 && alreadyHidden) uncontrolledNodes.set(node, true);
					if (markerValue === 1) node.setAttribute(markerName, "true");
					if (!alreadyHidden) node.setAttribute(controlAttribute, "true");
				} catch (e) {
					console.error("aria-hidden: cannot operate on ", node, e);
				}
			});
		};
		deep(parentNode);
		elementsToKeep.clear();
		lockCount++;
		return function() {
			hiddenNodes.forEach(function(node) {
				var counterValue = counterMap.get(node) - 1;
				var markerValue = markerCounter.get(node) - 1;
				counterMap.set(node, counterValue);
				markerCounter.set(node, markerValue);
				if (!counterValue) {
					if (!uncontrolledNodes.has(node)) node.removeAttribute(controlAttribute);
					uncontrolledNodes.delete(node);
				}
				if (!markerValue) node.removeAttribute(markerName);
			});
			lockCount--;
			if (!lockCount) {
				counterMap = /* @__PURE__ */ new WeakMap();
				counterMap = /* @__PURE__ */ new WeakMap();
				uncontrolledNodes = /* @__PURE__ */ new WeakMap();
				markerMap = {};
			}
		};
	};
	/**
	* Marks everything except given node(or nodes) as aria-hidden
	* @param {Element | Element[]} originalTarget - elements to keep on the page
	* @param [parentNode] - top element, defaults to document.body
	* @param {String} [markerName] - a special attribute to mark every node
	* @return {Undo} undo command
	*/
	var hideOthers = function(originalTarget, parentNode, markerName) {
		if (markerName === void 0) markerName = "data-aria-hidden";
		var targets = Array.from(Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
		var activeParentNode = parentNode || getDefaultParent(originalTarget);
		if (!activeParentNode) return function() {
			return null;
		};
		targets.push.apply(targets, Array.from(activeParentNode.querySelectorAll("[aria-live], script")));
		return applyAttributeToOthers(targets, activeParentNode, markerName, "aria-hidden");
	};
	exports.hideOthers = hideOthers;
	/**
	* Marks everything except given node(or nodes) as inert
	* @param {Element | Element[]} originalTarget - elements to keep on the page
	* @param [parentNode] - top element, defaults to document.body
	* @param {String} [markerName] - a special attribute to mark every node
	* @return {Undo} undo command
	*/
	var inertOthers = function(originalTarget, parentNode, markerName) {
		if (markerName === void 0) markerName = "data-inert-ed";
		var activeParentNode = parentNode || getDefaultParent(originalTarget);
		if (!activeParentNode) return function() {
			return null;
		};
		return applyAttributeToOthers(originalTarget, activeParentNode, markerName, "inert");
	};
	exports.inertOthers = inertOthers;
	/**
	* @returns if current browser supports inert
	*/
	var supportsInert = function() {
		return typeof HTMLElement !== "undefined" && HTMLElement.prototype.hasOwnProperty("inert");
	};
	exports.supportsInert = supportsInert;
	/**
	* Automatic function to "suppress" DOM elements - _hide_ or _inert_ in the best possible way
	* @param {Element | Element[]} originalTarget - elements to keep on the page
	* @param [parentNode] - top element, defaults to document.body
	* @param {String} [markerName] - a special attribute to mark every node
	* @return {Undo} undo command
	*/
	var suppressOthers = function(originalTarget, parentNode, markerName) {
		if (markerName === void 0) markerName = "data-suppressed";
		return ((0, exports.supportsInert)() ? exports.inertOthers : exports.hideOthers)(originalTarget, parentNode, markerName);
	};
	exports.suppressOthers = suppressOthers;
}));
//#endregion
//#region node_modules/@radix-ui/react-dialog/dist/index.mjs
var import_es5 = require_es5$1();
var import_es5$1 = require_es5();
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", {
	value,
	configurable: true
});
var DIALOG_NAME = "Dialog";
var [createDialogContext, createDialogScope] = createContextScope(DIALOG_NAME);
var [DialogProvider, useDialogContext] = createDialogContext(DIALOG_NAME);
var Dialog = /* @__PURE__ */ __name((props) => {
	const { __scopeDialog, children, open: openProp, defaultOpen, onOpenChange, modal = true } = props;
	const triggerRef = import_react.useRef(null);
	const contentRef = import_react.useRef(null);
	const [open, setOpen] = useControllableState({
		prop: openProp,
		defaultProp: defaultOpen ?? false,
		onChange: onOpenChange,
		caller: DIALOG_NAME
	});
	const [titleCount, setTitleCount] = import_react.useState(0);
	const [descriptionCount, setDescriptionCount] = import_react.useState(0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogProvider, {
		scope: __scopeDialog,
		triggerRef,
		contentRef,
		contentId: useId(),
		titleId: useId(),
		descriptionId: useId(),
		titlePresent: titleCount > 0,
		descriptionPresent: descriptionCount > 0,
		setTitleCount,
		setDescriptionCount,
		open,
		onOpenChange: setOpen,
		onOpenToggle: import_react.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
		modal,
		children
	});
}, "Dialog");
var TRIGGER_NAME = "DialogTrigger";
var DialogTrigger = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogTrigger2(props, forwardedRef) {
	const { __scopeDialog, ...triggerProps } = props;
	const context = useDialogContext(TRIGGER_NAME, __scopeDialog);
	const composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.button, {
		type: "button",
		"aria-haspopup": "dialog",
		"aria-expanded": context.open,
		"aria-controls": context.open ? context.contentId : void 0,
		"data-state": getState(context.open),
		...triggerProps,
		ref: composedTriggerRef,
		onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
	});
}, "DialogTrigger"));
var PORTAL_NAME = "DialogPortal";
var [PortalProvider, usePortalContext] = createDialogContext(PORTAL_NAME, { forceMount: void 0 });
var DialogPortal = /* @__PURE__ */ __name((props) => {
	const { __scopeDialog, forceMount, children, container } = props;
	const context = useDialogContext(PORTAL_NAME, __scopeDialog);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortalProvider, {
		scope: __scopeDialog,
		forceMount,
		children: import_react.Children.map(children, (child) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Presence, {
			present: forceMount || context.open,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, {
				asChild: true,
				container,
				children: child
			})
		}))
	});
}, "DialogPortal");
var OVERLAY_NAME = "DialogOverlay";
var DialogOverlay = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogOverlay2(props, forwardedRef) {
	const portalContext = usePortalContext(OVERLAY_NAME, props.__scopeDialog);
	const { forceMount = portalContext.forceMount, ...overlayProps } = props;
	const context = useDialogContext(OVERLAY_NAME, props.__scopeDialog);
	return context.modal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Presence, {
		present: forceMount || context.open,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlayImpl, {
			...overlayProps,
			ref: forwardedRef
		})
	}) : null;
}, "DialogOverlay"));
var Slot = /* @__PURE__ */ createSlot("DialogOverlay.RemoveScroll");
var DialogOverlayImpl = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogOverlayImpl2(props, forwardedRef) {
	const { __scopeDialog, ...overlayProps } = props;
	const context = useDialogContext(OVERLAY_NAME, __scopeDialog);
	const registerDismissableSurface = useDismissableLayerSurface();
	const composedRefs = useComposedRefs(forwardedRef, registerDismissableSurface);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_es5.RemoveScroll, {
		as: Slot,
		allowPinchZoom: true,
		shards: [context.contentRef],
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.div, {
			"data-state": getState(context.open),
			...overlayProps,
			ref: composedRefs,
			style: {
				pointerEvents: "auto",
				...overlayProps.style
			}
		})
	});
}, "DialogOverlayImpl"));
var CONTENT_NAME = "DialogContent";
var DialogContent = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogContent2(props, forwardedRef) {
	const portalContext = usePortalContext(CONTENT_NAME, props.__scopeDialog);
	const { forceMount = portalContext.forceMount, ...contentProps } = props;
	const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Presence, {
		present: forceMount || context.open,
		children: context.modal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContentModal, {
			...contentProps,
			ref: forwardedRef
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContentNonModal, {
			...contentProps,
			ref: forwardedRef
		})
	});
}, "DialogContent"));
var DialogContentModal = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogContentModal2(props, forwardedRef) {
	const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
	const contentRef = import_react.useRef(null);
	const composedRefs = useComposedRefs(forwardedRef, context.contentRef, contentRef);
	import_react.useEffect(() => {
		const content = contentRef.current;
		if (content) return (0, import_es5$1.hideOthers)(content);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContentImpl, {
		...props,
		ref: composedRefs,
		trapFocus: context.open,
		disableOutsidePointerEvents: context.open,
		onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
			event.preventDefault();
			context.triggerRef.current?.focus();
		}),
		onPointerDownOutside: composeEventHandlers(props.onPointerDownOutside, (event) => {
			const originalEvent = event.detail.originalEvent;
			const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
			if (originalEvent.button === 2 || ctrlLeftClick) event.preventDefault();
		}),
		onFocusOutside: composeEventHandlers(props.onFocusOutside, (event) => event.preventDefault())
	});
}, "DialogContentModal"));
var DialogContentNonModal = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogContentNonModal2(props, forwardedRef) {
	const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
	const hasInteractedOutsideRef = import_react.useRef(false);
	const hasPointerDownOutsideRef = import_react.useRef(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContentImpl, {
		...props,
		ref: forwardedRef,
		trapFocus: false,
		disableOutsidePointerEvents: false,
		onCloseAutoFocus: (event) => {
			props.onCloseAutoFocus?.(event);
			if (!event.defaultPrevented) {
				if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
				event.preventDefault();
			}
			hasInteractedOutsideRef.current = false;
			hasPointerDownOutsideRef.current = false;
		},
		onInteractOutside: (event) => {
			props.onInteractOutside?.(event);
			if (!event.defaultPrevented) {
				hasInteractedOutsideRef.current = true;
				if (event.detail.originalEvent.type === "pointerdown") hasPointerDownOutsideRef.current = true;
			}
			const target = event.target;
			if (context.triggerRef.current?.contains(target)) event.preventDefault();
			if (event.detail.originalEvent.type === "focusin" && hasPointerDownOutsideRef.current) event.preventDefault();
		}
	});
}, "DialogContentNonModal"));
var DialogContentImpl = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogContentImpl2(props, forwardedRef) {
	const { __scopeDialog, trapFocus, onOpenAutoFocus, onCloseAutoFocus, ...contentProps } = props;
	const context = useDialogContext(CONTENT_NAME, __scopeDialog);
	useFocusGuards();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FocusScope, {
		asChild: true,
		loop: true,
		trapped: trapFocus,
		onMountAutoFocus: onOpenAutoFocus,
		onUnmountAutoFocus: onCloseAutoFocus,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DismissableLayer, {
			role: "dialog",
			id: context.contentId,
			"aria-describedby": context.descriptionPresent ? context.descriptionId : void 0,
			"aria-labelledby": context.titlePresent ? context.titleId : void 0,
			"data-state": getState(context.open),
			...contentProps,
			ref: forwardedRef,
			deferPointerDownOutside: true,
			onDismiss: () => context.onOpenChange(false)
		})
	}) });
}, "DialogContentImpl"));
var TITLE_NAME = "DialogTitle";
var DialogTitle = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogTitle2(props, forwardedRef) {
	const { __scopeDialog, ...titleProps } = props;
	const context = useDialogContext(TITLE_NAME, __scopeDialog);
	const { setTitleCount } = context;
	useLayoutEffect2(() => {
		setTitleCount((count) => count + 1);
		return () => setTitleCount((count) => count - 1);
	}, [setTitleCount]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.h2, {
		id: context.titleId,
		...titleProps,
		ref: forwardedRef
	});
}, "DialogTitle"));
var DESCRIPTION_NAME = "DialogDescription";
var DialogDescription = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogDescription2(props, forwardedRef) {
	const { __scopeDialog, ...descriptionProps } = props;
	const context = useDialogContext(DESCRIPTION_NAME, __scopeDialog);
	const { setDescriptionCount } = context;
	useLayoutEffect2(() => {
		setDescriptionCount((count) => count + 1);
		return () => setDescriptionCount((count) => count - 1);
	}, [setDescriptionCount]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.p, {
		id: context.descriptionId,
		...descriptionProps,
		ref: forwardedRef
	});
}, "DialogDescription"));
var CLOSE_NAME = "DialogClose";
var DialogClose = /* @__PURE__ */ import_react.forwardRef(/* @__PURE__ */ __name(function DialogClose2(props, forwardedRef) {
	const { __scopeDialog, ...closeProps } = props;
	const context = useDialogContext(CLOSE_NAME, __scopeDialog);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.button, {
		type: "button",
		...closeProps,
		ref: forwardedRef,
		onClick: composeEventHandlers(props.onClick, () => context.onOpenChange(false))
	});
}, "DialogClose"));
function getState(open) {
	return open ? "open" : "closed";
}
__name(getState, "getState");
//#endregion
export { Primitive as _, DialogOverlay as a, useId as b, DialogTrigger as c, useFocusGuards as d, Presence as f, useCallbackRef as g, DismissableLayer as h, DialogDescription as i, require_es5 as l, FocusScope as m, DialogClose as n, DialogPortal as o, Portal as p, DialogContent as r, DialogTitle as s, Dialog as t, require_es5$1 as u, createSlot as v, useLayoutEffect2 as x, useControllableState as y };
