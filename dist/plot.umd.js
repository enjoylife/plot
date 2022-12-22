// @observablehq/plot v0.6.1 Copyright 2020-2022 Observable, Inc.
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3@7.7.0/dist/d3.min.js')) :
typeof define === 'function' && define.amd ? define(['exports', 'd3@7.7.0/dist/d3.min.js'], factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Plot = global.Plot || {}, global.d3));
})(this, (function (exports, d3) { 'use strict';

var version = "0.6.1";

function format(date, fallback) {
  if (!(date instanceof Date)) date = new Date(+date);
  if (isNaN(date)) return typeof fallback === "function" ? fallback(date) : fallback;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();
  return `${formatYear(date.getUTCFullYear())}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}${
    hours || minutes || seconds || milliseconds ? `T${pad(hours, 2)}:${pad(minutes, 2)}${
      seconds || milliseconds ? `:${pad(seconds, 2)}${
        milliseconds ? `.${pad(milliseconds, 3)}` : ``
      }` : ``
    }Z` : ``
  }`;
}

function formatYear(year) {
  return year < 0 ? `-${pad(-year, 6)}`
    : year > 9999 ? `+${pad(year, 6)}`
    : pad(year, 4);
}

function pad(value, width) {
  return `${value}`.padStart(width, "0");
}

const re = /^(?:[-+]\d{2})?\d{4}(?:-\d{2}(?:-\d{2})?)?(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[-+]\d{2}:?\d{2})?)?$/;

function parse(string, fallback) {
  if (!re.test(string += "")) return typeof fallback === "function" ? fallback(string) : fallback;
  return new Date(string);
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
const TypedArray = Object.getPrototypeOf(Uint8Array);
const objectToString = Object.prototype.toString;
/** 
 * Given an iterable *data* and some *value* accessor, returns an array (a column) of the specified *type* with the corresponding value of each element of the data. The *value* accessor may be one of the following types:
 * 
 * * a string - corresponding to the field accessor (`d => d[value]`)
 * * an accessor function - called as *type*.from(*data*, *value*)
 * * a number, Date, or boolean — resulting in an array uniformly filled with the *value*
 * * an object with a transform method — called as *value*.transform(*data*)
 * * an array of values - returning the same
 * * null or undefined - returning the same
 * 
 * If *type* is specified, it must be Array or a similar class that implements the [Array.from](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from) interface such as a typed array. When *type* is Array or a typed array class, the return value of valueof will be an instance of the same (or null or undefined). If *type* is not specified, valueof may return either an array or a typed array (or null or undefined).
 * 
 * Plot.valueof is not guaranteed to return a new array. When a transform method is used, or when the given *value* is an array that is compatible with the requested *type*, the array may be returned as-is without making a copy.
 * 
 */
function valueof(data, value, type) {
    const valueType = typeof value;
    return valueType === "string"
        ? map$1(data, field(value), type)
        : valueType === "function"
            ? map$1(data, value, type)
            : valueType === "number" || value instanceof Date || valueType === "boolean"
                ? map$1(data, constant(value), type)
                : value && typeof value.transform === "function"
                    ? arrayify(value.transform(data), type)
                    : arrayify(value, type); // preserve undefined type
}
const field = (name) => (d) => d[name];
const indexOf = (d, i) => i;
const identity$1 = { transform: (d) => d };
const one = () => 1;
const yes = () => true;
const string = (x) => (x == null ? x : `${x}`);
const number = (x) => (x == null ? x : +x);
const boolean = (x) => (x == null ? x : !!x);
const first = (x) => (x ? x[0] : undefined);
const second = (x) => (x ? x[1] : undefined);
const constant = (x) => () => x;
const each = (x) => x;
// Converts a string like “p25” into a function that takes an index I and an
// accessor function f, returning the corresponding percentile value.
function percentile(reduce) {
    const p = +`${reduce}`.slice(1) / 100;
    return (I, f) => d3.quantile(I, p, f);
}
// Some channels may allow a string constant to be specified; to differentiate
// string constants (e.g., "red") from named fields (e.g., "date"), this
// function tests whether the given value is a CSS color string and returns a
// tuple [channel, constant] where one of the two is undefined, and the other is
// the given value. If you wish to reference a named field that is also a valid
// CSS color, use an accessor (d => d.red) instead.
function maybeColorChannel(value, defaultValue) {
    if (value === undefined)
        value = defaultValue;
    return value === null ? [undefined, "none"] : isColor(value) ? [undefined, value] : [value, undefined];
}
// Similar to maybeColorChannel, this tests whether the given value is a number
// indicating a constant, and otherwise assumes that it’s a channel value.
function maybeNumberChannel(value, defaultValue) {
    if (value === undefined)
        value = defaultValue;
    return value === null || typeof value === "number" ? [undefined, value] : [value, undefined];
}
// Validates the specified optional string against the allowed list of keywords.
function maybeKeyword(input, name, allowed) {
    if (input != null)
        return keyword(input, name, allowed);
}
// Validates the specified required string against the allowed list of keywords.
function keyword(input, name, allowed) {
    const i = `${input}`.toLowerCase();
    if (!allowed.includes(i))
        throw new Error(`invalid ${name}: ${input}`);
    return i;
}
// Promotes the specified data to an array or typed array as needed. If an array
// type is provided (e.g., Array), then the returned array will strictly be of
// the specified type; otherwise, any array or typed array may be returned. If
// the specified data is null or undefined, returns the value as-is.
function arrayify(data, type) {
    return data == null
        ? data
        : type === undefined
            ? data instanceof Array || data instanceof TypedArray
                ? data
                : Array.from(data)
            : data instanceof type
                ? data
                : type.from(data);
}
// An optimization of type.from(values, f): if the given values are already an
// instanceof the desired array type, the faster values.map method is used.
function map$1(values, f, type = Array) {
    return values instanceof type ? values.map(f) : type.from(values, f);
}
// An optimization of type.from(values): if the given values are already an
// instanceof the desired array type, the faster values.slice method is used.
function slice$1(values, type = Array) {
    return values instanceof type ? values.slice() : type.from(values);
}
function isTypedArray(values) {
    return values instanceof TypedArray;
}
// Disambiguates an options object (e.g., {y: "x2"}) from a primitive value.
function isObject(option) {
    return option?.toString === objectToString;
}
// Disambiguates a scale options object (e.g., {color: {type: "linear"}}) from
// some other option (e.g., {color: "red"}). When creating standalone legends,
// this is used to test whether a scale is defined; this should be consistent
// with inferScaleType when there are no channels associated with the scale, and
// if this returns true, then normalizeScale must return non-null.
function isScaleOptions(option) {
    return isObject(option) && (option.type !== undefined || option.domain !== undefined);
}
// Disambiguates an options object (e.g., {y: "x2"}) from a channel value
// definition expressed as a channel transform (e.g., {transform: …}).
function isOptions(option) {
    return isObject(option) && typeof option.transform !== "function";
}
// Disambiguates a sort transform (e.g., {sort: "date"}) from a channel domain
// sort definition (e.g., {sort: {y: "x"}}).
function isDomainSort(sort) {
    return isOptions(sort) && sort.value === undefined && sort.channel === undefined;
}
// For marks specified either as [0, x] or [x1, x2], such as areas and bars.
function maybeZero(x, x1, x2, x3 = identity$1) {
    if (x1 === undefined && x2 === undefined) {
        // {x} or {}
        (x1 = 0), (x2 = x === undefined ? x3 : x);
    }
    else if (x1 === undefined) {
        // {x, x2} or {x2}
        x1 = x === undefined ? 0 : x;
    }
    else if (x2 === undefined) {
        // {x, x1} or {x1}
        x2 = x === undefined ? 0 : x;
    }
    return [x1, x2];
}
// For marks that have x and y channels (e.g., cell, dot, line, text).
function maybeTuple(x, y) {
    return x === undefined && y === undefined ? [first, second] : [x, y];
}
// A helper for extracting the z channel, if it is variable. Used by transforms
// that require series, such as moving average and normalize.
function maybeZ({ z, fill, stroke } = {}) {
    if (z === undefined)
        [z] = maybeColorChannel(fill);
    if (z === undefined)
        [z] = maybeColorChannel(stroke);
    return z;
}
// Returns a Uint32Array with elements [0, 1, 2, … data.length - 1].
function range(data) {
    const n = data.length;
    const r = new Uint32Array(n);
    for (let i = 0; i < n; ++i)
        r[i] = i;
    return r;
}
// Returns a filtered range of data given the test function.
function where(data, test) {
    return range(data).filter((i) => test(data[i], i, data));
}
// Returns an array [values[index[0]], values[index[1]], …].
function take(values, index) {
    return map$1(index, (i) => values[i]);
}
// Based on InternMap (d3.group).
function keyof(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
}
function maybeInput(key, options) {
    if (options[key] !== undefined)
        return options[key];
    switch (key) {
        case "x1":
        case "x2":
            key = "x";
            break;
        case "y1":
        case "y2":
            key = "y";
            break;
    }
    return options[key];
}
/** 
 * This helper for constructing derived columns returns a [*column*, *setColumn*] array. The *column* object implements *column*.transform, returning whatever value was most recently passed to *setColumn*. If *setColumn* is not called, then *column*.transform returns undefined. If a *source* is specified, then *column*.label exposes the given *source*’s label, if any: if *source* is a string as when representing a named field of data, then *column*.label is *source*; otherwise *column*.label propagates *source*.label. This allows derived columns to propagate a human-readable axis or legend label.
 * 
 * Plot.column is typically used by options transforms to define new channels; the associated columns are populated (derived) when the **transform** option function is invoked.
 * 
 */
function column(source) {
    // Defines a column whose values are lazily populated by calling the returned
    // setter. If the given source is labeled, the label is propagated to the
    // returned column definition.
    let value;
    return [
        {
            transform: () => value,
            label: labelof(source)
        },
        (v) => (value = v)
    ];
}
// Like column, but allows the source to be null.
function maybeColumn(source) {
    return source == null ? [source] : column(source);
}
function labelof(value, defaultValue) {
    return typeof value === "string" ? value : value && value.label !== undefined ? value.label : defaultValue;
}
// Assuming that both x1 and x2 and lazy columns (per above), this derives a new
// a column that’s the average of the two, and which inherits the column label
// (if any). Both input columns are assumed to be quantitative. If either column
// is temporal, the returned column is also temporal.
function mid$1(x1, x2) {
    return {
        transform(data) {
            const X1 = x1.transform(data);
            const X2 = x2.transform(data);
            return isTemporal(X1) || isTemporal(X2)
                ? map$1(X1, (_, i) => new Date((+X1[i] + +X2[i]) / 2))
                : map$1(X1, (_, i) => (+X1[i] + +X2[i]) / 2, Float64Array);
        },
        label: x1.label
    };
}
// This distinguishes between per-dimension options and a standalone value.
function maybeValue(value) {
    return value === undefined || isOptions(value) ? value : { value };
}
// Coerces the given channel values (if any) to numbers. This is useful when
// values will be interpolated into other code, such as an SVG transform, and
// where we don’t wish to allow unexpected behavior for weird input.
function numberChannel(source) {
    return source == null
        ? null
        : {
            transform: (data) => valueof(data, source, Float64Array),
            label: labelof(source)
        };
}
function isIterable(value) {
    return value && typeof value[Symbol.iterator] === "function";
}
function isTextual(values) {
    for (const value of values) {
        if (value == null)
            continue;
        return typeof value !== "object" || value instanceof Date;
    }
}
function isOrdinal(values) {
    for (const value of values) {
        if (value == null)
            continue;
        const type = typeof value;
        return type === "string" || type === "boolean";
    }
}
function isTemporal(values) {
    for (const value of values) {
        if (value == null)
            continue;
        return value instanceof Date;
    }
}
// Are these strings that might represent dates? This is stricter than ISO 8601
// because we want to ignore false positives on numbers; for example, the string
// "1192" is more likely to represent a number than a date even though it is
// valid ISO 8601 representing 1192-01-01.
function isTemporalString(values) {
    for (const value of values) {
        if (value == null)
            continue;
        return typeof value === "string" && isNaN(value) && parse(value);
    }
}
// Are these strings that might represent numbers? This is stricter than
// coercion because we want to ignore false positives on e.g. empty strings.
function isNumericString(values) {
    for (const value of values) {
        if (value == null)
            continue;
        if (typeof value !== "string")
            return false;
        if (!value.trim())
            continue;
        return !isNaN(value);
    }
}
function isNumeric(values) {
    for (const value of values) {
        if (value == null)
            continue;
        return typeof value === "number";
    }
}
function isFirst(values, is) {
    for (const value of values) {
        if (value == null)
            continue;
        return is(value);
    }
}
// Whereas isFirst only tests the first defined value and returns undefined for
// an empty array, this tests all defined values and only returns true if all of
// them are valid colors. It also returns true for an empty array, and thus
// should generally be used in conjunction with isFirst.
function isEvery(values, is) {
    for (const value of values) {
        if (value == null)
            continue;
        if (!is(value))
            return false;
    }
    return true;
}
// Mostly relies on d3-color, with a few extra color keywords. Currently this
// strictly requires that the value be a string; we might want to apply string
// coercion here, though note that d3-color instances would need to support
// valueOf to work correctly with InternMap.
// https://www.w3.org/TR/SVG11/painting.html#SpecifyingPaint
function isColor(value) {
    if (typeof value !== "string")
        return false;
    value = value.toLowerCase().trim();
    return (value === "none" ||
        value === "currentcolor" ||
        (value.startsWith("url(") && value.endsWith(")")) || // <funciri>, e.g. pattern or gradient
        (value.startsWith("var(") && value.endsWith(")")) || // CSS variable
        d3.color(value) !== null);
}
function isNoneish(value) {
    return value == null || isNone(value);
}
function isNone(value) {
    return /^\s*none\s*$/i.test(value);
}
function isRound(value) {
    return /^\s*round\s*$/i.test(value);
}
function maybeFrameAnchor(value = "middle") {
    return keyword(value, "frameAnchor", [
        "middle",
        "top-left",
        "top",
        "top-right",
        "right",
        "bottom-right",
        "bottom",
        "bottom-left",
        "left"
    ]);
}
// Like a sort comparator, returns a positive value if the given array of values
// is in ascending order, a negative value if the values are in descending
// order. Assumes monotonicity; only tests the first and last values.
function order(values) {
    if (values == null)
        return;
    const first = values[0];
    const last = values[values.length - 1];
    return d3.descending(first, last);
}
// Unlike {...defaults, ...options}, this ensures that any undefined (but
// present) properties in options inherit the given default value.
function inherit(options = {}, ...rest) {
    let o = options;
    for (const defaults of rest) {
        for (const key in defaults) {
            if (o[key] === undefined) {
                const value = defaults[key];
                if (o === options)
                    o = { ...o, [key]: value };
                else
                    o[key] = value;
            }
        }
    }
    return o;
}
// Given an iterable of named things (objects with a name property), returns a
// corresponding object with properties associated with the given name.
function Named(things) {
    console.warn("named iterables are deprecated; please use an object instead");
    const names = new Set();
    return Object.fromEntries(Array.from(things, (thing) => {
        const { name } = thing;
        if (name == null)
            throw new Error("missing name");
        const key = `${name}`;
        if (key === "__proto__")
            throw new Error(`illegal name: ${key}`);
        if (names.has(key))
            throw new Error(`duplicate name: ${key}`);
        names.add(key);
        return [name, thing];
    }));
}
function maybeNamed(things) {
    return isIterable(things) ? Named(things) : things;
}
function maybePickerCursor(picker) {
    return picker != null && picker.value && picker.value !== each ? "pointer" : null;
}

// Positional scales have associated axes, and for ordinal data, a point or band
// scale is used instead of an ordinal scale.
const position = Symbol("position");
// Color scales default to the turbo interpolator for quantitative data, and to
// the Tableau10 scheme for ordinal data. In the future, color scales may also
// have an associated legend.
const color = Symbol("color");
// Radius scales default to the sqrt type, have a default range of [0, 3], and a
// default domain from 0 to the median first quartile of associated channels.
const radius = Symbol("radius");
// Length scales default to the linear type, have a default range of [0, 12],
// and a default domain from 0 to the median median of associated channels.
const length = Symbol("length");
// Opacity scales have a default range of [0, 1], and a default domain from 0 to
// the maximum value of associated channels.
const opacity = Symbol("opacity");
// Symbol scales have a default range of d3.symbols.
const symbol = Symbol("symbol");
// TODO Rather than hard-coding the list of known scale names, collect the names
// and categories for each plot specification, so that custom marks can register
// custom scales.
const registry = new Map([
    ["x", position],
    ["y", position],
    ["fx", position],
    ["fy", position],
    ["r", radius],
    ["color", color],
    ["opacity", opacity],
    ["symbol", symbol],
    ["length", length]
]);

function defined(x) {
    return x != null && !Number.isNaN(x);
}
function ascendingDefined(a, b) {
    return +defined(b) - +defined(a) || d3.ascending(a, b);
}
function descendingDefined(a, b) {
    return +defined(b) - +defined(a) || d3.descending(a, b);
}
function nonempty(x) {
    return x != null && `${x}` !== "";
}
function finite(x) {
    return isFinite(x) ? x : NaN;
}
function positive(x) {
    return x > 0 && isFinite(x) ? x : NaN;
}
function negative(x) {
    return x < 0 && isFinite(x) ? x : NaN;
}

/** 
 * Given an *options* object that may specify some basic transforms (*filter*, *sort*, or *reverse*) or a custom *transform* function, composes those transforms if any with the given *transform* function, returning a new *options* object. If a custom *transform* function is present on the given *options*, any basic transforms are ignored. Any additional input *options* are passed through in the returned *options* object. This method facilitates applying the basic transforms prior to applying the given custom *transform* and is used internally by Plot’s built-in transforms.
 * 
 */
function basic(options = {}, transform) {
    let { filter: f1, sort: s1, reverse: r1, transform: t1, initializer: i1, ...remainingOptions } = options;
    // If both t1 and t2 are defined, returns a composite transform that first
    // applies t1 and then applies t2.
    if (t1 === undefined) {
        // explicit transform overrides filter, sort, and reverse
        if (f1 != null)
            t1 = filterTransform(f1);
        if (s1 != null && !isDomainSort(s1))
            t1 = composeTransform(t1, sortTransform(s1));
        if (r1)
            t1 = composeTransform(t1, reverseTransform);
    }
    if (transform != null && i1 != null)
        throw new Error("transforms cannot be applied after initializers");
    return {
        ...remainingOptions,
        ...((s1 === null || isDomainSort(s1)) && { sort: s1 }),
        transform: composeTransform(t1, transform)
    };
}
/** 
 * This helper composes the *initializer* function with any other transforms present in the *options*, and returns a new *options* object.
 * 
 */
function initializer(options = {}, initializer) {
    let { filter: f1, sort: s1, reverse: r1, initializer: i1, ...remainingOptions } = options;
    // If both i1 and i2 are defined, returns a composite initializer that first
    // applies i1 and then applies i2.
    if (i1 === undefined) {
        // explicit initializer overrides filter, sort, and reverse
        if (f1 != null)
            i1 = filterTransform(f1);
        if (s1 != null && !isDomainSort(s1))
            i1 = composeInitializer(i1, sortTransform(s1));
        if (r1)
            i1 = composeInitializer(i1, reverseTransform);
    }
    return {
        ...remainingOptions,
        ...((s1 === null || isDomainSort(s1)) && { sort: s1 }),
        initializer: composeInitializer(i1, initializer)
    };
}
function composeTransform(t1, t2) {
    if (t1 == null)
        return t2 === null ? undefined : t2;
    if (t2 == null)
        return t1 === null ? undefined : t1;
    return function (data, facets) {
        ({ data, facets } = t1.call(this, data, facets));
        return t2.call(this, arrayify(data), facets);
    };
}
function composeInitializer(i1, i2) {
    if (i1 == null)
        return i2 === null ? undefined : i2;
    if (i2 == null)
        return i1 === null ? undefined : i1;
    return function (data, facets, channels, ...args) {
        let c1, d1, f1, c2, d2, f2;
        ({ data: d1 = data, facets: f1 = facets, channels: c1 } = i1.call(this, data, facets, channels, ...args));
        ({ data: d2 = d1, facets: f2 = f1, channels: c2 } = i2.call(this, d1, f1, { ...channels, ...c1 }, ...args));
        return { data: d2, facets: f2, channels: { ...c1, ...c2 } };
    };
}
function apply(options, t) {
    return (options.initializer != null ? initializer : basic)(options, t);
}
/** 
 * ```js
 * Plot.filter(d => d.body_mass_g > 3000, options) // show data whose body mass is greater than 3kg
 * ```
 * 
 * Filters the data given the specified *test*. The test can be given as an accessor function (which receives the datum and index), or as a channel value definition such as a field name; truthy values are retained.
 * 
 */
function filter(test, options) {
    return apply(options, filterTransform(test));
}
function filterTransform(value) {
    return (data, facets) => {
        const V = valueof(data, value);
        return { data, facets: facets.map((I) => I.filter((i) => V[i])) };
    };
}
/** 
 * ```js
 * Plot.reverse(options) // reverse the input order
 * ```
 * 
 * Reverses the order of the data.
 * 
 */
function reverse(options) {
    return { ...apply(options, reverseTransform), sort: null };
}
function reverseTransform(data, facets) {
    return { data, facets: facets.map((I) => I.slice().reverse()) };
}
/** 
 * ```js
 * Plot.shuffle(options) // show data in random order
 * ```
 * 
 * Shuffles the data randomly. If a *seed* option is specified, a linear congruential generator with the given seed is used to generate random numbers deterministically; otherwise, Math.random is used.
 * 
 */
function shuffle(options = {}) {
    const { seed, ...remainingOptions } = options;
    return { ...apply(remainingOptions, sortValue(seed == null ? Math.random : d3.randomLcg(seed))), sort: null };
}
/** 
 * ```js
 * Plot.sort("body_mass_g", options) // show data in ascending body mass order
 * ```
 * 
 * Sorts the data by the specified *order*, which can be an accessor function, a comparator function, or a channel value definition such as a field name. See also [index sorting](https://github.com/observablehq/plot/blob/main/README.md#index-sorting), which allows marks to be sorted by a named channel, such as *r* for radius.
 * 
 */
function sort(order, options) {
    return {
        ...(isOptions(order) && order.channel !== undefined ? initializer : apply)(options, sortTransform(order)),
        sort: null
    };
}
function sortTransform(value) {
    return (typeof value === "function" && value.length !== 1 ? sortData : sortValue)(value);
}
function sortData(compare) {
    return (data, facets) => {
        const compareData = (i, j) => compare(data[i], data[j]);
        return { data, facets: facets.map((I) => I.slice().sort(compareData)) };
    };
}
function sortValue(value) {
    let channel, order;
    ({ channel, value, order = ascendingDefined } = { ...maybeValue(value) });
    if (typeof order !== "function") {
        switch (`${order}`.toLowerCase()) {
            case "ascending":
                order = ascendingDefined;
                break;
            case "descending":
                order = descendingDefined;
                break;
            default:
                throw new Error(`invalid order: ${order}`);
        }
    }
    return (data, facets, channels) => {
        let V;
        if (channel === undefined) {
            V = valueof(data, value);
        }
        else {
            if (channels === undefined)
                throw new Error("channel sort requires an initializer");
            V = channels[channel];
            if (!V)
                return {}; // ignore missing channel
            V = V.value;
        }
        const compareValue = (i, j) => order(V[i], V[j]);
        return { data, facets: facets.map((I) => I.slice().sort(compareValue)) };
    };
}

/** 
 * ```js
 * Plot.groupZ({x: "proportion"}, {fill: "species"})
 * ```
 * 
 * Groups on the first channel of *z*, *fill*, or *stroke*, if any. If none of *z*, *fill*, or *stroke* are channels, then all data (within each facet) is placed into a single group.
 * 
 */
function groupZ$1(outputs, options) {
    // Group on {z, fill, stroke}.
    return groupn(null, null, outputs, options);
}
/** 
 * ```js
 * Plot.groupX({y: "sum"}, {x: "species", y: "body_mass_g"})
 * ```
 * 
 * Groups on *x* and the first channel of *z*, *fill*, or *stroke*, if any.
 * 
 */
function groupX(outputs = { y: "count" }, options = {}) {
    // Group on {z, fill, stroke}, then on x.
    const { x = identity$1 } = options;
    if (x == null)
        throw new Error("missing channel: x");
    return groupn(x, null, outputs, options);
}
/** 
 * ```js
 * Plot.groupY({x: "sum"}, {y: "species", x: "body_mass_g"})
 * ```
 * 
 * Groups on *y* and the first channel of *z*, *fill*, or *stroke*, if any.
 * 
 */
function groupY(outputs = { x: "count" }, options = {}) {
    // Group on {z, fill, stroke}, then on y.
    const { y = identity$1 } = options;
    if (y == null)
        throw new Error("missing channel: y");
    return groupn(null, y, outputs, options);
}
/** 
 * ```js
 * Plot.group({fill: "count"}, {x: "island", y: "species"})
 * ```
 * 
 * Groups on *x*, *y*, and the first channel of *z*, *fill*, or *stroke*, if any.
 * 
 */
function group(outputs = { fill: "count" }, options = {}) {
    // Group on {z, fill, stroke}, then on x and y.
    let { x, y } = options;
    [x, y] = maybeTuple(x, y);
    if (x == null)
        throw new Error("missing channel: x");
    if (y == null)
        throw new Error("missing channel: y");
    return groupn(x, y, outputs, options);
}
function groupn(x, // optionally group on x
y, // optionally group on y
{ data: reduceData = reduceIdentity, filter, sort, reverse, ...outputs // output channel definitions
 } = {}, inputs = {} // input channels and options
) {
    // Compute the outputs.
    outputs = maybeOutputs(outputs, inputs);
    reduceData = maybeReduce$1(reduceData, identity$1);
    sort = sort == null ? undefined : maybeOutput("sort", sort, inputs);
    filter = filter == null ? undefined : maybeEvaluator("filter", filter, inputs);
    // Produce x and y output channels as appropriate.
    const [GX, setGX] = maybeColumn(x);
    const [GY, setGY] = maybeColumn(y);
    // Greedily materialize the z, fill, and stroke channels (if channels and not
    // constants) so that we can reference them for subdividing groups without
    // computing them more than once.
    const { z, fill, stroke, x1, x2, // consumed if x is an output
    y1, y2, // consumed if y is an output
    ...options } = inputs;
    const [GZ, setGZ] = maybeColumn(z);
    const [vfill] = maybeColorChannel(fill);
    const [vstroke] = maybeColorChannel(stroke);
    const [GF, setGF] = maybeColumn(vfill);
    const [GS, setGS] = maybeColumn(vstroke);
    return {
        ...("z" in inputs && { z: GZ || z }),
        ...("fill" in inputs && { fill: GF || fill }),
        ...("stroke" in inputs && { stroke: GS || stroke }),
        ...basic(options, (data, facets) => {
            const X = valueof(data, x);
            const Y = valueof(data, y);
            const Z = valueof(data, z);
            const F = valueof(data, vfill);
            const S = valueof(data, vstroke);
            const G = maybeSubgroup(outputs, { z: Z, fill: F, stroke: S });
            const groupFacets = [];
            const groupData = [];
            const GX = X && setGX([]);
            const GY = Y && setGY([]);
            const GZ = Z && setGZ([]);
            const GF = F && setGF([]);
            const GS = S && setGS([]);
            let i = 0;
            for (const o of outputs)
                o.initialize(data);
            if (sort)
                sort.initialize(data);
            if (filter)
                filter.initialize(data);
            for (const facet of facets) {
                const groupFacet = [];
                for (const o of outputs)
                    o.scope("facet", facet);
                if (sort)
                    sort.scope("facet", facet);
                if (filter)
                    filter.scope("facet", facet);
                for (const [f, I] of maybeGroup(facet, G)) {
                    for (const [y, gg] of maybeGroup(I, Y)) {
                        for (const [x, g] of maybeGroup(gg, X)) {
                            if (filter && !filter.reduce(g))
                                continue;
                            groupFacet.push(i++);
                            groupData.push(reduceData.reduce(g, data));
                            if (X)
                                GX.push(x);
                            if (Y)
                                GY.push(y);
                            if (Z)
                                GZ.push(G === Z ? f : Z[g[0]]);
                            if (F)
                                GF.push(G === F ? f : F[g[0]]);
                            if (S)
                                GS.push(G === S ? f : S[g[0]]);
                            for (const o of outputs)
                                o.reduce(g);
                            if (sort)
                                sort.reduce(g);
                        }
                    }
                }
                groupFacets.push(groupFacet);
            }
            maybeSort(groupFacets, sort, reverse);
            return { data: groupData, facets: groupFacets };
        }),
        ...(!hasOutput(outputs, "x") && (GX ? { x: GX } : { x1, x2 })),
        ...(!hasOutput(outputs, "y") && (GY ? { y: GY } : { y1, y2 })),
        ...Object.fromEntries(outputs.map(({ name, output }) => [name, output]))
    };
}
function hasOutput(outputs, ...names) {
    for (const { name } of outputs) {
        if (names.includes(name)) {
            return true;
        }
    }
    return false;
}
function maybeOutputs(outputs, inputs) {
    const entries = Object.entries(outputs);
    // Propagate standard mark channels by default.
    if (inputs.title != null && outputs.title === undefined)
        entries.push(["title", reduceTitle]);
    if (inputs.href != null && outputs.href === undefined)
        entries.push(["href", reduceFirst$1]);
    return entries.map(([name, reduce]) => {
        return reduce == null ? { name, initialize() { }, scope() { }, reduce() { } } : maybeOutput(name, reduce, inputs);
    });
}
function maybeOutput(name, reduce, inputs) {
    const evaluator = maybeEvaluator(name, reduce, inputs);
    const [output, setOutput] = column(evaluator.label);
    let O;
    return {
        name,
        output,
        initialize(data) {
            evaluator.initialize(data);
            O = setOutput([]);
        },
        scope(scope, I) {
            evaluator.scope(scope, I);
        },
        reduce(I, extent) {
            O.push(evaluator.reduce(I, extent));
        }
    };
}
function maybeEvaluator(name, reduce, inputs) {
    const input = maybeInput(name, inputs);
    const reducer = maybeReduce$1(reduce, input);
    let V, context;
    return {
        label: labelof(reducer === reduceCount ? null : input, reducer.label),
        initialize(data) {
            V = input === undefined ? data : valueof(data, input);
            if (reducer.scope === "data") {
                context = reducer.reduce(range(data), V);
            }
        },
        scope(scope, I) {
            if (reducer.scope === scope) {
                context = reducer.reduce(I, V);
            }
        },
        reduce(I, extent) {
            return reducer.scope == null ? reducer.reduce(I, V, extent) : reducer.reduce(I, V, context, extent);
        }
    };
}
function maybeGroup(I, X) {
    return X
        ? d3.sort(d3.group(I, (i) => X[i]), first)
        : [[, I]];
}
function maybeReduce$1(reduce, value) {
    if (reduce && typeof reduce.reduce === "function")
        return reduce;
    if (typeof reduce === "function")
        return reduceFunction(reduce);
    if (/^p\d{2}$/i.test(reduce))
        return reduceAccessor(percentile(reduce));
    switch (`${reduce}`.toLowerCase()) {
        case "first":
            return reduceFirst$1;
        case "last":
            return reduceLast$1;
        case "count":
            return reduceCount;
        case "distinct":
            return reduceDistinct;
        case "sum":
            return value == null ? reduceCount : reduceSum$1;
        case "proportion":
            return reduceProportion(value, "data");
        case "proportion-facet":
            return reduceProportion(value, "facet");
        case "deviation":
            return reduceAccessor(d3.deviation);
        case "min":
            return reduceAccessor(d3.min);
        case "min-index":
            return reduceAccessor(d3.minIndex);
        case "max":
            return reduceAccessor(d3.max);
        case "max-index":
            return reduceAccessor(d3.maxIndex);
        case "mean":
            return reduceMaybeTemporalAccessor(d3.mean);
        case "median":
            return reduceMaybeTemporalAccessor(d3.median);
        case "variance":
            return reduceAccessor(d3.variance);
        case "mode":
            return reduceAccessor(d3.mode);
        case "x":
            return reduceX;
        case "x1":
            return reduceX1;
        case "x2":
            return reduceX2;
        case "y":
            return reduceY;
        case "y1":
            return reduceY1;
        case "y2":
            return reduceY2;
    }
    throw new Error(`invalid reduce: ${reduce}`);
}
function maybeSubgroup(outputs, inputs) {
    for (const name in inputs) {
        const value = inputs[name];
        if (value !== undefined && !outputs.some((o) => o.name === name)) {
            return value;
        }
    }
}
function maybeSort(facets, sort, reverse) {
    if (sort) {
        const S = sort.output.transform();
        const compare = (i, j) => ascendingDefined(S[i], S[j]);
        facets.forEach((f) => f.sort(compare));
    }
    if (reverse) {
        facets.forEach((f) => f.reverse());
    }
}
function reduceFunction(f) {
    return {
        reduce(I, X, extent) {
            return f(take(X, I), extent);
        }
    };
}
function reduceAccessor(f) {
    return {
        reduce(I, X) {
            return f(I, (i) => X[i]);
        }
    };
}
function reduceMaybeTemporalAccessor(f) {
    return {
        reduce(I, X) {
            const x = f(I, (i) => X[i]);
            return isTemporal(X) ? new Date(x) : x;
        }
    };
}
const reduceIdentity = {
    reduce(I, X) {
        return take(X, I);
    }
};
const reduceFirst$1 = {
    reduce(I, X) {
        return X[I[0]];
    }
};
const reduceTitle = {
    reduce(I, X) {
        const n = 5;
        const groups = d3.sort(d3.rollup(I, (V) => V.length, (i) => X[i]), second);
        const top = groups.slice(-n).reverse();
        if (top.length < groups.length) {
            const bottom = groups.slice(0, 1 - n);
            top[n - 1] = [`… ${bottom.length.toLocaleString("en-US")} more`, d3.sum(bottom, second)];
        }
        return top.map(([key, value]) => `${key} (${value.toLocaleString("en-US")})`).join("\n");
    }
};
const reduceLast$1 = {
    reduce(I, X) {
        return X[I[I.length - 1]];
    }
};
const reduceCount = {
    label: "Frequency",
    reduce(I) {
        return I.length;
    }
};
const reduceDistinct = {
    label: "Distinct",
    reduce: (I, X) => {
        const s = new d3.InternSet();
        for (const i of I)
            s.add(X[i]);
        return s.size;
    }
};
const reduceSum$1 = reduceAccessor(d3.sum);
function reduceProportion(value, scope) {
    return value == null
        ? { scope, label: "Frequency", reduce: (I, V, basis = 1) => I.length / basis }
        : { scope, reduce: (I, V, basis = 1) => d3.sum(I, (i) => V[i]) / basis };
}
function mid(x1, x2) {
    const m = (+x1 + +x2) / 2;
    return x1 instanceof Date ? new Date(m) : m;
}
const reduceX = {
    reduce(I, X, { x1, x2 }) {
        return mid(x1, x2);
    }
};
const reduceY = {
    reduce(I, X, { y1, y2 }) {
        return mid(y1, y2);
    }
};
const reduceX1 = {
    reduce(I, X, { x1 }) {
        return x1;
    }
};
const reduceX2 = {
    reduce(I, X, { x2 }) {
        return x2;
    }
};
const reduceY1 = {
    reduce(I, X, { y1 }) {
        return y1;
    }
};
const reduceY2 = {
    reduce(I, X, { y2 }) {
        return y2;
    }
};

// TODO Type coercion?
function Channel(data, { scale, type, value, filter, hint }) {
    return {
        scale,
        type,
        value: valueof(data, value),
        label: labelof(value),
        filter,
        hint
    };
}
function Channels(descriptors, data) {
    return Object.fromEntries(Object.entries(descriptors).map(([name, channel]) => [name, Channel(data, channel)]));
}
// TODO Use Float64Array for scales with numeric ranges, e.g. position?
function valueObject(channels, scales) {
    return Object.fromEntries(Object.entries(channels).map(([name, { scale: scaleName, value }]) => {
        let scale;
        if (scaleName !== undefined) {
            scale = scales[scaleName];
        }
        return [name, scale === undefined ? value : map$1(value, scale)];
    }));
}
// Note: mutates channel.domain! This is set to a function so that it is lazily
// computed; i.e., if the scale’s domain is set explicitly, that takes priority
// over the sort option, and we don’t need to do additional work.
function channelDomain(channels, facetChannels, data, options) {
    const { reverse: defaultReverse, reduce: defaultReduce = true, limit: defaultLimit } = options;
    for (const x in options) {
        if (!registry.has(x))
            continue; // ignore unknown scale keys (including generic options)
        let { value: y, reverse = defaultReverse, reduce = defaultReduce, limit = defaultLimit } = maybeValue(options[x]);
        if (reverse === undefined)
            reverse = y === "width" || y === "height"; // default to descending for lengths
        if (reduce == null || reduce === false)
            continue; // disabled reducer
        const X = findScaleChannel(channels, x) || (facetChannels && findScaleChannel(facetChannels, x));
        if (!X)
            throw new Error(`missing channel for scale: ${x}`);
        const XV = X.value;
        const [lo = 0, hi = Infinity] = isIterable(limit) ? limit : limit < 0 ? [limit] : [0, limit];
        if (y == null) {
            X.domain = () => {
                let domain = XV;
                if (reverse)
                    domain = domain.slice().reverse();
                if (lo !== 0 || hi !== Infinity)
                    domain = domain.slice(lo, hi);
                return domain;
            };
        }
        else {
            const YV = y === "data"
                ? data
                : y === "height"
                    ? difference(channels, "y1", "y2")
                    : y === "width"
                        ? difference(channels, "x1", "x2")
                        : values(channels, y, y === "y" ? "y2" : y === "x" ? "x2" : undefined);
            const reducer = maybeReduce$1(reduce === true ? "max" : reduce, YV);
            X.domain = () => {
                let domain = d3.rollup(range(XV), (I) => reducer.reduce(I, YV), (i) => XV[i]);
                domain = d3.sort(domain, reverse ? descendingGroup : ascendingGroup);
                if (lo !== 0 || hi !== Infinity)
                    domain = domain.slice(lo, hi);
                return domain.map(first);
            };
        }
    }
}
function findScaleChannel(channels, scale) {
    for (const name in channels) {
        const channel = channels[name];
        if (channel.scale === scale)
            return channel;
    }
}
function difference(channels, k1, k2) {
    const X1 = values(channels, k1);
    const X2 = values(channels, k2);
    return map$1(X2, (x2, i) => Math.abs(x2 - X1[i]), Float64Array);
}
function values(channels, name, alias) {
    let channel = channels[name];
    if (!channel && alias !== undefined)
        channel = channels[alias];
    if (channel)
        return channel.value;
    throw new Error(`missing channel: ${name}`);
}
function ascendingGroup([ak, av], [bk, bv]) {
    return d3.ascending(av, bv) || d3.ascending(ak, bk);
}
function descendingGroup([ak, av], [bk, bv]) {
    return d3.descending(av, bv) || d3.ascending(ak, bk);
}

const ordinalSchemes = new Map([
    // categorical
    ["accent", d3.schemeAccent],
    ["category10", d3.schemeCategory10],
    ["dark2", d3.schemeDark2],
    ["paired", d3.schemePaired],
    ["pastel1", d3.schemePastel1],
    ["pastel2", d3.schemePastel2],
    ["set1", d3.schemeSet1],
    ["set2", d3.schemeSet2],
    ["set3", d3.schemeSet3],
    ["tableau10", d3.schemeTableau10],
    // diverging
    ["brbg", scheme11(d3.schemeBrBG, d3.interpolateBrBG)],
    ["prgn", scheme11(d3.schemePRGn, d3.interpolatePRGn)],
    ["piyg", scheme11(d3.schemePiYG, d3.interpolatePiYG)],
    ["puor", scheme11(d3.schemePuOr, d3.interpolatePuOr)],
    ["rdbu", scheme11(d3.schemeRdBu, d3.interpolateRdBu)],
    ["rdgy", scheme11(d3.schemeRdGy, d3.interpolateRdGy)],
    ["rdylbu", scheme11(d3.schemeRdYlBu, d3.interpolateRdYlBu)],
    ["rdylgn", scheme11(d3.schemeRdYlGn, d3.interpolateRdYlGn)],
    ["spectral", scheme11(d3.schemeSpectral, d3.interpolateSpectral)],
    // reversed diverging (for temperature data)
    ["burd", scheme11r(d3.schemeRdBu, d3.interpolateRdBu)],
    ["buylrd", scheme11r(d3.schemeRdYlBu, d3.interpolateRdYlBu)],
    // sequential (single-hue)
    ["blues", scheme9(d3.schemeBlues, d3.interpolateBlues)],
    ["greens", scheme9(d3.schemeGreens, d3.interpolateGreens)],
    ["greys", scheme9(d3.schemeGreys, d3.interpolateGreys)],
    ["oranges", scheme9(d3.schemeOranges, d3.interpolateOranges)],
    ["purples", scheme9(d3.schemePurples, d3.interpolatePurples)],
    ["reds", scheme9(d3.schemeReds, d3.interpolateReds)],
    // sequential (multi-hue)
    ["turbo", schemei(d3.interpolateTurbo)],
    ["viridis", schemei(d3.interpolateViridis)],
    ["magma", schemei(d3.interpolateMagma)],
    ["inferno", schemei(d3.interpolateInferno)],
    ["plasma", schemei(d3.interpolatePlasma)],
    ["cividis", schemei(d3.interpolateCividis)],
    ["cubehelix", schemei(d3.interpolateCubehelixDefault)],
    ["warm", schemei(d3.interpolateWarm)],
    ["cool", schemei(d3.interpolateCool)],
    ["bugn", scheme9(d3.schemeBuGn, d3.interpolateBuGn)],
    ["bupu", scheme9(d3.schemeBuPu, d3.interpolateBuPu)],
    ["gnbu", scheme9(d3.schemeGnBu, d3.interpolateGnBu)],
    ["orrd", scheme9(d3.schemeOrRd, d3.interpolateOrRd)],
    ["pubu", scheme9(d3.schemePuBu, d3.interpolatePuBu)],
    ["pubugn", scheme9(d3.schemePuBuGn, d3.interpolatePuBuGn)],
    ["purd", scheme9(d3.schemePuRd, d3.interpolatePuRd)],
    ["rdpu", scheme9(d3.schemeRdPu, d3.interpolateRdPu)],
    ["ylgn", scheme9(d3.schemeYlGn, d3.interpolateYlGn)],
    ["ylgnbu", scheme9(d3.schemeYlGnBu, d3.interpolateYlGnBu)],
    ["ylorbr", scheme9(d3.schemeYlOrBr, d3.interpolateYlOrBr)],
    ["ylorrd", scheme9(d3.schemeYlOrRd, d3.interpolateYlOrRd)],
    // cyclical
    ["rainbow", schemeicyclical(d3.interpolateRainbow)],
    ["sinebow", schemeicyclical(d3.interpolateSinebow)]
]);
function scheme9(scheme, interpolate) {
    return ({ length: n }) => {
        if (n === 1)
            return [scheme[3][1]]; // favor midpoint
        if (n === 2)
            return [scheme[3][1], scheme[3][2]]; // favor darker
        n = Math.max(3, Math.floor(n));
        return n > 9 ? d3.quantize(interpolate, n) : scheme[n];
    };
}
function scheme11(scheme, interpolate) {
    return ({ length: n }) => {
        if (n === 2)
            return [scheme[3][0], scheme[3][2]]; // favor diverging extrema
        n = Math.max(3, Math.floor(n));
        return n > 11 ? d3.quantize(interpolate, n) : scheme[n];
    };
}
function scheme11r(scheme, interpolate) {
    return ({ length: n }) => {
        if (n === 2)
            return [scheme[3][2], scheme[3][0]]; // favor diverging extrema
        n = Math.max(3, Math.floor(n));
        return n > 11 ? d3.quantize((t) => interpolate(1 - t), n) : scheme[n].slice().reverse();
    };
}
function schemei(interpolate) {
    return ({ length: n }) => d3.quantize(interpolate, Math.max(2, Math.floor(n)));
}
function schemeicyclical(interpolate) {
    return ({ length: n }) => d3.quantize(interpolate, Math.floor(n) + 1).slice(0, -1);
}
function ordinalScheme(scheme) {
    const s = `${scheme}`.toLowerCase();
    if (!ordinalSchemes.has(s))
        throw new Error(`unknown ordinal scheme: ${s}`);
    return ordinalSchemes.get(s);
}
function ordinalRange(scheme, length) {
    const s = ordinalScheme(scheme);
    const r = typeof s === "function" ? s({ length }) : s;
    return r.length !== length ? r.slice(0, length) : r;
}
// If the specified domain contains only booleans (ignoring null and undefined),
// returns a corresponding range where false is mapped to the low color and true
// is mapped to the high color of the specified scheme.
function maybeBooleanRange(domain, scheme = "greys") {
    const range = new Set();
    const [f, t] = ordinalRange(scheme, 2);
    for (const value of domain) {
        if (value == null)
            continue;
        if (value === true)
            range.add(t);
        else if (value === false)
            range.add(f);
        else
            return;
    }
    return [...range];
}
const quantitativeSchemes = new Map([
    // diverging
    ["brbg", d3.interpolateBrBG],
    ["prgn", d3.interpolatePRGn],
    ["piyg", d3.interpolatePiYG],
    ["puor", d3.interpolatePuOr],
    ["rdbu", d3.interpolateRdBu],
    ["rdgy", d3.interpolateRdGy],
    ["rdylbu", d3.interpolateRdYlBu],
    ["rdylgn", d3.interpolateRdYlGn],
    ["spectral", d3.interpolateSpectral],
    // reversed diverging (for temperature data)
    ["burd", (t) => d3.interpolateRdBu(1 - t)],
    ["buylrd", (t) => d3.interpolateRdYlBu(1 - t)],
    // sequential (single-hue)
    ["blues", d3.interpolateBlues],
    ["greens", d3.interpolateGreens],
    ["greys", d3.interpolateGreys],
    ["purples", d3.interpolatePurples],
    ["reds", d3.interpolateReds],
    ["oranges", d3.interpolateOranges],
    // sequential (multi-hue)
    ["turbo", d3.interpolateTurbo],
    ["viridis", d3.interpolateViridis],
    ["magma", d3.interpolateMagma],
    ["inferno", d3.interpolateInferno],
    ["plasma", d3.interpolatePlasma],
    ["cividis", d3.interpolateCividis],
    ["cubehelix", d3.interpolateCubehelixDefault],
    ["warm", d3.interpolateWarm],
    ["cool", d3.interpolateCool],
    ["bugn", d3.interpolateBuGn],
    ["bupu", d3.interpolateBuPu],
    ["gnbu", d3.interpolateGnBu],
    ["orrd", d3.interpolateOrRd],
    ["pubugn", d3.interpolatePuBuGn],
    ["pubu", d3.interpolatePuBu],
    ["purd", d3.interpolatePuRd],
    ["rdpu", d3.interpolateRdPu],
    ["ylgnbu", d3.interpolateYlGnBu],
    ["ylgn", d3.interpolateYlGn],
    ["ylorbr", d3.interpolateYlOrBr],
    ["ylorrd", d3.interpolateYlOrRd],
    // cyclical
    ["rainbow", d3.interpolateRainbow],
    ["sinebow", d3.interpolateSinebow]
]);
function quantitativeScheme(scheme) {
    const s = `${scheme}`.toLowerCase();
    if (!quantitativeSchemes.has(s))
        throw new Error(`unknown quantitative scheme: ${s}`);
    return quantitativeSchemes.get(s);
}
const divergingSchemes = new Set([
    "brbg",
    "prgn",
    "piyg",
    "puor",
    "rdbu",
    "rdgy",
    "rdylbu",
    "rdylgn",
    "spectral",
    "burd",
    "buylrd"
]);
function isDivergingScheme(scheme) {
    return scheme != null && divergingSchemes.has(`${scheme}`.toLowerCase());
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function memoize1(compute) {
    let cacheValue, cacheKeys;
    return (...keys) => {
        if (cacheKeys?.length !== keys.length || cacheKeys.some((k, i) => k !== keys[i])) {
            cacheKeys = keys;
            cacheValue = compute(...keys);
        }
        return cacheValue;
    };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const numberFormat = memoize1((locale) => new Intl.NumberFormat(locale));
const monthFormat = memoize1((locale, month) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...(month && { month }) }));
const weekdayFormat = memoize1((locale, weekday) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...(weekday && { weekday }) }));
function formatNumber(locale = "en-US") {
    const format = numberFormat(locale);
    return (i) => (i != null && !isNaN(i) ? format.format(i) : undefined);
}
/** 
 * ```js
 * Plot.formatMonth("es-MX", "long")(0) // "enero"
 * ```
 * 
 * Returns a function that formats a given month number (from 0 = January to 11 = December) according to the specified *locale* and *format*. The *locale* is a [BCP 47 language tag](https://tools.ietf.org/html/bcp47) and defaults to U.S. English. The *format* is a [month format](https://tc39.es/ecma402/#datetimeformat-objects): either *2-digit*, *numeric*, *narrow*, *short*, *long*; if not specified, it defaults to *short*.
 * 
 */
function formatMonth(locale = "en-US", format = "short") {
    const fmt = monthFormat(locale, format);
    return (i) => i != null && !isNaN((i = +new Date(Date.UTC(2000, +i)))) ? fmt.format(i) : undefined;
}
/** 
 * ```js
 * Plot.formatWeekday("es-MX", "long")(0) // "domingo"
 * ```
 * 
 * Returns a function that formats a given week day number (from 0 = Sunday to 6 = Saturday) according to the specified *locale* and *format*. The *locale* is a [BCP 47 language tag](https://tools.ietf.org/html/bcp47) and defaults to U.S. English. The *format* is a [weekday format](https://tc39.es/ecma402/#datetimeformat-objects): either *narrow*, *short*, or *long*; if not specified, it defaults to *short*.
 * 
 */
function formatWeekday(locale = "en-US", format = "short") {
    const fmt = weekdayFormat(locale, format);
    return (i) => i != null && !isNaN((i = +new Date(Date.UTC(2001, 0, +i)))) ? fmt.format(i) : undefined;
}
/** 
 * ```js
 * Plot.formatIsoDate(new Date("2020-01-01T00:00.000Z")) // "2020-01-01"
 * ```
 * 
 * Given a *date*, returns the shortest equivalent ISO 8601 UTC string. If the given *date* is not valid, returns `"Invalid Date"`.
 * 
 */
function formatIsoDate(date) {
    return format(date, "Invalid Date");
}
function formatAuto(locale = "en-US") {
    const number = formatNumber(locale);
    return (v) => (v instanceof Date ? formatIsoDate : typeof v === "number" ? number : string)(v);
}
// TODO When Plot supports a top-level locale option, this should be removed
// because it lacks context to know which locale to use; formatAuto should be
// used instead whenever possible.
const formatDefault = formatAuto();

let warnings = 0;
function consumeWarnings() {
    const w = warnings;
    warnings = 0;
    return w;
}
function warn(message) {
    console.warn(message);
    ++warnings;
}

const offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5;
let nextClipId = 0;
function getClipId() {
    return `plot-clip-${++nextClipId}`;
}
function styles(mark, { title, href, ariaLabel: variaLabel, ariaDescription, ariaHidden, target, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, strokeLinejoin, strokeLinecap, strokeMiterlimit, strokeDasharray, strokeDashoffset, opacity, mixBlendMode, paintOrder, pointerEvents, shapeRendering }, { ariaLabel: cariaLabel, fill: defaultFill = "currentColor", fillOpacity: defaultFillOpacity, stroke: defaultStroke = "none", strokeOpacity: defaultStrokeOpacity, strokeWidth: defaultStrokeWidth, strokeLinecap: defaultStrokeLinecap, strokeLinejoin: defaultStrokeLinejoin, strokeMiterlimit: defaultStrokeMiterlimit, paintOrder: defaultPaintOrder }) {
    // Some marks don’t support fill (e.g., tick and rule).
    if (defaultFill === null) {
        fill = null;
        fillOpacity = null;
    }
    // Some marks don’t support stroke (e.g., image).
    if (defaultStroke === null) {
        stroke = null;
        strokeOpacity = null;
    }
    // Some marks default to fill with no stroke, while others default to stroke
    // with no fill. For example, bar and area default to fill, while dot and line
    // default to stroke. For marks that fill by default, the default fill only
    // applies if the stroke is (constant) none; if you set a stroke, then the
    // default fill becomes none. Similarly for marks that stroke by stroke, the
    // default stroke only applies if the fill is (constant) none.
    if (isNoneish(defaultFill)) {
        if (!isNoneish(defaultStroke) && !isNoneish(fill))
            defaultStroke = "none";
    }
    else {
        if (isNoneish(defaultStroke) && !isNoneish(stroke))
            defaultFill = "none";
    }
    const [vfill, cfill] = maybeColorChannel(fill, defaultFill);
    const [vfillOpacity, cfillOpacity] = maybeNumberChannel(fillOpacity, defaultFillOpacity);
    const [vstroke, cstroke] = maybeColorChannel(stroke, defaultStroke);
    const [vstrokeOpacity, cstrokeOpacity] = maybeNumberChannel(strokeOpacity, defaultStrokeOpacity);
    const [vopacity, copacity] = maybeNumberChannel(opacity);
    // For styles that have no effect if there is no stroke, only apply the
    // defaults if the stroke is not the constant none. (If stroke is a channel,
    // then cstroke will be undefined, but there’s still a stroke; hence we don’t
    // use isNoneish here.)
    if (!isNone(cstroke)) {
        if (strokeWidth === undefined)
            strokeWidth = defaultStrokeWidth;
        if (strokeLinecap === undefined)
            strokeLinecap = defaultStrokeLinecap;
        if (strokeLinejoin === undefined)
            strokeLinejoin = defaultStrokeLinejoin;
        // The default stroke miterlimit need not be applied if the current stroke
        // is the constant round; this only has effect on miter joins.
        if (strokeMiterlimit === undefined && !isRound(strokeLinejoin))
            strokeMiterlimit = defaultStrokeMiterlimit;
        // The paint order only takes effect if there is both a fill and a stroke
        // (at least if we ignore markers, which no built-in marks currently use).
        if (!isNone(cfill) && paintOrder === undefined)
            paintOrder = defaultPaintOrder;
    }
    const [vstrokeWidth, cstrokeWidth] = maybeNumberChannel(strokeWidth);
    // Some marks don’t support fill (e.g., tick and rule).
    if (defaultFill !== null) {
        mark.fill = impliedString(cfill, "currentColor");
        mark.fillOpacity = impliedNumber(cfillOpacity, 1);
    }
    // Some marks don’t support stroke (e.g., image).
    if (defaultStroke !== null) {
        mark.stroke = impliedString(cstroke, "none");
        mark.strokeWidth = impliedNumber(cstrokeWidth, 1);
        mark.strokeOpacity = impliedNumber(cstrokeOpacity, 1);
        mark.strokeLinejoin = impliedString(strokeLinejoin, "miter");
        mark.strokeLinecap = impliedString(strokeLinecap, "butt");
        mark.strokeMiterlimit = impliedNumber(strokeMiterlimit, 4);
        mark.strokeDasharray = impliedString(strokeDasharray, "none");
        mark.strokeDashoffset = impliedString(strokeDashoffset, "0");
    }
    mark.target = string(target);
    mark.ariaLabel = string(cariaLabel);
    mark.ariaDescription = string(ariaDescription);
    mark.ariaHidden = string(ariaHidden);
    mark.opacity = impliedNumber(copacity, 1);
    mark.mixBlendMode = impliedString(mixBlendMode, "normal");
    mark.paintOrder = impliedString(paintOrder, "normal");
    mark.pointerEvents = impliedString(pointerEvents, "auto");
    mark.shapeRendering = impliedString(shapeRendering, "auto");
    return {
        title: { value: title, optional: true },
        href: { value: href, optional: true },
        ariaLabel: { value: variaLabel, optional: true },
        fill: { value: vfill, scale: "color", optional: true },
        fillOpacity: { value: vfillOpacity, scale: "opacity", optional: true },
        stroke: { value: vstroke, scale: "color", optional: true },
        strokeOpacity: { value: vstrokeOpacity, scale: "opacity", optional: true },
        strokeWidth: { value: vstrokeWidth, optional: true },
        opacity: { value: vopacity, scale: "opacity", optional: true }
    };
}
// Applies the specified titles via selection.call.
function applyTitle(selection, L) {
    if (L)
        selection
            .filter((i) => nonempty(L[i]))
            .append("title")
            .call(applyText, L);
}
// Like applyTitle, but for grouped data (lines, areas).
function applyTitleGroup(selection, L) {
    if (L)
        selection
            .filter(([i]) => nonempty(L[i]))
            .append("title")
            .call(applyTextGroup, L);
}
function applyText(selection, T) {
    if (T)
        selection.text((i) => formatDefault(T[i]));
}
function applyTextGroup(selection, T) {
    if (T)
        selection.text(([i]) => formatDefault(T[i]));
}
function applyChannelStyles(selection, { target }, { ariaLabel: AL, title: T, fill: F, fillOpacity: FO, stroke: S, strokeOpacity: SO, strokeWidth: SW, opacity: O, href: H }) {
    if (AL)
        applyAttr(selection, "aria-label", (i) => AL[i]);
    if (F)
        applyAttr(selection, "fill", (i) => F[i]);
    if (FO)
        applyAttr(selection, "fill-opacity", (i) => FO[i]);
    if (S)
        applyAttr(selection, "stroke", (i) => S[i]);
    if (SO)
        applyAttr(selection, "stroke-opacity", (i) => SO[i]);
    if (SW)
        applyAttr(selection, "stroke-width", (i) => SW[i]);
    if (O)
        applyAttr(selection, "opacity", (i) => O[i]);
    if (H)
        applyHref(selection, (i) => H[i], target);
    applyTitle(selection, T);
}
function applyGroupedChannelStyles(selection, { target }, { ariaLabel: AL, title: T, fill: F, fillOpacity: FO, stroke: S, strokeOpacity: SO, strokeWidth: SW, opacity: O, href: H }) {
    if (AL)
        applyAttr(selection, "aria-label", ([i]) => AL[i]);
    if (F)
        applyAttr(selection, "fill", ([i]) => F[i]);
    if (FO)
        applyAttr(selection, "fill-opacity", ([i]) => FO[i]);
    if (S)
        applyAttr(selection, "stroke", ([i]) => S[i]);
    if (SO)
        applyAttr(selection, "stroke-opacity", ([i]) => SO[i]);
    if (SW)
        applyAttr(selection, "stroke-width", ([i]) => SW[i]);
    if (O)
        applyAttr(selection, "opacity", ([i]) => O[i]);
    if (H)
        applyHref(selection, ([i]) => H[i], target);
    applyTitleGroup(selection, T);
}
function groupAesthetics({ ariaLabel: AL, title: T, fill: F, fillOpacity: FO, stroke: S, strokeOpacity: SO, strokeWidth: SW, opacity: O, href: H }) {
    return [AL, T, F, FO, S, SO, SW, O, H].filter((c) => c !== undefined);
}
function groupZ(I, Z, z) {
    const G = d3.group(I, (i) => Z[i]);
    if (z === undefined && G.size > I.length >> 1) {
        warn(`Warning: the implicit z channel has high cardinality. This may occur when the fill or stroke channel is associated with quantitative data rather than ordinal or categorical data. You can suppress this warning by setting the z option explicitly; if this data represents a single series, set z to null.`);
    }
    return G.values();
}
function* groupIndex(I, position, { z }, channels) {
    const { z: Z } = channels; // group channel
    const A = groupAesthetics(channels); // aesthetic channels
    const C = [...position, ...A]; // all channels
    // Group the current index by Z (if any).
    for (const G of Z ? groupZ(I, Z, z) : [I]) {
        let Ag; // the A-values (aesthetics) of the current group, if any
        let Gg; // the current group index (a subset of G, and I), if any
        out: for (const i of G) {
            // If any channel has an undefined value for this index, skip it.
            for (const c of C) {
                if (!defined(c[i])) {
                    if (Gg)
                        Gg.push(-1);
                    continue out;
                }
            }
            // Otherwise, if this is a new group, record the aesthetics for this
            // group. Yield the current group and start a new one.
            if (Ag === undefined) {
                if (Gg)
                    yield Gg;
                (Ag = A.map((c) => keyof(c[i]))), (Gg = [i]);
                continue;
            }
            // Otherwise, add the current index to the current group. Then, if any of
            // the aesthetics don’t match the current group, yield the current group
            // and start a new group of the current index.
            Gg.push(i);
            for (let j = 0; j < A.length; ++j) {
                const k = keyof(A[j][i]);
                if (k !== Ag[j]) {
                    yield Gg;
                    (Ag = A.map((c) => keyof(c[i]))), (Gg = [i]);
                    continue out;
                }
            }
        }
        // Yield the current group, if any.
        if (Gg)
            yield Gg;
    }
}
// TODO Accept other types of clips (paths, urls, x, y, other marks…)?
// https://github.com/observablehq/plot/issues/181
function maybeClip(clip) {
    if (clip === true)
        clip = "frame";
    else if (clip === false)
        clip = null;
    return maybeKeyword(clip, "clip", ["frame", "sphere"]);
}
function applyIndirectStyles(selection, mark, scales, dimensions, context) {
    applyAttr(selection, "aria-label", mark.ariaLabel);
    applyAttr(selection, "aria-description", mark.ariaDescription);
    applyAttr(selection, "aria-hidden", mark.ariaHidden);
    applyAttr(selection, "fill", mark.fill);
    applyAttr(selection, "fill-opacity", mark.fillOpacity);
    applyAttr(selection, "stroke", mark.stroke);
    applyAttr(selection, "stroke-width", mark.strokeWidth);
    applyAttr(selection, "stroke-opacity", mark.strokeOpacity);
    applyAttr(selection, "stroke-linejoin", mark.strokeLinejoin);
    applyAttr(selection, "stroke-linecap", mark.strokeLinecap);
    applyAttr(selection, "stroke-miterlimit", mark.strokeMiterlimit);
    applyAttr(selection, "stroke-dasharray", mark.strokeDasharray);
    applyAttr(selection, "stroke-dashoffset", mark.strokeDashoffset);
    applyAttr(selection, "shape-rendering", mark.shapeRendering);
    applyAttr(selection, "paint-order", mark.paintOrder);
    applyAttr(selection, "pointer-events", mark.pointerEvents);
    switch (mark.clip) {
        case "frame": {
            const { x, y } = scales;
            const { width, height, marginLeft, marginRight, marginTop, marginBottom } = dimensions;
            const id = getClipId();
            selection
                .attr("clip-path", `url(#${id})`)
                .append("clipPath")
                .attr("id", id)
                .append("rect")
                .attr("x", marginLeft - (x?.bandwidth ? x.bandwidth() / 2 : 0))
                .attr("y", marginTop - (y?.bandwidth ? y.bandwidth() / 2 : 0))
                .attr("width", width - marginRight - marginLeft)
                .attr("height", height - marginTop - marginBottom);
            break;
        }
        case "sphere": {
            const { projection } = context;
            if (!projection)
                throw new Error(`the "sphere" clip option requires a projection`);
            const id = getClipId();
            selection
                .attr("clip-path", `url(#${id})`)
                .append("clipPath")
                .attr("id", id)
                .append("path")
                .attr("d", d3.geoPath(projection)({ type: "Sphere" }));
            break;
        }
    }
}
function applyDirectStyles(selection, mark) {
    applyStyle(selection, "mix-blend-mode", mark.mixBlendMode);
    applyAttr(selection, "opacity", mark.opacity);
}
function applyHref(selection, href, target) {
    selection.each(function (i) {
        const h = href(i);
        if (h != null) {
            const a = this.ownerDocument.createElementNS(d3.namespaces.svg, "a");
            a.setAttribute("fill", "inherit");
            a.setAttributeNS(d3.namespaces.xlink, "href", h);
            if (target != null)
                a.setAttribute("target", target);
            this.parentNode.insertBefore(a, this).appendChild(this);
        }
    });
}
function applyAttr(selection, name, value) {
    if (value != null)
        selection.attr(name, value);
}
function applyStyle(selection, name, value) {
    if (value != null)
        selection.style(name, value);
}
function applyTransform(selection, mark, { x, y }, tx = offset, ty = offset) {
    tx += mark.dx;
    ty += mark.dy;
    if (x?.bandwidth)
        tx += x.bandwidth() / 2;
    if (y?.bandwidth)
        ty += y.bandwidth() / 2;
    if (tx || ty)
        selection.attr("transform", `translate(${tx},${ty})`);
}
function impliedString(value, impliedValue) {
    if ((value = string(value)) !== impliedValue)
        return value;
}
function impliedNumber(value, impliedValue) {
    if ((value = number(value)) !== impliedValue)
        return value;
}
const validClassName = /^-?([_a-z]|[\240-\377]|\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?|\\[^\r\n\f0-9a-f])([_a-z0-9-]|[\240-\377]|\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?|\\[^\r\n\f0-9a-f])*$/;
function maybeClassName(name) {
    if (name === undefined)
        return `plot-${Math.random().toString(16).slice(2)}`;
    name = `${name}`;
    if (!validClassName.test(name))
        throw new Error(`invalid class name: ${name}`);
    return name;
}
function applyInlineStyles(selection, style) {
    if (typeof style === "string") {
        selection.property("style", style);
    }
    else if (style != null) {
        for (const element of selection) {
            Object.assign(element.style, style);
        }
    }
}
function applyFrameAnchor({ frameAnchor }, { width, height, marginTop, marginRight, marginBottom, marginLeft }) {
    return [
        /left$/.test(frameAnchor)
            ? marginLeft
            : /right$/.test(frameAnchor)
                ? width - marginRight
                : (marginLeft + width - marginRight) / 2,
        /^top/.test(frameAnchor)
            ? marginTop
            : /^bottom/.test(frameAnchor)
                ? height - marginBottom
                : (marginTop + height - marginBottom) / 2
    ];
}

function maybeInsetX({ inset, insetLeft, insetRight, ...options } = {}) {
    [insetLeft, insetRight] = maybeInset(inset, insetLeft, insetRight);
    return { inset, insetLeft, insetRight, ...options };
}
function maybeInsetY({ inset, insetTop, insetBottom, ...options } = {}) {
    [insetTop, insetBottom] = maybeInset(inset, insetTop, insetBottom);
    return { inset, insetTop, insetBottom, ...options };
}
function maybeInset(inset, inset1, inset2) {
    return inset === undefined && inset1 === undefined && inset2 === undefined
        ? offset
            ? [1, 0]
            : [0.5, 0.5]
        : [inset1, inset2];
}

// TODO Allow the interval to be specified as a string, e.g. “day” or “hour”?
// This will require the interval knowing the type of the associated scale to
// chose between UTC and local time (or better, an explicit timeZone option).
function maybeInterval(interval) {
    if (interval == null)
        return;
    if (typeof interval === "number") {
        const n = interval;
        // Note: this offset doesn’t support the optional step argument for simplicity.
        return {
            floor: (d) => n * Math.floor(d / n),
            offset: (d) => d + n,
            range: (lo, hi) => d3.range(Math.ceil(lo / n), hi / n).map((x) => n * x)
        };
    }
    if (typeof interval.floor !== "function" || typeof interval.offset !== "function")
        throw new Error("invalid interval; missing floor or offset function");
    return interval;
}
// The interval may be specified either as x: {value, interval} or as {x,
// interval}. The former is used, for example, for Plot.rect.
function maybeIntervalValue(value, { interval }) {
    value = { ...maybeValue(value) };
    value.interval = maybeInterval(value.interval === undefined ? interval : value.interval);
    return value;
}
function maybeIntervalK(k, maybeInsetK, options, trivial) {
    const { [k]: v, [`${k}1`]: v1, [`${k}2`]: v2 } = options;
    const { value, interval } = maybeIntervalValue(v, options);
    if (value == null || (interval == null && !trivial))
        return options;
    const label = labelof(v);
    if (interval == null) {
        let V;
        const kv = { transform: (data) => V || (V = valueof(data, value)), label };
        return {
            ...options,
            [k]: undefined,
            [`${k}1`]: v1 === undefined ? kv : v1,
            [`${k}2`]: v2 === undefined ? kv : v2
        };
    }
    let D1, V1;
    function transform(data) {
        if (V1 !== undefined && data === D1)
            return V1; // memoize
        return (V1 = map$1(valueof((D1 = data), value), (v) => interval.floor(v)));
    }
    return maybeInsetK({
        ...options,
        [k]: undefined,
        [`${k}1`]: v1 === undefined ? { transform, label } : v1,
        [`${k}2`]: v2 === undefined ? { transform: (data) => transform(data).map((v) => interval.offset(v)), label } : v2
    });
}
function maybeIntervalMidK(k, maybeInsetK, options) {
    const { [k]: v } = options;
    const { value, interval } = maybeIntervalValue(v, options);
    if (value == null || interval == null)
        return options;
    return maybeInsetK({
        ...options,
        [k]: {
            label: labelof(v),
            transform: (data) => {
                const V1 = map$1(valueof(data, value), (v) => interval.floor(v));
                const V2 = V1.map((v) => interval.offset(v));
                return V1.map(isTemporal(V1)
                    ? (v1, v2) => v1 == null || isNaN((v1 = +v1)) || ((v2 = V2[v2]), v2 == null) || isNaN((v2 = +v2))
                        ? undefined
                        : new Date((v1 + v2) / 2)
                    : (v1, v2) => (v1 == null || ((v2 = V2[v2]), v2 == null) ? NaN : (+v1 + +v2) / 2));
            }
        }
    });
}
function maybeTrivialIntervalX(options = {}) {
    return maybeIntervalK("x", maybeInsetX, options, true);
}
function maybeTrivialIntervalY(options = {}) {
    return maybeIntervalK("y", maybeInsetY, options, true);
}
function maybeIntervalX(options = {}) {
    return maybeIntervalK("x", maybeInsetX, options);
}
function maybeIntervalY(options = {}) {
    return maybeIntervalK("y", maybeInsetY, options);
}
function maybeIntervalMidX(options = {}) {
    return maybeIntervalMidK("x", maybeInsetX, options);
}
function maybeIntervalMidY(options = {}) {
    return maybeIntervalMidK("y", maybeInsetY, options);
}

const flip = (i) => (t) => i(1 - t);
const unit = [0, 1];
const interpolators = new Map([
    // numbers
    ["number", d3.interpolateNumber],
    // color spaces
    ["rgb", d3.interpolateRgb],
    ["hsl", d3.interpolateHsl],
    ["hcl", d3.interpolateHcl],
    ["lab", d3.interpolateLab]
]);
function Interpolator(interpolate) {
    const i = `${interpolate}`.toLowerCase();
    if (!interpolators.has(i))
        throw new Error(`unknown interpolator: ${i}`);
    return interpolators.get(i);
}
function ScaleQ(key, scale, channels, { type, nice, clamp, zero, domain = inferAutoDomain(key, channels), unknown, round, scheme, interval, range = registry.get(key) === radius
    ? inferRadialRange(channels, domain)
    : registry.get(key) === length
        ? inferLengthRange(channels, domain)
        : registry.get(key) === opacity
            ? unit
            : undefined, interpolate = registry.get(key) === color
    ? scheme == null && range !== undefined
        ? d3.interpolateRgb
        : quantitativeScheme(scheme !== undefined ? scheme : type === "cyclical" ? "rainbow" : "turbo")
    : round
        ? d3.interpolateRound
        : d3.interpolateNumber, reverse }) {
    interval = maybeInterval(interval);
    if (type === "cyclical" || type === "sequential")
        type = "linear"; // shorthand for color schemes
    reverse = !!reverse;
    // Sometimes interpolate is a named interpolator, such as "lab" for Lab color
    // space. Other times interpolate is a function that takes two arguments and
    // is used in conjunction with the range. And other times the interpolate
    // function is a “fixed” interpolator on the [0, 1] interval, as when a
    // color scheme such as interpolateRdBu is used.
    if (typeof interpolate !== "function") {
        interpolate = Interpolator(interpolate);
    }
    if (interpolate.length === 1) {
        if (reverse) {
            interpolate = flip(interpolate);
            reverse = false;
        }
        if (range === undefined) {
            range = Float64Array.from(domain, (_, i) => i / (domain.length - 1));
            if (range.length === 2)
                range = unit; // optimize common case of [0, 1]
        }
        scale.interpolate((range === unit ? constant : interpolatePiecewise)(interpolate));
    }
    else {
        scale.interpolate(interpolate);
    }
    // If a zero option is specified, we assume that the domain is numeric, and we
    // want to ensure that the domain crosses zero. However, note that the domain
    // may be reversed (descending) so we shouldn’t assume that the first value is
    // smaller than the last; and also it’s possible that the domain has more than
    // two values for a “poly” scale. And lastly be careful not to mutate input!
    if (zero) {
        const [min, max] = d3.extent(domain);
        if (min > 0 || max < 0) {
            domain = slice$1(domain);
            if (order(domain) !== Math.sign(min))
                domain[domain.length - 1] = 0;
            // [2, 1] or [-2, -1]
            else
                domain[0] = 0; // [1, 2] or [-1, -2]
        }
    }
    if (reverse)
        domain = d3.reverse(domain);
    scale.domain(domain).unknown(unknown);
    if (nice)
        scale.nice(nice === true ? undefined : nice), (domain = scale.domain());
    if (range !== undefined)
        scale.range(range);
    if (clamp)
        scale.clamp(clamp);
    return { type, domain, range, scale, interpolate, interval };
}
function ScaleLinear(key, channels, options) {
    return ScaleQ(key, d3.scaleLinear(), channels, options);
}
function ScaleSqrt(key, channels, options) {
    return ScalePow(key, channels, { ...options, exponent: 0.5 });
}
function ScalePow(key, channels, { exponent = 1, ...options }) {
    return ScaleQ(key, d3.scalePow().exponent(exponent), channels, { ...options, type: "pow" });
}
function ScaleLog(key, channels, { base = 10, domain = inferLogDomain(channels), ...options }) {
    return ScaleQ(key, d3.scaleLog().base(base), channels, { ...options, domain });
}
function ScaleSymlog(key, channels, { constant = 1, ...options }) {
    return ScaleQ(key, d3.scaleSymlog().constant(constant), channels, options);
}
function ScaleQuantile(key, channels, { range, quantiles = range === undefined ? 5 : (range = [...range]).length, // deprecated; use n instead
n = quantiles, scheme = "rdylbu", domain = inferQuantileDomain(channels), interpolate, reverse }) {
    if (range === undefined)
        range =
            interpolate !== undefined
                ? d3.quantize(interpolate, n)
                : registry.get(key) === color
                    ? ordinalRange(scheme, n)
                    : undefined;
    return ScaleThreshold(key, channels, {
        domain: d3.scaleQuantile(domain, range === undefined ? { length: n } : range).quantiles(),
        range,
        reverse
    });
}
function ScaleQuantize(key, channels, { range, n = range === undefined ? 5 : (range = [...range]).length, scheme = "rdylbu", domain = inferAutoDomain(key, channels), unknown, interpolate, reverse }) {
    const [min, max] = d3.extent(domain);
    let thresholds;
    if (range === undefined) {
        thresholds = d3.ticks(min, max, n); // approximate number of nice, round thresholds
        if (thresholds[0] <= min)
            thresholds.splice(0, 1); // drop exact lower bound
        if (thresholds[thresholds.length - 1] >= max)
            thresholds.pop(); // drop exact upper bound
        n = thresholds.length + 1;
        range =
            interpolate !== undefined
                ? d3.quantize(interpolate, n)
                : registry.get(key) === color
                    ? ordinalRange(scheme, n)
                    : undefined;
    }
    else {
        thresholds = d3.quantize(d3.interpolateNumber(min, max), n + 1).slice(1, -1); // exactly n - 1 thresholds to match range
        if (min instanceof Date)
            thresholds = thresholds.map((x) => new Date(x)); // preserve date types
    }
    if (order(arrayify(domain)) < 0)
        thresholds.reverse(); // preserve descending domain
    return ScaleThreshold(key, channels, { domain: thresholds, range, reverse, unknown });
}
function ScaleThreshold(key, channels, { domain = [0], // explicit thresholds in ascending order
unknown, scheme = "rdylbu", interpolate, range = interpolate !== undefined
    ? d3.quantize(interpolate, domain.length + 1)
    : registry.get(key) === color
        ? ordinalRange(scheme, domain.length + 1)
        : undefined, reverse }) {
    const sign = order(arrayify(domain)); // preserve descending domain
    if (!d3.pairs(domain).every(([a, b]) => isOrdered(a, b, sign)))
        throw new Error(`the ${key} scale has a non-monotonic domain`);
    if (reverse)
        range = d3.reverse(range); // domain ascending, so reverse range
    return {
        type: "threshold",
        scale: d3.scaleThreshold(sign < 0 ? d3.reverse(domain) : domain, range === undefined ? [] : range).unknown(unknown),
        domain,
        range
    };
}
function isOrdered(a, b, sign) {
    const s = d3.descending(a, b);
    return s === 0 || s === sign;
}
function ScaleIdentity() {
    return { type: "identity", scale: d3.scaleIdentity() };
}
function inferDomain$1(channels, f = finite) {
    return channels.length
        ? [
            d3.min(channels, ({ value }) => (value === undefined ? value : d3.min(value, f))),
            d3.max(channels, ({ value }) => (value === undefined ? value : d3.max(value, f)))
        ]
        : [0, 1];
}
function inferAutoDomain(key, channels) {
    const type = registry.get(key);
    return (type === radius || type === opacity || type === length ? inferZeroDomain : inferDomain$1)(channels);
}
function inferZeroDomain(channels) {
    return [0, channels.length ? d3.max(channels, ({ value }) => (value === undefined ? value : d3.max(value, finite))) : 1];
}
// We don’t want the upper bound of the radial domain to be zero, as this would
// be degenerate, so we ignore nonpositive values. We also don’t want the
// maximum default radius to exceed 30px.
function inferRadialRange(channels, domain) {
    const hint = channels.find(({ radius }) => radius !== undefined);
    if (hint !== undefined)
        return [0, hint.radius]; // a natural maximum radius, e.g. hexbins
    const h25 = d3.quantile(channels, 0.5, ({ value }) => (value === undefined ? NaN : d3.quantile(value, 0.25, positive)));
    const range = domain.map((d) => 3 * Math.sqrt(d / h25));
    const k = 30 / d3.max(range);
    return k < 1 ? range.map((r) => r * k) : range;
}
// We want a length scale’s domain to go from zero to a positive value, and to
// treat negative lengths if any as inverted vectors of equivalent magnitude. We
// also don’t want the maximum default length to exceed 60px.
function inferLengthRange(channels, domain) {
    const h50 = d3.median(channels, ({ value }) => (value === undefined ? NaN : d3.median(value, Math.abs)));
    const range = domain.map((d) => (12 * d) / h50);
    const k = 60 / d3.max(range);
    return k < 1 ? range.map((r) => r * k) : range;
}
function inferLogDomain(channels) {
    for (const { value } of channels) {
        if (value !== undefined) {
            for (let v of value) {
                v = +v;
                if (v > 0)
                    return inferDomain$1(channels, positive);
                if (v < 0)
                    return inferDomain$1(channels, negative);
            }
        }
    }
    return [1, 10];
}
function inferQuantileDomain(channels) {
    const domain = [];
    for (const { value } of channels) {
        if (value === undefined)
            continue;
        for (const v of value)
            domain.push(v);
    }
    return domain;
}
function interpolatePiecewise(interpolate) {
    return (i, j) => (t) => interpolate(i + t * (j - i));
}

function ScaleD(key, scale, transform, channels, { type, nice, clamp, domain = inferDomain$1(channels), unknown, pivot = 0, scheme, range, symmetric = true, interpolate = registry.get(key) === color
    ? scheme == null && range !== undefined
        ? d3.interpolateRgb
        : quantitativeScheme(scheme !== undefined ? scheme : "rdbu")
    : d3.interpolateNumber, reverse }) {
    pivot = +pivot;
    let [min, max] = domain;
    if (d3.descending(min, max) < 0)
        ([min, max] = [max, min]), (reverse = !reverse);
    min = Math.min(min, pivot);
    max = Math.max(max, pivot);
    // Sometimes interpolate is a named interpolator, such as "lab" for Lab color
    // space. Other times interpolate is a function that takes two arguments and
    // is used in conjunction with the range. And other times the interpolate
    // function is a “fixed” interpolator on the [0, 1] interval, as when a
    // color scheme such as interpolateRdBu is used.
    if (typeof interpolate !== "function") {
        interpolate = Interpolator(interpolate);
    }
    // If an explicit range is specified, promote it to a piecewise interpolator.
    if (range !== undefined) {
        interpolate =
            interpolate.length === 1 ? interpolatePiecewise(interpolate)(...range) : d3.piecewise(interpolate, range);
    }
    // Reverse before normalization.
    if (reverse)
        interpolate = flip(interpolate);
    // Normalize the interpolator for symmetric difference around the pivot.
    if (symmetric) {
        const mid = transform.apply(pivot);
        const mindelta = mid - transform.apply(min);
        const maxdelta = transform.apply(max) - mid;
        if (mindelta < maxdelta)
            min = transform.invert(mid - maxdelta);
        else if (mindelta > maxdelta)
            max = transform.invert(mid + mindelta);
    }
    scale.domain([min, pivot, max]).unknown(unknown).interpolator(interpolate);
    if (clamp)
        scale.clamp(clamp);
    if (nice)
        scale.nice(nice);
    return { type, domain: [min, max], pivot, interpolate, scale };
}
function ScaleDiverging(key, channels, options) {
    return ScaleD(key, d3.scaleDiverging(), transformIdentity, channels, options);
}
function ScaleDivergingSqrt(key, channels, options) {
    return ScaleDivergingPow(key, channels, { ...options, exponent: 0.5 });
}
function ScaleDivergingPow(key, channels, { exponent = 1, ...options }) {
    return ScaleD(key, d3.scaleDivergingPow().exponent((exponent = +exponent)), transformPow(exponent), channels, {
        ...options,
        type: "diverging-pow"
    });
}
function ScaleDivergingLog(key, channels, { base = 10, pivot = 1, domain = inferDomain$1(channels, pivot < 0 ? negative : positive), ...options }) {
    return ScaleD(key, d3.scaleDivergingLog().base((base = +base)), transformLog, channels, { domain, pivot, ...options });
}
function ScaleDivergingSymlog(key, channels, { constant = 1, ...options }) {
    return ScaleD(key, d3.scaleDivergingSymlog().constant((constant = +constant)), transformSymlog(constant), channels, options);
}
const transformIdentity = {
    apply(x) {
        return x;
    },
    invert(x) {
        return x;
    }
};
const transformLog = {
    apply: Math.log,
    invert: Math.exp
};
const transformSqrt = {
    apply(x) {
        return Math.sign(x) * Math.sqrt(Math.abs(x));
    },
    invert(x) {
        return Math.sign(x) * (x * x);
    }
};
function transformPow(exponent) {
    return exponent === 0.5
        ? transformSqrt
        : {
            apply(x) {
                return Math.sign(x) * Math.pow(Math.abs(x), exponent);
            },
            invert(x) {
                return Math.sign(x) * Math.pow(Math.abs(x), 1 / exponent);
            }
        };
}
function transformSymlog(constant) {
    return {
        apply(x) {
            return Math.sign(x) * Math.log1p(Math.abs(x / constant));
        },
        invert(x) {
            return Math.sign(x) * Math.expm1(Math.abs(x)) * constant;
        }
    };
}

function ScaleT(key, scale, channels, options) {
    return ScaleQ(key, scale, channels, options);
}
function ScaleTime(key, channels, options) {
    return ScaleT(key, d3.scaleTime(), channels, options);
}
function ScaleUtc(key, channels, options) {
    return ScaleT(key, d3.scaleUtc(), channels, options);
}

const sqrt3 = Math.sqrt(3);
const sqrt4_3 = 2 / sqrt3;
const symbolHexagon = {
    draw(context, size) {
        const rx = Math.sqrt(size / Math.PI), ry = rx * sqrt4_3, hy = ry / 2;
        context.moveTo(0, ry);
        context.lineTo(rx, hy);
        context.lineTo(rx, -hy);
        context.lineTo(0, -ry);
        context.lineTo(-rx, -hy);
        context.lineTo(-rx, hy);
        context.closePath();
    }
};
const symbols = new Map([
    ["asterisk", d3.symbolAsterisk],
    ["circle", d3.symbolCircle],
    ["cross", d3.symbolCross],
    ["diamond", d3.symbolDiamond],
    ["diamond2", d3.symbolDiamond2],
    ["hexagon", symbolHexagon],
    ["plus", d3.symbolPlus],
    ["square", d3.symbolSquare],
    ["square2", d3.symbolSquare2],
    ["star", d3.symbolStar],
    ["times", d3.symbolX],
    ["triangle", d3.symbolTriangle],
    ["triangle2", d3.symbolTriangle2],
    ["wye", d3.symbolWye]
]);
function isSymbolObject(value) {
    return value && typeof value.draw === "function";
}
function isSymbol(value) {
    if (isSymbolObject(value))
        return true;
    if (typeof value !== "string")
        return false;
    return symbols.has(value.toLowerCase());
}
function maybeSymbol(symbol) {
    if (symbol == null || isSymbolObject(symbol))
        return symbol;
    const value = symbols.get(`${symbol}`.toLowerCase());
    if (value)
        return value;
    throw new Error(`invalid symbol: ${symbol}`);
}
function maybeSymbolChannel(symbol) {
    if (symbol == null || isSymbolObject(symbol))
        return [undefined, symbol];
    if (typeof symbol === "string") {
        const value = symbols.get(`${symbol}`.toLowerCase());
        if (value)
            return [undefined, value];
    }
    return [symbol, undefined];
}

// This denotes an implicitly ordinal color scale: the scale type was not set,
// but the associated values are strings or booleans. If the associated defined
// values are entirely boolean, the range will default to greys. You can opt out
// of this by setting the type explicitly.
const ordinalImplicit = Symbol("ordinal");
function ScaleO(key, scale, channels, { type, interval, domain, range, reverse, hint }) {
    interval = maybeInterval(interval);
    if (domain === undefined)
        domain = inferDomain(channels, interval, key);
    if (type === "categorical" || type === ordinalImplicit)
        type = "ordinal"; // shorthand for color schemes
    if (reverse)
        domain = d3.reverse(domain);
    scale.domain(domain);
    if (range !== undefined) {
        // If the range is specified as a function, pass it the domain.
        if (typeof range === "function")
            range = range(domain);
        scale.range(range);
    }
    return { type, domain, range, scale, hint, interval };
}
function ScaleOrdinal(key, channels, { type, interval, domain, range, scheme, unknown, ...options }) {
    interval = maybeInterval(interval);
    if (domain === undefined)
        domain = inferDomain(channels, interval, key);
    let hint;
    if (registry.get(key) === symbol) {
        hint = inferSymbolHint(channels);
        range = range === undefined ? inferSymbolRange(hint) : map$1(range, maybeSymbol);
    }
    else if (registry.get(key) === color) {
        if (range === undefined && (type === "ordinal" || type === ordinalImplicit)) {
            range = maybeBooleanRange(domain, scheme);
            if (range !== undefined)
                scheme = undefined; // Don’t re-apply scheme.
        }
        if (scheme === undefined && range === undefined) {
            scheme = type === "ordinal" ? "turbo" : "tableau10";
        }
        if (scheme !== undefined) {
            if (range !== undefined) {
                const interpolate = quantitativeScheme(scheme);
                const t0 = range[0], d = range[1] - range[0];
                range = ({ length: n }) => d3.quantize((t) => interpolate(t0 + d * t), n);
            }
            else {
                range = ordinalScheme(scheme);
            }
        }
    }
    if (unknown === d3.scaleImplicit)
        throw new Error("implicit unknown is not supported");
    return ScaleO(key, d3.scaleOrdinal().unknown(unknown), channels, { ...options, type, domain, range, hint });
}
function ScalePoint(key, channels, { align = 0.5, padding = 0.5, ...options }) {
    return maybeRound(d3.scalePoint().align(align).padding(padding), channels, options, key);
}
function ScaleBand(key, channels, { align = 0.5, padding = 0.1, paddingInner = padding, paddingOuter = key === "fx" || key === "fy" ? 0 : padding, ...options }) {
    return maybeRound(d3.scaleBand().align(align).paddingInner(paddingInner).paddingOuter(paddingOuter), channels, options, key);
}
function maybeRound(scale, channels, options, key) {
    let { round } = options;
    if (round !== undefined)
        scale.round((round = !!round));
    scale = ScaleO(key, scale, channels, options);
    scale.round = round; // preserve for autoScaleRound
    return scale;
}
function inferDomain(channels, interval, key) {
    const values = new d3.InternSet();
    for (const { value, domain } of channels) {
        if (domain !== undefined)
            return domain(); // see channelDomain
        if (value === undefined)
            continue;
        for (const v of value)
            values.add(v);
    }
    if (interval !== undefined) {
        const [min, max] = d3.extent(values).map(interval.floor, interval);
        return interval.range(min, interval.offset(max));
    }
    if (values.size > 10e3 && registry.get(key) === position)
        throw new Error("implicit ordinal position domain has more than 10,000 values");
    return d3.sort(values, ascendingDefined);
}
// If all channels provide a consistent hint, propagate it to the scale.
function inferHint(channels, key) {
    let value;
    for (const { hint } of channels) {
        const candidate = hint?.[key];
        if (candidate === undefined)
            continue; // no hint here
        if (value === undefined)
            value = candidate;
        // first hint
        else if (value !== candidate)
            return; // inconsistent hint
    }
    return value;
}
function inferSymbolHint(channels) {
    return {
        fill: inferHint(channels, "fill"),
        stroke: inferHint(channels, "stroke")
    };
}
function inferSymbolRange(hint) {
    return isNoneish(hint.fill) ? d3.symbolsStroke : d3.symbolsFill;
}

function Scales(channelsByScale, { inset: globalInset = 0, insetTop: globalInsetTop = globalInset, insetRight: globalInsetRight = globalInset, insetBottom: globalInsetBottom = globalInset, insetLeft: globalInsetLeft = globalInset, round, nice, clamp, zero, align, padding, projection, ...options } = {}) {
    const scales = {};
    for (const [key, channels] of channelsByScale) {
        const scaleOptions = options[key];
        const scale = Scale(key, channels, {
            round: registry.get(key) === position ? round : undefined,
            nice,
            clamp,
            zero,
            align,
            padding,
            projection,
            ...scaleOptions
        });
        if (scale) {
            // populate generic scale options (percent, transform, insets)
            let { percent, transform, inset, insetTop = inset !== undefined ? inset : key === "y" ? globalInsetTop : 0, // not fy
            insetRight = inset !== undefined ? inset : key === "x" ? globalInsetRight : 0, // not fx
            insetBottom = inset !== undefined ? inset : key === "y" ? globalInsetBottom : 0, // not fy
            insetLeft = inset !== undefined ? inset : key === "x" ? globalInsetLeft : 0 // not fx
             } = scaleOptions || {};
            if (transform == null)
                transform = undefined;
            else if (typeof transform !== "function")
                throw new Error("invalid scale transform; not a function");
            scale.percent = !!percent;
            scale.transform = transform;
            if (key === "x" || key === "fx") {
                scale.insetLeft = +insetLeft;
                scale.insetRight = +insetRight;
            }
            else if (key === "y" || key === "fy") {
                scale.insetTop = +insetTop;
                scale.insetBottom = +insetBottom;
            }
            scales[key] = scale;
        }
    }
    return scales;
}
function ScaleFunctions(scales) {
    return Object.fromEntries(Object.entries(scales).map(([name, { scale }]) => [name, scale]));
}
// Mutates scale.range!
function autoScaleRange({ x, y, fx, fy }, dimensions) {
    if (fx)
        autoScaleRangeX(fx, dimensions);
    if (fy)
        autoScaleRangeY(fy, dimensions);
    if (x)
        autoScaleRangeX(x, fx ? { width: fx.scale.bandwidth() } : dimensions);
    if (y)
        autoScaleRangeY(y, fy ? { height: fy.scale.bandwidth() } : dimensions);
}
function autoScaleRangeX(scale, dimensions) {
    if (scale.range === undefined) {
        const { insetLeft, insetRight } = scale;
        const { width, marginLeft = 0, marginRight = 0 } = dimensions;
        const left = marginLeft + insetLeft;
        const right = width - marginRight - insetRight;
        scale.range = [left, Math.max(left, right)];
        if (!isOrdinalScale(scale))
            scale.range = piecewiseRange(scale);
        scale.scale.range(scale.range);
    }
    autoScaleRound(scale);
}
function autoScaleRangeY(scale, dimensions) {
    if (scale.range === undefined) {
        const { insetTop, insetBottom } = scale;
        const { height, marginTop = 0, marginBottom = 0 } = dimensions;
        const top = marginTop + insetTop;
        const bottom = height - marginBottom - insetBottom;
        scale.range = [Math.max(top, bottom), top];
        if (!isOrdinalScale(scale))
            scale.range = piecewiseRange(scale);
        else
            scale.range.reverse();
        scale.scale.range(scale.range);
    }
    autoScaleRound(scale);
}
function autoScaleRound(scale) {
    if (scale.round === undefined && isBandScale(scale) && roundError(scale) <= 30) {
        scale.scale.round(true);
    }
}
// If we were to turn on rounding for this band or point scale, how much wasted
// space would it introduce (on both ends of the range)? This must match
// d3.scaleBand’s rounding behavior:
// https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/band.js#L20-L32
function roundError({ scale }) {
    const n = scale.domain().length;
    const [start, stop] = scale.range();
    const paddingInner = scale.paddingInner ? scale.paddingInner() : 1;
    const paddingOuter = scale.paddingOuter ? scale.paddingOuter() : scale.padding();
    const m = n - paddingInner;
    const step = Math.abs(stop - start) / Math.max(1, m + paddingOuter * 2);
    return (step - Math.floor(step)) * m;
}
function piecewiseRange(scale) {
    const length = scale.scale.domain().length + isThresholdScale(scale);
    if (!(length > 2))
        return scale.range;
    const [start, end] = scale.range;
    return Array.from({ length }, (_, i) => start + (i / (length - 1)) * (end - start));
}
function normalizeScale(key, scale, hint) {
    return Scale(key, hint === undefined ? undefined : [{ hint }], { ...scale });
}
function Scale(key, channels = [], options = {}) {
    const type = inferScaleType(key, channels, options);
    // Warn for common misuses of implicit ordinal scales. We disable this test if
    // you specify a scale interval or if you set the domain or range explicitly,
    // since setting the domain or range (typically with a cardinality of more than
    // two) is another indication that you intended for the scale to be ordinal; we
    // also disable it for facet scales since these are always band scales.
    if (options.type === undefined &&
        options.domain === undefined &&
        options.range === undefined &&
        options.interval == null &&
        key !== "fx" &&
        key !== "fy" &&
        isOrdinalScale({ type })) {
        const values = channels.map(({ value }) => value).filter((value) => value !== undefined);
        if (values.some(isTemporal))
            warn(`Warning: some data associated with the ${key} scale are dates. Dates are typically associated with a "utc" or "time" scale rather than a "${formatScaleType(type)}" scale. If you are using a bar mark, you probably want a rect mark with the interval option instead; if you are using a group transform, you probably want a bin transform instead. If you want to treat this data as ordinal, you can specify the interval of the ${key} scale (e.g., d3.utcDay), or you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(type)}".`);
        else if (values.some(isTemporalString))
            warn(`Warning: some data associated with the ${key} scale are strings that appear to be dates (e.g., YYYY-MM-DD). If these strings represent dates, you should parse them to Date objects. Dates are typically associated with a "utc" or "time" scale rather than a "${formatScaleType(type)}" scale. If you are using a bar mark, you probably want a rect mark with the interval option instead; if you are using a group transform, you probably want a bin transform instead. If you want to treat this data as ordinal, you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(type)}".`);
        else if (values.some(isNumericString))
            warn(`Warning: some data associated with the ${key} scale are strings that appear to be numbers. If these strings represent numbers, you should parse or coerce them to numbers. Numbers are typically associated with a "linear" scale rather than a "${formatScaleType(type)}" scale. If you want to treat this data as ordinal, you can specify the interval of the ${key} scale (e.g., 1 for integers), or you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(type)}".`);
    }
    options.type = type; // Mutates input!
    // Once the scale type is known, coerce the associated channel values and any
    // explicitly-specified domain to the expected type.
    switch (type) {
        case "diverging":
        case "diverging-sqrt":
        case "diverging-pow":
        case "diverging-log":
        case "diverging-symlog":
        case "cyclical":
        case "sequential":
        case "linear":
        case "sqrt":
        case "threshold":
        case "quantile":
        case "pow":
        case "log":
        case "symlog":
            options = coerceType(channels, options, coerceNumbers);
            break;
        case "identity":
            switch (registry.get(key)) {
                case position:
                    options = coerceType(channels, options, coerceNumbers);
                    break;
                case symbol:
                    options = coerceType(channels, options, coerceSymbols);
                    break;
            }
            break;
        case "utc":
        case "time":
            options = coerceType(channels, options, coerceDates);
            break;
    }
    switch (type) {
        case "diverging":
            return ScaleDiverging(key, channels, options);
        case "diverging-sqrt":
            return ScaleDivergingSqrt(key, channels, options);
        case "diverging-pow":
            return ScaleDivergingPow(key, channels, options);
        case "diverging-log":
            return ScaleDivergingLog(key, channels, options);
        case "diverging-symlog":
            return ScaleDivergingSymlog(key, channels, options);
        case "categorical":
        case "ordinal":
        case ordinalImplicit:
            return ScaleOrdinal(key, channels, options);
        case "cyclical":
        case "sequential":
        case "linear":
            return ScaleLinear(key, channels, options);
        case "sqrt":
            return ScaleSqrt(key, channels, options);
        case "threshold":
            return ScaleThreshold(key, channels, options);
        case "quantile":
            return ScaleQuantile(key, channels, options);
        case "quantize":
            return ScaleQuantize(key, channels, options);
        case "pow":
            return ScalePow(key, channels, options);
        case "log":
            return ScaleLog(key, channels, options);
        case "symlog":
            return ScaleSymlog(key, channels, options);
        case "utc":
            return ScaleUtc(key, channels, options);
        case "time":
            return ScaleTime(key, channels, options);
        case "point":
            return ScalePoint(key, channels, options);
        case "band":
            return ScaleBand(key, channels, options);
        case "identity":
            return registry.get(key) === position ? ScaleIdentity() : { type: "identity" };
        case undefined:
            return;
        default:
            throw new Error(`unknown scale type: ${type}`);
    }
}
function formatScaleType(type) {
    return typeof type === "symbol" ? type.description : type;
}
// A special type symbol when the x and y scales are replaced with a projection.
const typeProjection = { toString: () => "projection" };
function inferScaleType(key, channels, { type, domain, range, scheme, pivot, projection }) {
    // The facet scales are always band scales; this cannot be changed.
    if (key === "fx" || key === "fy")
        return "band";
    // If a projection is specified, the x- and y-scales are disabled; these
    // channels will be projected rather than scaled. (But still check that none
    // of the associated channels are incompatible with a projection.)
    if ((key === "x" || key === "y") && projection != null)
        type = typeProjection;
    // If a channel dictates a scale type, make sure that it is consistent with
    // the user-specified scale type (if any) and all other channels. For example,
    // barY requires x to be a band scale and disallows any other scale type.
    for (const { type: t } of channels) {
        if (t === undefined)
            continue;
        else if (type === undefined)
            type = t;
        else if (type !== t)
            throw new Error(`scale incompatible with channel: ${type} !== ${t}`);
    }
    // If the scale, a channel, or user specified a (consistent) type, return it.
    if (type === typeProjection)
        return;
    if (type !== undefined)
        return type;
    // If there’s no data (and no type) associated with this scale, don’t create a scale.
    if (domain === undefined && !channels.some(({ value }) => value !== undefined))
        return;
    const kind = registry.get(key);
    // For color scales, if no range or scheme is specified and all associated
    // defined values (from the domain if present, and otherwise from channels)
    // are valid colors, then default to the identity scale. This allows, for
    // example, a fill channel to return literal colors; without this, the colors
    // would be remapped to a categorical scheme!
    if (kind === color && range === undefined && scheme === undefined && isAll(domain, channels, isColor))
        return "identity";
    // Similarly for symbols…
    if (kind === symbol && range === undefined && isAll(domain, channels, isSymbol))
        return "identity";
    // Some scales have default types.
    if (kind === radius)
        return "sqrt";
    if (kind === opacity || kind === length)
        return "linear";
    if (kind === symbol)
        return "ordinal";
    // If the domain or range has more than two values, assume it’s ordinal. You
    // can still use a “piecewise” (or “polylinear”) scale, but you must set the
    // type explicitly.
    if ((domain || range || []).length > 2)
        return asOrdinalType(kind);
    // Otherwise, infer the scale type from the data! Prefer the domain, if
    // present, over channels. (The domain and channels should be consistently
    // typed, and the domain is more explicit and typically much smaller.) We only
    // check the first defined value for expedience and simplicity; we expect
    // that the types are consistent.
    if (domain !== undefined) {
        if (isOrdinal(domain))
            return asOrdinalType(kind);
        if (isTemporal(domain))
            return "utc";
        if (kind === color && (pivot != null || isDivergingScheme(scheme)))
            return "diverging";
        return "linear";
    }
    // If any channel is ordinal or temporal, it takes priority.
    const values = channels.map(({ value }) => value).filter((value) => value !== undefined);
    if (values.some(isOrdinal))
        return asOrdinalType(kind);
    if (values.some(isTemporal))
        return "utc";
    if (kind === color && (pivot != null || isDivergingScheme(scheme)))
        return "diverging";
    return "linear";
}
// Positional scales default to a point scale instead of an ordinal scale.
function asOrdinalType(kind) {
    switch (kind) {
        case position:
            return "point";
        case color:
            return ordinalImplicit;
        default:
            return "ordinal";
    }
}
function isAll(domain, channels, is) {
    return domain !== undefined
        ? isFirst(domain, is) && isEvery(domain, is)
        : channels.some(({ value }) => value !== undefined && isFirst(value, is)) &&
            channels.every(({ value }) => value === undefined || isEvery(value, is));
}
function isTemporalScale({ type }) {
    return type === "time" || type === "utc";
}
function isOrdinalScale({ type }) {
    return type === "ordinal" || type === "point" || type === "band" || type === ordinalImplicit;
}
function isThresholdScale({ type }) {
    return type === "threshold";
}
function isBandScale({ type }) {
    return type === "point" || type === "band";
}
// If the domain is undefined, we assume an identity scale.
function scaleOrder({ range, domain = range }) {
    return Math.sign(order(domain)) * Math.sign(order(range));
}
// Certain marks have special behavior if a scale is collapsed, i.e. if the
// domain is degenerate and represents only a single value such as [3, 3]; for
// example, a rect will span the full extent of the chart along a collapsed
// dimension (whereas a dot will simply be drawn in the center).
function isCollapsed(scale) {
    if (scale === undefined)
        return true; // treat missing scale as collapsed
    const domain = scale.domain();
    const value = scale(domain[0]);
    for (let i = 1, n = domain.length; i < n; ++i) {
        if (scale(domain[i]) - value) {
            return false;
        }
    }
    return true;
}
// Mutates channel.value!
function coerceType(channels, { domain, ...options }, coerceValues) {
    for (const c of channels) {
        if (c.value !== undefined) {
            c.value = coerceValues(c.value);
        }
    }
    return {
        domain: domain === undefined ? domain : coerceValues(domain),
        ...options
    };
}
function coerceSymbols(values) {
    return map$1(values, maybeSymbol);
}
function coerceDates(values) {
    return map$1(values, coerceDate);
}
// If the values are specified as a typed array, no coercion is required.
function coerceNumbers(values) {
    return isTypedArray(values) ? values : map$1(values, coerceNumber, Float64Array);
}
// Unlike Mark’s number, here we want to convert null and undefined to NaN,
// since the result will be stored in a Float64Array and we don’t want null to
// be coerced to zero.
function coerceNumber(x) {
    return x == null ? NaN : +x;
}
// When coercing strings to dates, we only want to allow the ISO 8601 format
// since the built-in string parsing of the Date constructor varies across
// browsers. (In the future, this could be made more liberal if desired, though
// it is still generally preferable to do date parsing yourself explicitly,
// rather than rely on Plot.) Any non-string values are coerced to number first
// and treated as milliseconds since UNIX epoch.
function coerceDate(x) {
    return x instanceof Date && !isNaN(x)
        ? x
        : typeof x === "string"
            ? parse(x)
            : x == null || isNaN((x = +x))
                ? undefined
                : new Date(x);
}
/** 
 * You can also create a standalone scale with Plot.**scale**(*options*). The *options* object must define at least one scale; see [Scale options](https://github.com/observablehq/plot/blob/main/README.md#scale-options) for how to define a scale. For example, here is a linear color scale with the default domain of [0, 1] and default scheme *turbo*:
 * 
 * ```js
 * const color = Plot.scale({color: {type: "linear"}});
 * ```
 * 
 * #### Scale objects
 * 
 * Both [*plot*.scale](https://github.com/observablehq/plot/blob/main/README.md#plotscalescalename) and [Plot.scale](https://github.com/observablehq/plot/blob/main/README.md#plotscaleoptions) return scale objects. These objects represent the actual (or “materialized”) scale options used by Plot, including the domain, range, interpolate function, *etc.* The scale’s label, if any, is also returned; however, note that other axis properties are not currently exposed. Point and band scales also expose their materialized bandwidth and step.
 * 
 * To reuse a scale across plots, pass the corresponding scale object into another plot specification:
 * 
 * ```js
 * const plot1 = Plot.plot(…);
 * const plot2 = Plot.plot({…, color: plot1.scale("color")});
 * ```
 * 
 * For convenience, scale objects expose a *scale*.**apply**(*input*) method which returns the scale’s output for the given *input* value. When applicable, scale objects also expose a *scale*.**invert**(*output*) method which returns the corresponding input value from the scale’s domain for the given *output* value.
 * 
 */
function scale(options = {}) {
    let scale;
    for (const key in options) {
        if (!registry.has(key))
            continue; // ignore unknown properties
        if (!isScaleOptions(options[key]))
            continue; // e.g., ignore {color: "red"}
        if (scale !== undefined)
            throw new Error("ambiguous scale definition; multiple scales found");
        scale = exposeScale(normalizeScale(key, options[key]));
    }
    if (scale === undefined)
        throw new Error("invalid scale definition; no scale found");
    return scale;
}
function exposeScales(scaleDescriptors) {
    return (key) => {
        if (!registry.has((key = `${key}`)))
            throw new Error(`unknown scale: ${key}`);
        return key in scaleDescriptors ? exposeScale(scaleDescriptors[key]) : undefined;
    };
}
function exposeScale({ scale, type, domain, range, label, interpolate, interval, transform, percent, pivot }) {
    if (type === "identity")
        return { type: "identity", apply: (d) => d, invert: (d) => d };
    const unknown = scale.unknown ? scale.unknown() : undefined;
    return {
        type,
        domain: slice$1(domain),
        ...(range !== undefined && { range: slice$1(range) }),
        ...(transform !== undefined && { transform }),
        ...(percent && { percent }),
        ...(label !== undefined && { label }),
        ...(unknown !== undefined && { unknown }),
        ...(interval !== undefined && { interval }),
        // quantitative
        ...(interpolate !== undefined && { interpolate }),
        ...(scale.clamp && { clamp: scale.clamp() }),
        // diverging (always asymmetric; we never want to apply the symmetric transform twice)
        ...(pivot !== undefined && { pivot, symmetric: false }),
        // log, diverging-log
        ...(scale.base && { base: scale.base() }),
        // pow, diverging-pow
        ...(scale.exponent && { exponent: scale.exponent() }),
        // symlog, diverging-symlog
        ...(scale.constant && { constant: scale.constant() }),
        // band, point
        ...(scale.align && { align: scale.align(), round: scale.round() }),
        ...(scale.padding &&
            (scale.paddingInner
                ? { paddingInner: scale.paddingInner(), paddingOuter: scale.paddingOuter() }
                : { padding: scale.padding() })),
        ...(scale.bandwidth && { bandwidth: scale.bandwidth(), step: scale.step() }),
        // utilities
        apply: (t) => scale(t),
        ...(scale.invert && { invert: (t) => scale.invert(t) })
    };
}

const pi = Math.PI;
const tau = 2 * pi;
const defaultAspectRatio = 0.618;
function Projection({ projection, inset: globalInset = 0, insetTop = globalInset, insetRight = globalInset, insetBottom = globalInset, insetLeft = globalInset } = {}, dimensions) {
    if (projection == null)
        return;
    if (typeof projection.stream === "function")
        return projection; // d3 projection
    let options;
    let domain;
    let clip = "frame";
    // If the projection was specified as an object with additional options,
    // extract those. The order of precedence for insetTop (and other insets) is:
    // projection.insetTop, projection.inset, (global) insetTop, (global) inset.
    // Any other options on this object will be passed through to the initializer.
    if (isObject(projection)) {
        let inset;
        ({
            type: projection,
            domain,
            inset,
            insetTop = inset !== undefined ? inset : insetTop,
            insetRight = inset !== undefined ? inset : insetRight,
            insetBottom = inset !== undefined ? inset : insetBottom,
            insetLeft = inset !== undefined ? inset : insetLeft,
            clip = clip,
            ...options
        } = projection);
        if (projection == null)
            return;
    }
    // For named projections, retrieve the corresponding projection initializer.
    if (typeof projection !== "function")
        ({ type: projection } = namedProjection(projection));
    // Compute the frame dimensions and invoke the projection initializer.
    const { width, height, marginLeft, marginRight, marginTop, marginBottom } = dimensions;
    const dx = width - marginLeft - marginRight - insetLeft - insetRight;
    const dy = height - marginTop - marginBottom - insetTop - insetBottom;
    projection = projection?.({ width: dx, height: dy, clip, ...options });
    // The projection initializer might decide to not use a projection.
    if (projection == null)
        return;
    clip = maybePostClip(clip, marginLeft, marginTop, width - marginRight, height - marginBottom);
    // Translate the origin to the top-left corner, respecting margins and insets.
    let tx = marginLeft + insetLeft;
    let ty = marginTop + insetTop;
    let transform;
    // If a domain is specified, fit the projection to the frame.
    if (domain != null) {
        const [[x0, y0], [x1, y1]] = d3.geoPath(projection).bounds(domain);
        const k = Math.min(dx / (x1 - x0), dy / (y1 - y0));
        if (k > 0) {
            tx -= (k * (x0 + x1) - dx) / 2;
            ty -= (k * (y0 + y1) - dy) / 2;
            transform = d3.geoTransform({
                point(x, y) {
                    this.stream.point(x * k + tx, y * k + ty);
                }
            });
        }
        else {
            warn(`Warning: the projection could not be fit to the specified domain; using the default scale.`);
        }
    }
    transform ??=
        tx === 0 && ty === 0
            ? identity()
            : d3.geoTransform({
                point(x, y) {
                    this.stream.point(x + tx, y + ty);
                }
            });
    return { stream: (s) => projection.stream(transform.stream(clip(s))) };
}
function namedProjection(projection) {
    switch (`${projection}`.toLowerCase()) {
        case "albers-usa":
            return scaleProjection$1(d3.geoAlbersUsa, 0.7463, 0.4673);
        case "albers":
            return conicProjection(d3.geoAlbers, 0.7463, 0.4673);
        case "azimuthal-equal-area":
            return scaleProjection$1(d3.geoAzimuthalEqualArea, 4, 4);
        case "azimuthal-equidistant":
            return scaleProjection$1(d3.geoAzimuthalEquidistant, tau, tau);
        case "conic-conformal":
            return conicProjection(d3.geoConicConformal, tau, tau);
        case "conic-equal-area":
            return conicProjection(d3.geoConicEqualArea, 6.1702, 2.9781);
        case "conic-equidistant":
            return conicProjection(d3.geoConicEquidistant, 7.312, 3.6282);
        case "equal-earth":
            return scaleProjection$1(d3.geoEqualEarth, 5.4133, 2.6347);
        case "equirectangular":
            return scaleProjection$1(d3.geoEquirectangular, tau, pi);
        case "gnomonic":
            return scaleProjection$1(d3.geoGnomonic, 3.4641, 3.4641);
        case "identity":
            return { type: identity };
        case "reflect-y":
            return { type: reflectY };
        case "mercator":
            return scaleProjection$1(d3.geoMercator, tau, tau);
        case "orthographic":
            return scaleProjection$1(d3.geoOrthographic, 2, 2);
        case "stereographic":
            return scaleProjection$1(d3.geoStereographic, 2, 2);
        case "transverse-mercator":
            return scaleProjection$1(d3.geoTransverseMercator, tau, tau);
        default:
            throw new Error(`unknown projection type: ${projection}`);
    }
}
function maybePostClip(clip, x1, y1, x2, y2) {
    if (clip === false || clip == null || typeof clip === "number")
        return (s) => s;
    if (clip === true)
        clip = "frame";
    switch (`${clip}`.toLowerCase()) {
        case "frame":
            return d3.geoClipRectangle(x1, y1, x2, y2);
        default:
            throw new Error(`unknown projection clip type: ${clip}`);
    }
}
function scaleProjection$1(createProjection, kx, ky) {
    return {
        type: ({ width, height, rotate, precision = 0.15, clip }) => {
            const projection = createProjection();
            if (precision != null)
                projection.precision?.(precision);
            if (rotate != null)
                projection.rotate?.(rotate);
            if (typeof clip === "number")
                projection.clipAngle?.(clip);
            projection.scale(Math.min(width / kx, height / ky));
            projection.translate([width / 2, height / 2]);
            return projection;
        },
        aspectRatio: ky / kx
    };
}
function conicProjection(createProjection, kx, ky) {
    const { type, aspectRatio } = scaleProjection$1(createProjection, kx, ky);
    return {
        type: (options) => {
            const { parallels, domain, width, height } = options;
            const projection = type(options);
            if (parallels != null) {
                projection.parallels(parallels);
                if (domain === undefined) {
                    projection.fitSize([width, height], { type: "Sphere" });
                }
            }
            return projection;
        },
        aspectRatio
    };
}
const identity = constant({ stream: (stream) => stream });
const reflectY = constant(d3.geoTransform({
    point(x, y) {
        this.stream.point(x, -y);
    }
}));
// Applies a point-wise projection to the given paired x and y channels.
// Note: mutates values!
function maybeProject(cx, cy, channels, values, context) {
    const x = channels[cx] && channels[cx].scale === "x";
    const y = channels[cy] && channels[cy].scale === "y";
    if (x && y) {
        project(cx, cy, values, context.projection);
    }
    else if (x) {
        throw new Error(`projection requires paired x and y channels; ${cx} is missing ${cy}`);
    }
    else if (y) {
        throw new Error(`projection requires paired x and y channels; ${cy} is missing ${cx}`);
    }
}
function project(cx, cy, values, projection) {
    const x = values[cx];
    const y = values[cy];
    const n = x.length;
    const X = (values[cx] = new Float64Array(n).fill(NaN));
    const Y = (values[cy] = new Float64Array(n).fill(NaN));
    let i;
    const stream = projection.stream({
        point(x, y) {
            X[i] = x;
            Y[i] = y;
        }
    });
    for (i = 0; i < n; ++i) {
        stream.point(x[i], y[i]);
    }
}
// When a named projection is specified, we can use its natural aspect ratio to
// determine a good value for the projection’s height based on the desired
// width. When we don’t have a way to know, the golden ratio is our best guess.
// Due to a circular dependency (we need to know the height before we can
// construct the projection), we have to test the raw projection option rather
// than the materialized projection; therefore we must be extremely careful that
// the logic of this function exactly matches Projection above!
function projectionAspectRatio(projection, geometry) {
    if (typeof projection?.stream === "function")
        return defaultAspectRatio;
    if (isObject(projection))
        projection = projection.type;
    if (projection == null)
        return geometry ? defaultAspectRatio : undefined;
    if (typeof projection !== "function") {
        const { aspectRatio } = namedProjection(projection);
        if (aspectRatio)
            return aspectRatio;
    }
    return defaultAspectRatio;
}
// Extract the (possibly) scaled values for the x and y channels, and apply the
// projection if any.
function Position(channels, scales, context) {
    const position = valueObject({ ...(channels.x && { x: channels.x }), ...(channels.y && { y: channels.y }) }, scales);
    if (context.projection)
        maybeProject("x", "y", channels, position, context);
    if (position.x)
        position.x = coerceNumbers(position.x);
    if (position.y)
        position.y = coerceNumbers(position.y);
    return position;
}

function Context(options = {}, dimensions) {
    const { document = typeof window !== "undefined" ? window.document : undefined } = options;
    return { document, projection: Projection(options, dimensions) };
}
function create(name, { document }) {
    return d3.select(d3.creator(name).call(document.documentElement));
}

const radians = Math.PI / 180;

class AxisX {
    constructor({ name = "x", axis, ticks, tickSize = name === "fx" ? 0 : 6, tickPadding = tickSize === 0 ? 9 : 3, tickFormat, fontVariant, grid, label, labelAnchor, labelOffset, line, tickRotate, ariaLabel, ariaDescription } = {}) {
        this.name = name;
        this.axis = keyword(axis, "axis", ["top", "bottom"]);
        this.ticks = maybeTicks(ticks);
        this.tickSize = number(tickSize);
        this.tickPadding = number(tickPadding);
        this.tickFormat = maybeTickFormat(tickFormat);
        this.fontVariant = impliedString(fontVariant, "normal");
        this.grid = boolean(grid);
        this.label = string(label);
        this.labelAnchor = maybeKeyword(labelAnchor, "labelAnchor", ["center", "left", "right"]);
        this.labelOffset = number(labelOffset);
        this.line = boolean(line);
        this.tickRotate = number(tickRotate);
        this.ariaLabel = string(ariaLabel);
        this.ariaDescription = string(ariaDescription);
    }
    render(index, { [this.name]: x, fy }, { width, height, marginTop, marginRight, marginBottom, marginLeft, offsetLeft = 0, facetMarginTop, facetMarginBottom, labelMarginLeft = 0, labelMarginRight = 0 }, context) {
        const { axis, fontVariant, grid, label, labelAnchor, labelOffset, line, name, tickRotate } = this;
        const offset = name === "x" ? 0 : axis === "top" ? marginTop - facetMarginTop : marginBottom - facetMarginBottom;
        const offsetSign = axis === "top" ? -1 : 1;
        const ty = offsetSign * offset + (axis === "top" ? marginTop : height - marginBottom);
        return create("svg:g", context)
            .call(applyAria, this)
            .attr("transform", `translate(${offsetLeft},${ty})`)
            .call(createAxis(axis === "top" ? d3.axisTop : d3.axisBottom, x, this))
            .call(maybeTickRotate, tickRotate)
            .attr("font-size", null)
            .attr("font-family", null)
            .attr("font-variant", fontVariant)
            .call(!line ? (g) => g.select(".domain").remove() : () => { })
            .call(!grid ? () => { } : fy ? gridFacetX(index, fy, -ty) : gridX(offsetSign * (marginBottom + marginTop - height)))
            .call(!label
            ? () => { }
            : (g) => g
                .append("text")
                .attr("fill", "currentColor")
                .attr("transform", `translate(${labelAnchor === "center"
                ? (width + marginLeft - marginRight) / 2
                : labelAnchor === "right"
                    ? width + labelMarginRight
                    : -labelMarginLeft},${labelOffset * offsetSign})`)
                .attr("dy", axis === "top" ? "1em" : "-0.32em")
                .attr("text-anchor", labelAnchor === "center" ? "middle" : labelAnchor === "right" ? "end" : "start")
                .text(label))
            .node();
    }
}
class AxisY {
    constructor({ name = "y", axis, ticks, tickSize = name === "fy" ? 0 : 6, tickPadding = tickSize === 0 ? 9 : 3, tickFormat, fontVariant, grid, label, labelAnchor, labelOffset, line, tickRotate, ariaLabel, ariaDescription } = {}) {
        this.name = name;
        this.axis = keyword(axis, "axis", ["left", "right"]);
        this.ticks = maybeTicks(ticks);
        this.tickSize = number(tickSize);
        this.tickPadding = number(tickPadding);
        this.tickFormat = maybeTickFormat(tickFormat);
        this.fontVariant = impliedString(fontVariant, "normal");
        this.grid = boolean(grid);
        this.label = string(label);
        this.labelAnchor = maybeKeyword(labelAnchor, "labelAnchor", ["center", "top", "bottom"]);
        this.labelOffset = number(labelOffset);
        this.line = boolean(line);
        this.tickRotate = number(tickRotate);
        this.ariaLabel = string(ariaLabel);
        this.ariaDescription = string(ariaDescription);
    }
    render(index, { [this.name]: y, fx }, { width, height, marginTop, marginRight, marginBottom, marginLeft, offsetTop = 0, facetMarginLeft, facetMarginRight }, context) {
        const { axis, fontVariant, grid, label, labelAnchor, labelOffset, line, name, tickRotate } = this;
        const offset = name === "y" ? 0 : axis === "left" ? marginLeft - facetMarginLeft : marginRight - facetMarginRight;
        const offsetSign = axis === "left" ? -1 : 1;
        const tx = offsetSign * offset + (axis === "right" ? width - marginRight : marginLeft);
        return create("svg:g", context)
            .call(applyAria, this)
            .attr("transform", `translate(${tx},${offsetTop})`)
            .call(createAxis(axis === "right" ? d3.axisRight : d3.axisLeft, y, this))
            .call(maybeTickRotate, tickRotate)
            .attr("font-size", null)
            .attr("font-family", null)
            .attr("font-variant", fontVariant)
            .call(!line ? (g) => g.select(".domain").remove() : () => { })
            .call(!grid ? () => { } : fx ? gridFacetY(index, fx, -tx) : gridY(offsetSign * (marginLeft + marginRight - width)))
            .call(!label
            ? () => { }
            : (g) => g
                .append("text")
                .attr("fill", "currentColor")
                .attr("font-variant", fontVariant == null ? null : "normal")
                .attr("transform", `translate(${labelOffset * offsetSign},${labelAnchor === "center"
                ? (height + marginTop - marginBottom) / 2
                : labelAnchor === "bottom"
                    ? height - marginBottom
                    : marginTop})${labelAnchor === "center" ? ` rotate(-90)` : ""}`)
                .attr("dy", labelAnchor === "center"
                ? axis === "right"
                    ? "-0.32em"
                    : "0.75em"
                : labelAnchor === "bottom"
                    ? "1.4em"
                    : "-1em")
                .attr("text-anchor", labelAnchor === "center" ? "middle" : axis === "right" ? "end" : "start")
                .text(label))
            .node();
    }
}
function applyAria(selection, { name, label, ariaLabel = `${name}-axis`, ariaDescription = label }) {
    applyAttr(selection, "aria-label", ariaLabel);
    applyAttr(selection, "aria-description", ariaDescription);
}
function gridX(y2) {
    return (g) => g.selectAll(".tick line").clone(true).attr("stroke-opacity", 0.1).attr("y2", y2);
}
function gridY(x2) {
    return (g) => g.selectAll(".tick line").clone(true).attr("stroke-opacity", 0.1).attr("x2", x2);
}
function gridFacetX(index, fy, ty) {
    const dy = fy.bandwidth();
    const domain = fy.domain();
    return (g) => g
        .selectAll(".tick")
        .append("path")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .attr("d", (index ? take(domain, index) : domain).map((v) => `M0,${fy(v) + ty}v${dy}`).join(""));
}
function gridFacetY(index, fx, tx) {
    const dx = fx.bandwidth();
    const domain = fx.domain();
    return (g) => g
        .selectAll(".tick")
        .append("path")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .attr("d", (index ? take(domain, index) : domain).map((v) => `M${fx(v) + tx},0h${dx}`).join(""));
}
function maybeTicks(ticks) {
    return ticks === null ? [] : ticks;
}
function maybeTickFormat(tickFormat) {
    return tickFormat === null ? () => null : tickFormat;
}
// D3 doesn’t provide a tick format for ordinal scales; we want shorthand when
// an ordinal domain is numbers or dates, and we want null to mean the empty
// string, not the default identity format.
function maybeAutoTickFormat(tickFormat, domain) {
    return tickFormat === undefined
        ? isTemporal(domain)
            ? formatIsoDate
            : string
        : typeof tickFormat === "function"
            ? tickFormat
            : (typeof tickFormat === "string" ? (isTemporal(domain) ? d3.utcFormat : d3.format) : constant)(tickFormat);
}
function createAxis(axis, scale, { ticks, tickSize, tickPadding, tickFormat }) {
    if (!scale.tickFormat) {
        tickFormat = maybeAutoTickFormat(tickFormat, scale.domain());
    }
    return axis(scale)
        .ticks(Array.isArray(ticks) ? null : ticks, typeof tickFormat === "function" ? null : tickFormat)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : null)
        .tickSizeInner(tickSize)
        .tickSizeOuter(0)
        .tickPadding(tickPadding)
        .tickValues(Array.isArray(ticks) ? ticks : null);
}
function maybeTickRotate(g, rotate) {
    if (!(rotate = +rotate))
        return;
    for (const text of g.selectAll("text")) {
        const x = +text.getAttribute("x");
        const y = +text.getAttribute("y");
        if (Math.abs(y) > Math.abs(x)) {
            const s = Math.sign(y);
            text.setAttribute("transform", `translate(0, ${y + s * 4 * Math.cos(rotate * radians)}) rotate(${rotate})`);
            text.setAttribute("text-anchor", Math.abs(rotate) < 10 ? "middle" : (rotate < 0) ^ (s > 0) ? "start" : "end");
        }
        else {
            const s = Math.sign(x);
            text.setAttribute("transform", `translate(${x + s * 4 * Math.abs(Math.sin(rotate * radians))}, 0) rotate(${rotate})`);
            text.setAttribute("text-anchor", Math.abs(rotate) > 60 ? "middle" : s > 0 ? "start" : "end");
        }
        text.removeAttribute("x");
        text.removeAttribute("y");
        text.setAttribute("dy", "0.32em");
    }
}

function Axes({ x: xScale, y: yScale, fx: fxScale, fy: fyScale }, { x = {}, y = {}, fx = {}, fy = {}, axis = true, grid, line, label, facet: { axis: facetAxis = axis, grid: facetGrid, label: facetLabel = label } = {} } = {}) {
    let { axis: xAxis = axis } = x;
    let { axis: yAxis = axis } = y;
    let { axis: fxAxis = facetAxis } = fx;
    let { axis: fyAxis = facetAxis } = fy;
    if (!xScale)
        xAxis = null;
    else if (xAxis === true)
        xAxis = "bottom";
    if (!yScale)
        yAxis = null;
    else if (yAxis === true)
        yAxis = "left";
    if (!fxScale)
        fxAxis = null;
    else if (fxAxis === true)
        fxAxis = xAxis === "bottom" ? "top" : "bottom";
    if (!fyScale)
        fyAxis = null;
    else if (fyAxis === true)
        fyAxis = yAxis === "left" ? "right" : "left";
    return {
        ...(xAxis && { x: new AxisX({ grid, line, label, fontVariant: inferFontVariant(xScale), ...x, axis: xAxis }) }),
        ...(yAxis && { y: new AxisY({ grid, line, label, fontVariant: inferFontVariant(yScale), ...y, axis: yAxis }) }),
        ...(fxAxis && {
            fx: new AxisX({
                name: "fx",
                grid: facetGrid,
                label: facetLabel,
                fontVariant: inferFontVariant(fxScale),
                ...fx,
                axis: fxAxis
            })
        }),
        ...(fyAxis && {
            fy: new AxisY({
                name: "fy",
                grid: facetGrid,
                label: facetLabel,
                fontVariant: inferFontVariant(fyScale),
                ...fy,
                axis: fyAxis
            })
        })
    };
}
// Mutates axis.ticks!
// TODO Populate tickFormat if undefined, too?
function autoAxisTicks({ x, y, fx, fy }, { x: xAxis, y: yAxis, fx: fxAxis, fy: fyAxis }) {
    if (fxAxis)
        autoAxisTicksK(fx, fxAxis, 80);
    if (fyAxis)
        autoAxisTicksK(fy, fyAxis, 35);
    if (xAxis)
        autoAxisTicksK(x, xAxis, 80);
    if (yAxis)
        autoAxisTicksK(y, yAxis, 35);
}
function autoAxisTicksK(scale, axis, k) {
    if (axis.ticks === undefined) {
        const interval = scale.interval;
        if (interval !== undefined) {
            const [min, max] = d3.extent(scale.scale.domain());
            axis.ticks = interval.range(interval.floor(min), interval.offset(interval.floor(max)));
        }
        else {
            const [min, max] = d3.extent(scale.scale.range());
            axis.ticks = (max - min) / k;
        }
    }
    // D3’s ordinal scales simply use toString by default, but if the ordinal
    // scale domain (or ticks) are numbers or dates (say because we’re applying a
    // time interval to the ordinal scale), we want Plot’s default formatter.
    if (axis.tickFormat === undefined && isOrdinalScale(scale)) {
        axis.tickFormat = formatDefault;
    }
}
// Mutates axis.{label,labelAnchor,labelOffset} and scale.label!
function autoScaleLabels(channels, scales, { x, y, fx, fy }, dimensions, options) {
    if (fx) {
        autoAxisLabelsX(fx, scales.fx, channels.get("fx"));
        if (fx.labelOffset === undefined) {
            const { facetMarginTop, facetMarginBottom } = dimensions;
            fx.labelOffset = fx.axis === "top" ? facetMarginTop : facetMarginBottom;
        }
    }
    if (fy) {
        autoAxisLabelsY(fy, fx, scales.fy, channels.get("fy"));
        if (fy.labelOffset === undefined) {
            const { facetMarginLeft, facetMarginRight } = dimensions;
            fy.labelOffset = fy.axis === "left" ? facetMarginLeft : facetMarginRight;
        }
    }
    if (x) {
        autoAxisLabelsX(x, scales.x, channels.get("x"));
        if (x.labelOffset === undefined) {
            const { marginTop, marginBottom, facetMarginTop, facetMarginBottom } = dimensions;
            x.labelOffset = x.axis === "top" ? marginTop - facetMarginTop : marginBottom - facetMarginBottom;
        }
    }
    if (y) {
        autoAxisLabelsY(y, x, scales.y, channels.get("y"));
        if (y.labelOffset === undefined) {
            const { marginRight, marginLeft, facetMarginLeft, facetMarginRight } = dimensions;
            y.labelOffset = y.axis === "left" ? marginLeft - facetMarginLeft : marginRight - facetMarginRight;
        }
    }
    for (const [key, type] of registry) {
        if (type !== position && scales[key]) {
            // not already handled above
            autoScaleLabel(key, scales[key], channels.get(key), options[key]);
        }
    }
}
// Mutates axis.labelAnchor, axis.label, scale.label!
function autoAxisLabelsX(axis, scale, channels) {
    if (axis.labelAnchor === undefined) {
        axis.labelAnchor = isOrdinalScale(scale) ? "center" : scaleOrder(scale) < 0 ? "left" : "right";
    }
    if (axis.label === undefined) {
        axis.label = inferLabel(channels, scale, axis, "x");
    }
    scale.label = axis.label;
}
// Mutates axis.labelAnchor, axis.label, scale.label!
function autoAxisLabelsY(axis, opposite, scale, channels) {
    if (axis.labelAnchor === undefined) {
        axis.labelAnchor = isOrdinalScale(scale)
            ? "center"
            : opposite && opposite.axis === "top"
                ? "bottom" // TODO scaleOrder?
                : "top";
    }
    if (axis.label === undefined) {
        axis.label = inferLabel(channels, scale, axis, "y");
    }
    scale.label = axis.label;
}
// Mutates scale.label!
function autoScaleLabel(key, scale, channels, options) {
    if (options) {
        scale.label = options.label;
    }
    if (scale.label === undefined) {
        scale.label = inferLabel(channels, scale, null, key);
    }
}
// Channels can have labels; if all the channels for a given scale are
// consistently labeled (i.e., have the same value if not undefined), and the
// corresponding axis doesn’t already have an explicit label, then the channels’
// label is promoted to the corresponding axis.
function inferLabel(channels = [], scale, axis, key) {
    let candidate;
    for (const { label } of channels) {
        if (label === undefined)
            continue;
        if (candidate === undefined)
            candidate = label;
        else if (candidate !== label)
            return;
    }
    if (candidate !== undefined) {
        // Ignore the implicit label for temporal scales if it’s simply “date”.
        if (isTemporalScale(scale) && /^(date|time|year)$/i.test(candidate))
            return;
        if (!isOrdinalScale(scale)) {
            if (scale.percent)
                candidate = `${candidate} (%)`;
            if (key === "x" || key === "y") {
                const order = scaleOrder(scale);
                if (order) {
                    if (key === "x" || (axis && axis.labelAnchor === "center")) {
                        candidate = (key === "x") === order < 0 ? `← ${candidate}` : `${candidate} →`;
                    }
                    else {
                        candidate = `${order < 0 ? "↑ " : "↓ "}${candidate}`;
                    }
                }
            }
        }
    }
    return candidate;
}
function inferFontVariant(scale) {
    return isOrdinalScale(scale) && scale.interval === undefined ? undefined : "tabular-nums";
}

function Dimensions(scales, geometry, axes, options = {}) {
    // The default margins depend on the presence and orientation of axes. If the
    // corresponding scale is not present, the axis is necessarily null.
    const { x: { axis: x } = {}, y: { axis: y } = {}, fx: { axis: fx } = {}, fy: { axis: fy } = {} } = axes;
    // Compute the default facet margins. When faceting is not present (and hence
    // the fx and fy axis are null), these will all be zero.
    let { facet: { margin: facetMargin, marginTop: facetMarginTop = facetMargin !== undefined ? facetMargin : fx === "top" ? 30 : 0, marginRight: facetMarginRight = facetMargin !== undefined ? facetMargin : fy === "right" ? 40 : 0, marginBottom: facetMarginBottom = facetMargin !== undefined ? facetMargin : fx === "bottom" ? 30 : 0, marginLeft: facetMarginLeft = facetMargin !== undefined ? facetMargin : fy === "left" ? 40 : 0 } = {} } = options;
    // Coerce the facet margin options to numbers.
    facetMarginTop = +facetMarginTop;
    facetMarginRight = +facetMarginRight;
    facetMarginBottom = +facetMarginBottom;
    facetMarginLeft = +facetMarginLeft;
    // Compute the default margins; while not always used, they may be needed to
    // compute the default height of the plot.
    const marginTopDefault = Math.max((x === "top" ? 30 : 0) + facetMarginTop, y || fy ? 20 : 0.5 - offset);
    const marginBottomDefault = Math.max((x === "bottom" ? 30 : 0) + facetMarginBottom, y || fy ? 20 : 0.5 + offset);
    const marginRightDefault = Math.max((y === "right" ? 40 : 0) + facetMarginRight, x || fx ? 20 : 0.5 + offset);
    const marginLeftDefault = Math.max((y === "left" ? 40 : 0) + facetMarginLeft, x || fx ? 20 : 0.5 - offset);
    // Compute the actual margins. The order of precedence is: the side-specific
    // margin options, then the global margin option, then the defaults.
    let { margin, marginTop = margin !== undefined ? margin : marginTopDefault, marginRight = margin !== undefined ? margin : marginRightDefault, marginBottom = margin !== undefined ? margin : marginBottomDefault, marginLeft = margin !== undefined ? margin : marginLeftDefault } = options;
    // Coerce the margin options to numbers.
    marginTop = +marginTop;
    marginRight = +marginRight;
    marginBottom = +marginBottom;
    marginLeft = +marginLeft;
    // Compute the outer dimensions of the plot. If the top and bottom margins are
    // specified explicitly, adjust the automatic height accordingly.
    let { width = 640, height = autoHeight(scales, geometry, options, {
        width,
        marginTopDefault,
        marginBottomDefault,
        marginRightDefault,
        marginLeftDefault
    }) + Math.max(0, marginTop - marginTopDefault + marginBottom - marginBottomDefault) } = options;
    // Coerce the width and height.
    width = +width;
    height = +height;
    return {
        width,
        height,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        facetMarginTop,
        facetMarginRight,
        facetMarginBottom,
        facetMarginLeft
    };
}
function autoHeight({ y, fy, fx }, geometry, { projection }, { width, marginTopDefault, marginBottomDefault, marginRightDefault, marginLeftDefault }) {
    const nfy = fy ? fy.scale.domain().length : 1;
    // If a projection is specified, use its natural aspect ratio (if known).
    const ar = projectionAspectRatio(projection, geometry);
    if (ar) {
        const nfx = fx ? fx.scale.domain().length : 1;
        const far = ((1.1 * nfy - 0.1) / (1.1 * nfx - 0.1)) * ar; // 0.1 is default facet padding
        const lar = Math.max(0.1, Math.min(10, far)); // clamp the aspect ratio to a “reasonable” value
        return Math.round((width - marginLeftDefault - marginRightDefault) * lar + marginTopDefault + marginBottomDefault);
    }
    const ny = y ? (isOrdinalScale(y) ? y.scale.domain().length : Math.max(7, 17 / nfy)) : 1;
    return !!(y || fy) * Math.max(1, Math.min(60, ny * nfy)) * 20 + !!fx * 30 + 60;
}

function legendRamp(color, options) {
    let { label = color.label, tickSize = 6, width = 240, height = 44 + tickSize, marginTop = 18, marginRight = 0, marginBottom = 16 + tickSize, marginLeft = 0, style, ticks = (width - marginLeft - marginRight) / 64, tickFormat, fontVariant = inferFontVariant(color), round = true, className } = options;
    const context = Context(options);
    className = maybeClassName(className);
    if (tickFormat === null)
        tickFormat = () => null;
    const svg = create("svg", context)
        .attr("class", className)
        .attr("font-family", "system-ui, sans-serif")
        .attr("font-size", 10)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .call((svg) => svg.append("style").text(`
        .${className} {
          display: block;
          background: white;
          height: auto;
          height: intrinsic;
          max-width: 100%;
          overflow: visible;
        }
        .${className} text {
          white-space: pre;
        }
      `))
        .call(applyInlineStyles, style);
    let tickAdjust = (g) => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;
    // Some D3 scales use scale.interpolate, some scale.interpolator, and some
    // scale.round; this normalizes the API so it works with all scale types.
    const applyRange = round ? (x, range) => x.rangeRound(range) : (x, range) => x.range(range);
    const { type, domain, range, interpolate, scale, pivot } = color;
    // Continuous
    if (interpolate) {
        // Often interpolate is a “fixed” interpolator on the [0, 1] interval, as
        // with a built-in color scheme, but sometimes it is a function that takes
        // two arguments and is used in conjunction with the range.
        const interpolator = range === undefined
            ? interpolate
            : d3.piecewise(interpolate.length === 1 ? interpolatePiecewise(interpolate) : interpolate, range);
        // Construct a D3 scale of the same type, but with a range that evenly
        // divides the horizontal extent of the legend. (In the common case, the
        // domain.length is two, and so the range is simply the extent.) For a
        // diverging scale, we need an extra point in the range for the pivot such
        // that the pivot is always drawn in the middle.
        x = applyRange(scale.copy(), d3.quantize(d3.interpolateNumber(marginLeft, width - marginRight), Math.min(domain.length + (pivot !== undefined), range === undefined ? Infinity : range.length)));
        // Construct a 256×1 canvas, filling each pixel using the interpolator.
        const n = 256;
        const canvas = context.document.createElement("canvas");
        canvas.width = n;
        canvas.height = 1;
        const context2 = canvas.getContext("2d");
        for (let i = 0, j = n - 1; i < n; ++i) {
            context2.fillStyle = interpolator(i / j);
            context2.fillRect(i, 0, 1, 1);
        }
        svg
            .append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", canvas.toDataURL());
    }
    // Threshold
    else if (type === "threshold") {
        const thresholds = domain;
        const thresholdFormat = tickFormat === undefined ? (d) => d : typeof tickFormat === "string" ? d3.format(tickFormat) : tickFormat;
        // Construct a linear scale with evenly-spaced ticks for each of the
        // thresholds; the domain extends one beyond the threshold extent.
        x = applyRange(d3.scaleLinear().domain([-1, range.length - 1]), [marginLeft, width - marginRight]);
        svg
            .append("g")
            .selectAll()
            .data(range)
            .enter()
            .append("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", marginTop)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", (d) => d);
        ticks = map$1(thresholds, (_, i) => i);
        tickFormat = (i) => thresholdFormat(thresholds[i], i);
    }
    // Ordinal (hopefully!)
    else {
        x = applyRange(d3.scaleBand().domain(domain), [marginLeft, width - marginRight]);
        svg
            .append("g")
            .selectAll()
            .data(domain)
            .enter()
            .append("rect")
            .attr("x", x)
            .attr("y", marginTop)
            .attr("width", Math.max(0, x.bandwidth() - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", scale);
        tickAdjust = () => { };
    }
    svg
        .append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
        .ticks(Array.isArray(ticks) ? null : ticks, typeof tickFormat === "string" ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(Array.isArray(ticks) ? ticks : null))
        .attr("font-size", null)
        .attr("font-family", null)
        .attr("font-variant", impliedString(fontVariant, "normal"))
        .call(tickAdjust)
        .call((g) => g.select(".domain").remove());
    if (label !== undefined) {
        svg
            .append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop - 6)
            .attr("fill", "currentColor") // TODO move to stylesheet?
            .attr("font-weight", "bold")
            .text(label);
    }
    return svg.node();
}

function maybeScale(scale, key) {
    if (key == null)
        return key;
    const s = scale(key);
    if (!s)
        throw new Error(`scale not found: ${key}`);
    return s;
}
function legendSwatches(color, options) {
    if (!isOrdinalScale(color) && !isThresholdScale(color))
        throw new Error(`swatches legend requires ordinal or threshold color scale (not ${color.type})`);
    return legendItems(color, options, (selection, scale) => selection.append("svg").attr("fill", scale.scale).append("rect").attr("width", "100%").attr("height", "100%"), (className) => `.${className}-swatch svg {
        width: var(--swatchWidth);
        height: var(--swatchHeight);
        margin-right: 0.5em;
      }`);
}
function legendSymbols(symbol, { fill = symbol.hint?.fill !== undefined ? symbol.hint.fill : "none", fillOpacity = 1, stroke = symbol.hint?.stroke !== undefined ? symbol.hint.stroke : isNoneish(fill) ? "currentColor" : "none", strokeOpacity = 1, strokeWidth = 1.5, r = 4.5, ...options } = {}, scale) {
    const [vf, cf] = maybeColorChannel(fill);
    const [vs, cs] = maybeColorChannel(stroke);
    const sf = maybeScale(scale, vf);
    const ss = maybeScale(scale, vs);
    const size = r * r * Math.PI;
    fillOpacity = maybeNumberChannel(fillOpacity)[1];
    strokeOpacity = maybeNumberChannel(strokeOpacity)[1];
    strokeWidth = maybeNumberChannel(strokeWidth)[1];
    return legendItems(symbol, options, (selection) => selection
        .append("svg")
        .attr("viewBox", "-8 -8 16 16")
        .attr("fill", vf === "color" ? (d) => sf.scale(d) : null)
        .attr("stroke", vs === "color" ? (d) => ss.scale(d) : null)
        .append("path")
        .attr("d", (d) => {
        const p = d3.path();
        symbol.scale(d).draw(p, size);
        return p;
    }), (className) => `.${className}-swatch > svg {
        width: var(--swatchWidth);
        height: var(--swatchHeight);
        margin-right: 0.5em;
        overflow: visible;
        fill: ${cf};
        fill-opacity: ${fillOpacity};
        stroke: ${cs};
        stroke-width: ${strokeWidth}px;
        stroke-opacity: ${strokeOpacity};
      }`);
}
function legendItems(scale, options = {}, swatch, swatchStyle) {
    let { columns, tickFormat, fontVariant = inferFontVariant(scale), 
    // TODO label,
    swatchSize = 15, swatchWidth = swatchSize, swatchHeight = swatchSize, marginLeft = 0, className, style, width } = options;
    const context = Context(options);
    className = maybeClassName(className);
    tickFormat = maybeAutoTickFormat(tickFormat, scale.domain);
    const swatches = create("div", context)
        .attr("class", className)
        .attr("style", `
        --swatchWidth: ${+swatchWidth}px;
        --swatchHeight: ${+swatchHeight}px;
      `);
    let extraStyle;
    if (columns != null) {
        extraStyle = `
      .${className}-swatch {
        display: flex;
        align-items: center;
        break-inside: avoid;
        padding-bottom: 1px;
      }
      .${className}-swatch::before {
        flex-shrink: 0;
      }
      .${className}-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
        swatches
            .style("columns", columns)
            .selectAll()
            .data(scale.domain)
            .enter()
            .append("div")
            .attr("class", `${className}-swatch`)
            .call(swatch, scale)
            .call((item) => item.append("div").attr("class", `${className}-label`).attr("title", tickFormat).text(tickFormat));
    }
    else {
        extraStyle = `
      .${className} {
        display: flex;
        align-items: center;
        min-height: 33px;
        flex-wrap: wrap;
      }
      .${className}-swatch {
        display: inline-flex;
        align-items: center;
        margin-right: 1em;
      }
    `;
        swatches
            .selectAll()
            .data(scale.domain)
            .enter()
            .append("span")
            .attr("class", `${className}-swatch`)
            .call(swatch, scale)
            .append(function () {
            return this.ownerDocument.createTextNode(tickFormat.apply(this, arguments));
        });
    }
    return swatches
        .call((div) => div.insert("style", "*").text(`
        .${className} {
          font-family: system-ui, sans-serif;
          font-size: 10px;
          margin-bottom: 0.5em;${marginLeft === undefined
        ? ""
        : `
          margin-left: ${+marginLeft}px;`}${width === undefined
        ? ""
        : `
          width: ${width}px;`}
        }
        ${swatchStyle(className)}
        ${extraStyle}
      `))
        .style("font-variant", impliedString(fontVariant, "normal"))
        .call(applyInlineStyles, style)
        .node();
}

const legendRegistry = new Map([
    ["symbol", legendSymbols],
    ["color", legendColor],
    ["opacity", legendOpacity]
]);
/** 
 * Returns a standalone legend for the scale defined by the given *options* object. The *options* object must define at least one scale; see [Scale options](https://github.com/observablehq/plot/blob/main/README.md#scale-options) for how to define a scale. For example, here is a ramp legend of a linear color scale with the default domain of [0, 1] and default scheme *turbo*:
 * 
 * ```js
 * Plot.legend({color: {type: "linear"}})
 * ```
 * 
 * The *options* object may also include any additional legend options described in the previous section. For example, to make the above legend slightly wider:
 * 
 * ```js
 * Plot.legend({
 *   width: 320,
 *   color: {
 *     type: "linear"
 *   }
 * })
 * ```
 * 
 */
function legend(options = {}) {
    for (const [key, value] of legendRegistry) {
        const scale = options[key];
        if (isScaleOptions(scale)) {
            // e.g., ignore {color: "red"}
            const context = Context(options);
            let hint;
            // For symbol legends, pass a hint to the symbol scale.
            if (key === "symbol") {
                const { fill, stroke = fill === undefined && isScaleOptions(options.color) ? "color" : undefined } = options;
                hint = { fill, stroke };
            }
            return value(normalizeScale(key, scale, hint), legendOptions(context, scale, options), (key) => isScaleOptions(options[key]) ? normalizeScale(key, options[key]) : null);
        }
    }
    throw new Error("unknown legend type; no scale found");
}
function exposeLegends(scales, context, defaults = {}) {
    return (key, options) => {
        if (!legendRegistry.has(key))
            throw new Error(`unknown legend type: ${key}`);
        if (!(key in scales))
            return;
        return legendRegistry.get(key)(scales[key], legendOptions(context, defaults[key], options), (key) => scales[key]);
    };
}
function legendOptions(context, { label, ticks, tickFormat } = {}, options) {
    return inherit(options, context, { label, ticks, tickFormat });
}
function legendColor(color, { legend = true, ...options }) {
    if (legend === true)
        legend = color.type === "ordinal" ? "swatches" : "ramp";
    if (color.domain === undefined)
        return;
    switch (`${legend}`.toLowerCase()) {
        case "swatches":
            return legendSwatches(color, options);
        case "ramp":
            return legendRamp(color, options);
        default:
            throw new Error(`unknown legend type: ${legend}`);
    }
}
function legendOpacity({ type, interpolate, ...scale }, { legend = true, color = d3.rgb(0, 0, 0), ...options }) {
    if (!interpolate)
        throw new Error(`${type} opacity scales are not supported`);
    if (legend === true)
        legend = "ramp";
    if (`${legend}`.toLowerCase() !== "ramp")
        throw new Error(`${legend} opacity legends are not supported`);
    return legendColor({ type, ...scale, interpolate: interpolateOpacity(color) }, { legend, ...options });
}
function interpolateOpacity(color) {
    const { r, g, b } = d3.rgb(color) || d3.rgb(0, 0, 0); // treat invalid color as black
    return (t) => `rgba(${r},${g},${b},${t})`;
}
function Legends(scales, context, options) {
    const legends = [];
    for (const [key, value] of legendRegistry) {
        const o = options[key];
        if (o?.legend && key in scales) {
            const legend = value(scales[key], legendOptions(context, scales[key], o), (key) => scales[key]);
            if (legend != null)
                legends.push(legend);
        }
    }
    return legends;
}

// This symbol is used by interactive marks to define which data are selected. A
// node returned by mark.render may expose a selection as node[selection], whose
// value may be an array of numbers (e.g., [0, 1, 2, …]) representing an
// in-order subset of the rendered index, or null if the selection is undefined.
// The selection can be updated during interaction by emitting an input event.
const selection = Symbol("selection");
// Given two (possibly null, possibly an index, but not undefined) selections,
// returns true if the two represent the same selection, and false otherwise.
// This assumes that the selection is a in-order subset of the original index.
function selectionEquals(s1, s2) {
    if (s1 === s2)
        return true;
    if (s1 == null || s2 == null)
        return false;
    const n = s1.length;
    if (n !== s2.length)
        return false;
    for (let i = 0; i < n; ++i)
        if (s1[i] !== s2[i])
            return false;
    return true;
}

/** 
 * Renders a new plot given the specified *options* and returns the corresponding SVG or HTML figure element. All *options* are optional.
 * 
 * ### Mark options
 * 
 * The **marks** option specifies an array of [marks](https://github.com/observablehq/plot/blob/main/README.md#marks) to render. Each mark has its own data and options; see the respective mark type (*e.g.*, [bar](https://github.com/observablehq/plot/blob/main/README.md#bar) or [dot](https://github.com/observablehq/plot/blob/main/README.md#dot)) for which mark options are supported. Each mark may be a nested array of marks, allowing composition. Marks may also be a function which returns an SVG element, if you wish to insert some arbitrary content into your plot. And marks may be null or undefined, which produce no output; this is useful for showing marks conditionally (*e.g.*, when a box is checked). Marks are drawn in *z* order, last on top. For example, here a single rule at *y* = 0 is drawn on top of blue bars for the [*alphabet* dataset](https://github.com/observablehq/plot/blob/main/test/data/alphabet.csv).
 * 
 * ```js
 * Plot.plot({
 *   marks: [
 *     Plot.barY(alphabet, {x: "letter", y: "frequency", fill: "steelblue"}),
 *     Plot.ruleY([0])
 *   ]
 * })
 * ```
 * 
 * ### Layout options
 * 
 * These options determine the overall layout of the plot; all are specified as numbers in pixels:
 * 
 * * **marginTop** - the top margin
 * * **marginRight** - the right margin
 * * **marginBottom** - the bottom margin
 * * **marginLeft** - the left margin
 * * **margin** - shorthand for the four margins
 * * **width** - the outer width of the plot (including margins)
 * * **height** - the outer height of the plot (including margins)
 * 
 * The default **width** is 640. On Observable, the width can be set to the [standard width](https://github.com/observablehq/stdlib/blob/main/README.md#width) to make responsive plots. The default **height** is chosen automatically based on the plot’s associated scales; for example, if *y* is linear and there is no *fy* scale, it might be 396.
 * 
 * The default margins depend on the plot’s axes: for example, **marginTop** and **marginBottom** are at least 30 if there is a corresponding top or bottom *x* axis, and **marginLeft** and **marginRight** are at least 40 if there is a corresponding left or right *y* axis. For simplicity’s sake and for consistent layout across plots, margins are not automatically sized to make room for tick labels; instead, shorten your tick labels or increase the margins as needed. (In the future, margins may be specified indirectly via a scale property to make it easier to reorient axes without adjusting margins; see [#210](https://github.com/observablehq/plot/issues/210).)
 * 
 * The **style** option allows custom styles to override Plot’s defaults. It may be specified either as a string of inline styles (*e.g.*, `"color: red;"`, in the same fashion as assigning [*element*.style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style)) or an object of properties (*e.g.*, `{color: "red"}`, in the same fashion as assigning [*element*.style properties](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration)). Note that unitless numbers ([quirky lengths](https://www.w3.org/TR/css-values-4/#deprecated-quirky-length)) such as `{padding: 20}` may not supported by some browsers; you should instead specify a string with units such as `{padding: "20px"}`. By default, the returned plot has a white background, a max-width of 100%, and the system-ui font. Plot’s marks and axes default to [currentColor](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword), meaning that they will inherit the surrounding content’s color. For example, a dark theme:
 * 
 * ```js
 * Plot.plot({
 *   marks: …,
 *   style: {
 *     background: "black",
 *     color: "white"
 *   }
 * })
 * ```
 * 
 * If a **caption** is specified, Plot.plot wraps the generated SVG element in an HTML figure element with a figcaption, returning the figure. To specify an HTML caption, consider using the [`html` tagged template literal](http://github.com/observablehq/htl); otherwise, the specified string represents text that will be escaped as needed.
 * 
 * ```js
 * Plot.plot({
 *   marks: …,
 *   caption: html`Figure 1. This chart has a <i>fancy</i> caption.`
 * })
 * ```
 * 
 * The generated SVG element has a random class name which applies a default stylesheet. Use the top-level **className** option to specify that class name.
 * 
 * The **document** option specifies the [document](https://developer.mozilla.org/en-US/docs/Web/API/Document) used to create plot elements. It defaults to window.document, but can be changed to another document, say when using a virtual DOM library for server-side rendering in Node.
 * 
 * ### Scale options
 * 
 * Plot passes data through [scales](https://observablehq.com/@observablehq/plot-scales) as needed before rendering marks. A scale maps abstract values such as time or temperature to visual values such as position or color. Within a given plot, marks share scales. For example, if a plot has two Plot.line marks, both share the same *x* and *y* scales for a consistent representation of data. (Plot does not currently support dual-axis charts, which are [not advised](https://blog.datawrapper.de/dualaxis/).)
 * 
 * ```js
 * Plot.plot({
 *   marks: [
 *     Plot.line(aapl, {x: "Date", y: "Close"}),
 *     Plot.line(goog, {x: "Date", y: "Close"})
 *   ]
 * })
 * ```
 * 
 * Each scale’s options are specified as a nested options object with the corresponding scale name within the top-level plot *options*:
 * 
 * * **x** - horizontal position
 * * **y** - vertical position
 * * **r** - radius (size)
 * * **color** - fill or stroke
 * * **opacity** - fill or stroke opacity
 * * **length** - linear length (for [vectors](https://github.com/observablehq/plot/blob/main/README.md#vector))
 * * **symbol** - categorical symbol (for [dots](https://github.com/observablehq/plot/blob/main/README.md#dot))
 * 
 * For example, to set the domain for the *x* and *y* scales:
 * 
 * ```js
 * Plot.plot({
 *   x: {
 *     domain: [new Date("1880-01-01"), new Date("2016-11-01")]
 *   },
 *   y: {
 *     domain: [-0.78, 1.35]
 *   }
 * })
 * ```
 * 
 * Plot supports many scale types. Some scale types are for quantitative data: values that can be added or subtracted, such as temperature or time. Other scale types are for ordinal or categorical data: unquantifiable values that can only be ordered, such as t-shirt sizes, or values with no inherent order that can only be tested for equality, such as types of fruit. Some scale types are further intended for specific visual encodings: for example, as [position](https://github.com/observablehq/plot/blob/main/README.md#position-options) or [color](https://github.com/observablehq/plot/blob/main/README.md#color-options).
 * 
 * You can set the scale type explicitly via the *scale*.**type** option, though typically the scale type is inferred automatically. Some marks mandate a particular scale type: for example, [Plot.barY](https://github.com/observablehq/plot/blob/main/README.md#plotbarydata-options) requires that the *x* scale is a *band* scale. Some scales have a default type: for example, the *radius* scale defaults to *sqrt* and the *opacity* scale defaults to *linear*. Most often, the scale type is inferred from associated data, pulled either from the domain (if specified) or from associated channels. A *color* scale defaults to *identity* if no range or scheme is specified and all associated defined values are valid CSS color strings. Otherwise, strings and booleans imply an ordinal scale; dates imply a UTC scale; and anything else is linear. Unless they represent text, we recommend explicitly converting strings to more specific types when loading data (*e.g.*, with d3.autoType or Observable’s FileAttachment). For simplicity’s sake, Plot assumes that data is consistently typed; type inference is based solely on the first non-null, non-undefined value.
 * 
 * For quantitative data (*i.e.* numbers), a mathematical transform may be applied to the data by changing the scale type:
 * 
 * * *linear* (default) - linear transform (translate and scale)
 * * *pow* - power (exponential) transform
 * * *sqrt* - square-root transform (*pow* transform with exponent = 0.5)
 * * *log* - logarithmic transform
 * * *symlog* - bi-symmetric logarithmic transform per [Webber *et al.*](https://www.researchgate.net/publication/233967063_A_bi-symmetric_log_transformation_for_wide-range_data)
 * 
 * The appropriate transform depends on the data’s distribution and what you wish to know. A *sqrt* transform exaggerates differences between small values at the expense of large values; it is a special case of the *pow* transform which has a configurable *scale*.**exponent** (0.5 for *sqrt*). A *log* transform is suitable for comparing orders of magnitude and can only be used when the domain does not include zero. The base defaults to 10 and can be specified with the *scale*.**base** option; note that this only affects the axis ticks and not the scale’s behavior. A *symlog* transform is more elaborate, but works well with wide-range values that include zero; it can be configured with the *scale*.**constant** option (default 1).
 * 
 * For temporal data (*i.e.* dates), two variants of a *linear* scale are also supported:
 * 
 * * *utc* (default, recommended) - UTC time
 * * *time* - local time
 * 
 * UTC is recommended over local time as charts in UTC time are guaranteed to appear consistently to all viewers whereas charts in local time will depend on the viewer’s time zone. Due to limitations in JavaScript’s Date class, Plot does not yet support an explicit time zone other than UTC.
 * 
 * For ordinal data (*e.g.*, strings), use the *ordinal* scale type or the *point* or *band* [position scale types](https://github.com/observablehq/plot/blob/main/README.md#position-options). The *categorical* scale type is also supported; it is equivalent to *ordinal* except as a [color scale](https://github.com/observablehq/plot/blob/main/README.md#color-options), where it provides a different default color scheme. (Since position is inherently ordinal or even quantitative, categorical data must be assigned an effective order when represented as position, and hence *categorical* and *ordinal* may be considered synonymous in context.)
 * 
 * You can opt-out of a scale using the *identity* scale type. This is useful if you wish to specify literal colors or pixel positions within a mark channel rather than relying on the scale to convert abstract values into visual values. For position scales (*x* and *y*), an *identity* scale is still quantitative and may produce an axis, yet unlike a *linear* scale the domain and range are fixed based on the plot layout.
 * 
 * Quantitative scales, as well as identity position scales, coerce channel values to numbers; both null and undefined are coerced to NaN. Similarly, time scales coerce channel values to dates; numbers are assumed to be milliseconds since UNIX epoch, while strings are assumed to be in [ISO 8601 format](https://github.com/mbostock/isoformat/blob/main/README.md#parsedate-fallback).
 * 
 * A scale’s domain (the extent of its inputs, abstract values) and range (the extent of its outputs, visual values) are typically inferred automatically. You can set them explicitly using these options:
 * 
 * * *scale*.**domain** - typically [*min*, *max*], or an array of ordinal or categorical values
 * * *scale*.**range** - typically [*min*, *max*], or an array of ordinal or categorical values
 * * *scale*.**unknown** - the desired output value (defaults to undefined) for invalid input values
 * * *scale*.**reverse** - reverses the domain (or in somes cases, the range), say to flip the chart along *x* or *y*
 * * *scale*.**interval** - an interval or time interval (for interval data; see below)
 * 
 * For most quantitative scales, the default domain is the [*min*, *max*] of all values associated with the scale. For the *radius* and *opacity* scales, the default domain is [0, *max*] to ensure a meaningful value encoding. For ordinal scales, the default domain is the set of all distinct values associated with the scale in natural ascending order; for a different order, set the domain explicitly or add a [sort option](https://github.com/observablehq/plot/blob/main/README.md#sort-options) to an associated mark. For threshold scales, the default domain is [0] to separate negative and non-negative values. For quantile scales, the default domain is the set of all defined values associated with the scale. If a scale is reversed, it is equivalent to setting the domain as [*max*, *min*] instead of [*min*, *max*].
 * 
 * The default range depends on the scale: for [position scales](https://github.com/observablehq/plot/blob/main/README.md#position-options) (*x*, *y*, *fx*, and *fy*), the default range depends on the plot’s [size and margins](https://github.com/observablehq/plot/blob/main/README.md#layout-options). For [color scales](https://github.com/observablehq/plot/blob/main/README.md#color-options), there are default color schemes for quantitative, ordinal, and categorical data. For opacity, the default range is [0, 1]. And for radius, the default range is designed to produce dots of “reasonable” size assuming a *sqrt* scale type for accurate area representation: zero maps to zero, the first quartile maps to a radius of three pixels, and other values are extrapolated. This convention for radius ensures that if the scale’s data values are all equal, dots have the default constant radius of three pixels, while if the data varies, dots will tend to be larger.
 * 
 * The behavior of the *scale*.**unknown** option depends on the scale type. For quantitative and temporal scales, the unknown value is used whenever the input value is undefined, null, or NaN. For ordinal or categorical scales, the unknown value is returned for any input value outside the domain. For band or point scales, the unknown option has no effect; it is effectively always equal to undefined. If the unknown option is set to undefined (the default), or null or NaN, then the affected input values will be considered undefined and filtered from the output.
 * 
 * For data at regular intervals, such as integer values or daily samples, the *scale*.**interval** option can be used to enforce uniformity. The specified *interval*—such as d3.utcMonth—must expose an *interval*.floor(*value*), *interval*.offset(*value*), and *interval*.range(*start*, *stop*) functions. The option can also be specified as a number, in which case it will be promoted to a numeric interval with the given step. This option sets the default *scale*.transform to the given interval’s *interval*.floor function. In addition, the default *scale*.domain is an array of uniformly-spaced values spanning the extent of the values associated with the scale.
 * 
 * Quantitative scales can be further customized with additional options:
 * 
 * * *scale*.**clamp** - if true, clamp input values to the scale’s domain
 * * *scale*.**nice** - if true (or a tick count), extend the domain to nice round values
 * * *scale*.**zero** - if true, extend the domain to include zero if needed
 * * *scale*.**percent** - if true, transform proportions in [0, 1] to percentages in [0, 100]
 * 
 * Clamping is typically used in conjunction with setting an explicit domain since if the domain is inferred, no values will be outside the domain. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Top-level **clamp**, **nice**, and **zero** options are supported as shorthand for setting the respective option on all scales.
 * 
 * The *scale*.**transform** option allows you to apply a function to all values before they are passed through the scale. This is convenient for transforming a scale’s data, say to convert to thousands or between temperature units.
 * 
 * ```js
 * Plot.plot({
 *   y: {
 *     label: "↑ Temperature (°F)",
 *     transform: f => f * 9 / 5 + 32 // convert Celsius to Fahrenheit
 *   },
 *   marks: …
 * })
 * ```
 * 
 */
function plot(options = {}) {
    const { facet, style, caption, ariaLabel, ariaDescription } = options;
    // className for inline styles
    const className = maybeClassName(options.className);
    // Flatten any nested marks.
    const marks = options.marks === undefined ? [] : options.marks.flat(Infinity).map(markify);
    // Compute the top-level facet state. This has roughly the same structure as
    // mark-specific facet state, except there isn’t a facetsIndex, and there’s a
    // data and dataLength so we can warn the user if a different data of the same
    // length is used in a mark.
    const topFacetState = maybeTopFacet(facet, options);
    // Construct a map from (faceted) Mark instance to facet state, including:
    // channels - an {fx?, fy?} object to add to the fx and fy scale
    // groups - a possibly-nested map from facet values to indexes in the data array
    // facetsIndex - a sparse nested array of indices corresponding to the valid facets
    const facetStateByMark = new Map();
    for (const mark of marks) {
        const facetState = maybeMarkFacet(mark, topFacetState, options);
        if (facetState)
            facetStateByMark.set(mark, facetState);
    }
    // Compute a Map from scale name to an array of associated channels.
    const channelsByScale = new Map();
    if (topFacetState)
        addScaleChannels(channelsByScale, [topFacetState]);
    addScaleChannels(channelsByScale, facetStateByMark);
    // All the possible facets are given by the domains of the fx or fy scales, or
    // the cross-product of these domains if we facet by both x and y. We sort
    // them in order to apply the facet filters afterwards.
    let facets = Facets(channelsByScale, options);
    if (facets !== undefined) {
        const topFacetsIndex = topFacetState ? filterFacets(facets, topFacetState) : undefined;
        // Compute a facet index for each mark, parallel to the facets array. For
        // mark-level facets, compute an index for that mark’s data and options.
        // Otherwise, use the top-level facet index.
        for (const mark of marks) {
            if (mark.facet === null)
                continue;
            const facetState = facetStateByMark.get(mark);
            if (facetState === undefined)
                continue;
            facetState.facetsIndex = mark.fx != null || mark.fy != null ? filterFacets(facets, facetState) : topFacetsIndex;
        }
        // The cross product of the domains of fx and fy can include fx-fy
        // combinations for which no mark has an instance associated with that
        // combination, and therefore we don’t want to render this facet (not even
        // the frame). The same can occur if you specify the domain of fx and fy
        // explicitly, but there is no mark instance associated with some values in
        // the domain. Expunge empty facets, and clear the corresponding elements
        // from the nested index in each mark.
        const nonEmpty = new Set();
        for (const { facetsIndex } of facetStateByMark.values()) {
            facetsIndex?.forEach((index, i) => {
                if (index?.length > 0) {
                    nonEmpty.add(i);
                }
            });
        }
        if (0 < nonEmpty.size && nonEmpty.size < facets.length) {
            facets = facets.filter((_, i) => nonEmpty.has(i));
            for (const state of facetStateByMark.values()) {
                const { facetsIndex } = state;
                if (!facetsIndex)
                    continue;
                state.facetsIndex = facetsIndex.filter((_, i) => nonEmpty.has(i));
            }
        }
        // For any mark using the “exclude” facet mode, invert the index.
        for (const mark of marks) {
            if (mark.facet === "exclude") {
                const facetState = facetStateByMark.get(mark);
                facetState.facetsIndex = excludeIndex(facetState.facetsIndex);
            }
        }
    }
    // If a scale is explicitly declared in options, initialize its associated
    // channels to the empty array; this will guarantee that a corresponding scale
    // will be created later (even if there are no other channels). Ignore facet
    // scale declarations, which are handled above.
    for (const key of registry.keys()) {
        if (isScaleOptions(options[key]) && key !== "fx" && key !== "fy") {
            channelsByScale.set(key, []);
        }
    }
    // A Map from Mark instance to its render state, including:
    // index - the data index e.g. [0, 1, 2, 3, …]
    // channels - an array of materialized channels e.g. [["x", {value}], …]
    // faceted - a boolean indicating whether this mark is faceted
    // values - an object of scaled values e.g. {x: [40, 32, …], …}
    const stateByMark = new Map();
    // Initialize the marks’ state.
    for (const mark of marks) {
        if (stateByMark.has(mark))
            throw new Error("duplicate mark; each mark must be unique");
        const { facetsIndex, channels: facetChannels } = facetStateByMark.get(mark) || {};
        const { data, facets, channels } = mark.initialize(facetsIndex, facetChannels);
        applyScaleTransforms(channels, options);
        stateByMark.set(mark, { data, facets, channels });
    }
    // Initalize the scales and axes.
    const scaleDescriptors = Scales(addScaleChannels(channelsByScale, stateByMark), options);
    const scales = ScaleFunctions(scaleDescriptors);
    const axes = Axes(scaleDescriptors, options);
    const dimensions = Dimensions(scaleDescriptors, hasGeometry(stateByMark), axes, options);
    autoScaleRange(scaleDescriptors, dimensions);
    autoAxisTicks(scaleDescriptors, axes);
    const { fx, fy } = scales;
    const fyMargins = fy && { marginTop: 0, marginBottom: 0, height: fy.bandwidth() };
    const fxMargins = fx && { marginRight: 0, marginLeft: 0, width: fx.bandwidth() };
    const subdimensions = { ...dimensions, ...fxMargins, ...fyMargins };
    const context = Context(options, subdimensions);
    // Reinitialize; for deriving channels dependent on other channels.
    const newByScale = new Set();
    for (const [mark, state] of stateByMark) {
        if (mark.initializer != null) {
            const { facets, channels } = mark.initializer(state.data, state.facets, state.channels, scales, subdimensions, context);
            if (facets !== undefined) {
                state.facets = facets;
            }
            if (channels !== undefined) {
                inferChannelScale(channels);
                applyScaleTransforms(channels, options);
                Object.assign(state.channels, channels);
                for (const { scale } of Object.values(channels))
                    if (scale != null)
                        newByScale.add(scale);
            }
        }
    }
    // Reconstruct scales if new scaled channels were created during reinitialization.
    if (newByScale.size) {
        for (const key of newByScale) {
            if (registry.get(key) === position) {
                throw new Error(`initializers cannot declare position scales: ${key}`);
            }
        }
        const newScaleDescriptors = Scales(addScaleChannels(new Map(), stateByMark, (key) => newByScale.has(key)), options);
        const newScales = ScaleFunctions(newScaleDescriptors);
        Object.assign(scaleDescriptors, newScaleDescriptors);
        Object.assign(scales, newScales);
    }
    autoScaleLabels(channelsByScale, scaleDescriptors, axes, dimensions, options);
    // Compute value objects, applying scales as needed.
    for (const state of stateByMark.values()) {
        state.values = valueObject(state.channels, scales);
    }
    // Apply projection as needed.
    if (context.projection) {
        for (const [mark, state] of stateByMark) {
            mark.project(state.channels, state.values, context);
        }
    }
    const { width, height } = dimensions;
    const svg = create("svg", context)
        .attr("class", className)
        .attr("fill", "currentColor")
        .attr("font-family", "system-ui, sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("aria-label", ariaLabel)
        .attr("aria-description", ariaDescription)
        .call((svg) => svg.append("style").text(`
        .${className} {
          display: block;
          background: white;
          height: auto;
          height: intrinsic;
          max-width: 100%;
        }
        .${className} text,
        .${className} tspan {
          white-space: pre;
        }
      `))
        .call(applyInlineStyles, style)
        .node();
    // When faceting, render axes for fx and fy instead of x and y.
    const axisY = axes[facets !== undefined && fy ? "fy" : "y"];
    const axisX = axes[facets !== undefined && fx ? "fx" : "x"];
    if (axisY)
        svg.appendChild(axisY.render(null, scales, dimensions, context));
    if (axisX)
        svg.appendChild(axisX.render(null, scales, dimensions, context));
    let selectedValue = [];
    // Render (possibly faceted) marks.
    if (facets !== undefined) {
        const fxDomain = fx?.domain();
        const fyDomain = fy?.domain();
        const selection = d3.select(svg);
        // When faceting by both fx and fy, this nested Map allows to look up the
        // non-empty facets and draw the grid lines properly.
        const fxy = fx && fy && (axes.x || axes.y)
            ? d3.group(facets, ({ x }) => x, ({ y }) => y)
            : undefined;
        if (fy && axes.y) {
            const axis1 = axes.y, axis2 = nolabel(axis1);
            const j = axis1.labelAnchor === "bottom"
                ? fyDomain.length - 1
                : axis1.labelAnchor === "center"
                    ? fyDomain.length >> 1
                    : 0;
            selection
                .selectAll()
                .data(fyDomain)
                .enter()
                .append((ky, i) => (i === j ? axis1 : axis2).render(fx && where(fxDomain, (kx) => fxy.get(kx).has(ky)), scales, { ...dimensions, ...fyMargins, offsetTop: fy(ky) }, context));
        }
        if (fx && axes.x) {
            const axis1 = axes.x, axis2 = nolabel(axis1);
            const j = axis1.labelAnchor === "right" ? fxDomain.length - 1 : axis1.labelAnchor === "center" ? fxDomain.length >> 1 : 0;
            const { marginLeft, marginRight } = dimensions;
            selection
                .selectAll()
                .data(fxDomain)
                .enter()
                .append((kx, i) => (i === j ? axis1 : axis2).render(fy && where(fyDomain, (ky) => fxy.get(kx).has(ky)), scales, {
                ...dimensions,
                ...fxMargins,
                labelMarginLeft: marginLeft,
                labelMarginRight: marginRight,
                offsetLeft: fx(kx)
            }, context));
        }
        // Render facets in the order of the fx-fy domain, which might not be the
        // ordering used to build the nested index initially; see domainChannel.
        const facetPosition = new Map(facets.map((f, j) => [f, j]));
        selection
            .selectAll()
            .data(facetKeys(facets, fx, fy))
            .enter()
            .append("g")
            .attr("aria-label", "facet")
            .attr("transform", facetTranslate(fx, fy))
            .each(function (key) {
            for (const [mark, { channels, values, facets }] of stateByMark) {
                let facet = null;
                if (facets) {
                    facet = facets[facetPosition.get(key)] ?? facets[0];
                    if (!facet)
                        continue;
                    facet = mark.filter(facet, channels, values);
                }
                const node = mark.render(facet, scales, values, subdimensions, context);
                if (node != null)
                    this.appendChild(node);
            }
        });
    }
    else {
        for (const [mark, { channels, values, facets }] of stateByMark) {
            let facet = null;
            if (facets) {
                facet = facets[0];
                if (!facet)
                    continue;
                facet = mark.filter(facet, channels, values);
            }
            const node = mark.render(facet, scales, values, dimensions, context);
            if (node != null) {
                svg.appendChild(node);
                if (node[selection] !== undefined) {
                    selectedValue = markValue(mark, node[selection]);
                    node.addEventListener("input", () => {
                        figure.value = markValue(mark, node[selection]);
                    });
                }
            }
        }
    }
    // Wrap the plot in a figure with a caption, if desired.
    let figure = svg;
    const legends = Legends(scaleDescriptors, context, options);
    if (caption != null || legends.length > 0) {
        const { document } = context;
        figure = document.createElement("figure");
        figure.style.maxWidth = "initial";
        for (const legend of legends)
            figure.appendChild(legend);
        figure.appendChild(svg);
        if (caption != null) {
            const figcaption = document.createElement("figcaption");
            figcaption.appendChild(caption instanceof Node ? caption : document.createTextNode(caption));
            figure.appendChild(figcaption);
        }
    }
    figure.scale = exposeScales(scaleDescriptors);
    figure.legend = exposeLegends(scaleDescriptors, context, options);
    figure.value = selectedValue;
    const w = consumeWarnings();
    if (w > 0) {
        d3.select(svg)
            .append("text")
            .attr("x", width)
            .attr("y", 20)
            .attr("dy", "-1em")
            .attr("text-anchor", "end")
            .attr("font-family", "initial") // fix emoji rendering in Chrome
            .text("\u26a0\ufe0f") // emoji variation selector
            .append("title")
            .text(`${w.toLocaleString("en-US")} warning${w === 1 ? "" : "s"}. Please check the console.`);
    }
    return figure;
}
class Mark {
    constructor(data, channels = {}, options = {}, defaults) {
        const { facet = "auto", fx, fy, sort, dx, dy, clip, channels: extraChannels } = options;
        this.data = data;
        this.sort = isDomainSort(sort) ? sort : null;
        this.initializer = initializer(options).initializer;
        this.transform = this.initializer ? options.transform : basic(options).transform;
        if (facet === null || facet === false) {
            this.facet = null;
        }
        else {
            this.facet = keyword(facet === true ? "include" : facet, "facet", ["auto", "include", "exclude"]);
            this.fx = fx;
            this.fy = fy;
        }
        channels = maybeNamed(channels);
        if (extraChannels !== undefined)
            channels = { ...maybeNamed(extraChannels), ...channels };
        if (defaults !== undefined)
            channels = { ...styles(this, options, defaults), ...channels };
        this.channels = Object.fromEntries(Object.entries(channels).filter(([name, { value, optional }]) => {
            if (value != null)
                return true;
            if (optional)
                return false;
            throw new Error(`missing channel value: ${name}`);
        }));
        this.dx = +dx || 0;
        this.dy = +dy || 0;
        this.clip = maybeClip(clip);
    }
    initialize(facets, facetChannels) {
        let data = arrayify(this.data);
        if (facets === undefined && data != null)
            facets = [range(data)];
        if (this.transform != null)
            (({ facets, data } = this.transform(data, facets))), (data = arrayify(data));
        const channels = Channels(this.channels, data);
        if (this.sort != null)
            channelDomain(channels, facetChannels, data, this.sort); // mutates facetChannels!
        return { data, facets, channels };
    }
    filter(index, channels, values) {
        for (const name in channels) {
            const { filter = defined } = channels[name];
            if (filter !== null) {
                const value = values[name];
                index = index.filter((i) => filter(value[i]));
            }
        }
        return index;
    }
    // If there is a projection, and there are both x and y channels (or x1 and
    // y1, or x2 and y2 channels), and those channels are associated with the x
    // and y scale respectively (and not already in screen coordinates as with an
    // initializer), then apply the projection, replacing the x and y values. Note
    // that the x and y scales themselves don’t exist if there is a projection,
    // but whether the channels are associated with scales still determines
    // whether the projection should apply; think of the projection as a
    // combination xy-scale.
    project(channels, values, context) {
        maybeProject("x", "y", channels, values, context);
        maybeProject("x1", "y1", channels, values, context);
        maybeProject("x2", "y2", channels, values, context);
    }
    plot({ marks = [], ...options } = {}) {
        return plot({ ...options, marks: [...marks, this] });
    }
}
/** 
 * A convenience method for composing a mark from a series of other marks. Returns an array of marks that implements the *mark*.plot function. See the [box mark implementation](https://github.com/observablehq/plot/blob/main/src/marks/box.js) for an example.
 * 
 */
function marks(...marks) {
    marks.plot = Mark.prototype.plot;
    return marks;
}
function markify(mark) {
    return typeof mark?.render === "function" ? mark : new Render(mark);
}
function markValue(mark, selection) {
    return selection === null ? mark.data : take(mark.data, selection);
}
class Render extends Mark {
    constructor(render) {
        super();
        if (render == null)
            return;
        if (typeof render !== "function")
            throw new TypeError("invalid mark; missing render function");
        this.render = render;
    }
    render() { }
}
// Note: mutates channel.value to apply the scale transform, if any.
function applyScaleTransforms(channels, options) {
    for (const name in channels) {
        const channel = channels[name];
        const { scale } = channel;
        if (scale != null) {
            const { percent, interval, transform = percent ? (x) => x * 100 : maybeInterval(interval)?.floor } = options[scale] || {};
            if (transform != null)
                channel.value = map$1(channel.value, transform);
        }
    }
    return channels;
}
// An initializer may generate channels without knowing how the downstream mark
// will use them. Marks are typically responsible associated scales with
// channels, but here we assume common behavior across marks.
function inferChannelScale(channels) {
    for (const name in channels) {
        const channel = channels[name];
        let { scale } = channel;
        if (scale === true) {
            switch (name) {
                case "fill":
                case "stroke":
                    scale = "color";
                    break;
                case "fillOpacity":
                case "strokeOpacity":
                case "opacity":
                    scale = "opacity";
                    break;
                default:
                    scale = registry.has(name) ? name : null;
                    break;
            }
            channel.scale = scale;
        }
    }
}
function addScaleChannels(channelsByScale, stateByMark, filter = yes) {
    for (const { channels } of stateByMark.values()) {
        for (const name in channels) {
            const channel = channels[name];
            const { scale } = channel;
            if (scale != null && filter(scale)) {
                const scaleChannels = channelsByScale.get(scale);
                if (scaleChannels !== undefined)
                    scaleChannels.push(channel);
                else
                    channelsByScale.set(scale, [channel]);
            }
        }
    }
    return channelsByScale;
}
function hasGeometry(stateByMark) {
    for (const { channels } of stateByMark.values()) {
        if (channels.geometry)
            return true;
    }
    return false;
}
// Derives a copy of the specified axis with the label disabled.
function nolabel(axis) {
    return axis === undefined || axis.label === undefined
        ? axis // use the existing axis if unlabeled
        : Object.assign(Object.create(axis), { label: undefined });
}
// Returns an array of {x?, y?} objects representing the facet domain.
function Facets(channelsByScale, options) {
    const { fx, fy } = Scales(channelsByScale, options);
    const fxDomain = fx?.scale.domain();
    const fyDomain = fy?.scale.domain();
    return fxDomain && fyDomain
        ? d3.cross(fxDomain, fyDomain).map(([x, y]) => ({ x, y }))
        : fxDomain
            ? fxDomain.map((x) => ({ x }))
            : fyDomain
                ? fyDomain.map((y) => ({ y }))
                : undefined;
}
// Returns keys in order of the associated scale’s domains. (We don’t want to
// recompute the keys here because facets may already be filtered, and facets
// isn’t sorted because it’s constructed prior to the other mark channels.)
function facetKeys(facets, fx, fy) {
    const fxI = fx && new d3.InternMap(fx.domain().map((x, i) => [x, i]));
    const fyI = fy && new d3.InternMap(fy.domain().map((y, i) => [y, i]));
    return d3.sort(facets, (a, b) => (fxI && fxI.get(a.x) - fxI.get(b.x)) || (fyI && fyI.get(a.y) - fyI.get(b.y)));
}
// Returns a (possibly nested) Map of [[key1, index1], [key2, index2], …]
// representing the data indexes associated with each facet.
function facetGroups(data, { fx, fy }) {
    const index = range(data);
    return fx && fy ? facetGroup2(index, fx, fy) : fx ? facetGroup1(index, fx) : facetGroup1(index, fy);
}
function facetGroup1(index, { value: F }) {
    return d3.group(index, (i) => F[i]);
}
function facetGroup2(index, { value: FX }, { value: FY }) {
    return d3.group(index, (i) => FX[i], (i) => FY[i]);
}
function facetTranslate(fx, fy) {
    return fx && fy
        ? ({ x, y }) => `translate(${fx(x)},${fy(y)})`
        : fx
            ? ({ x }) => `translate(${fx(x)},0)`
            : ({ y }) => `translate(0,${fy(y)})`;
}
// Returns an index that for each facet lists all the elements present in other
// facets in the original index. TODO Memoize to avoid repeated work?
function excludeIndex(index) {
    const ex = [];
    const e = new Uint32Array(d3.sum(index, (d) => d.length));
    for (const i of index) {
        let n = 0;
        for (const j of index) {
            if (i === j)
                continue;
            e.set(j, n);
            n += j.length;
        }
        ex.push(e.slice(0, n));
    }
    return ex;
}
// Returns the facet groups, and possibly fx and fy channels, associated with
// the top-level facet option {data, x, y}.
function maybeTopFacet(facet, options) {
    if (facet == null)
        return;
    const { x, y } = facet;
    if (x == null && y == null)
        return;
    const data = arrayify(facet.data);
    if (data == null)
        throw new Error(`missing facet data`);
    const channels = {};
    if (x != null)
        channels.fx = Channel(data, { value: x, scale: "fx" });
    if (y != null)
        channels.fy = Channel(data, { value: y, scale: "fy" });
    applyScaleTransforms(channels, options);
    const groups = facetGroups(data, channels);
    // When the top-level facet option generated several frames, track the
    // corresponding data length in order to compare it for the warning above.
    const dataLength = groups.size > 1 || (channels.fx && channels.fy && groups.size === 1 && [...groups][0][1].size > 1)
        ? data.length
        : undefined;
    return { channels, groups, data: facet.data, dataLength };
}
// Returns the facet groups, and possibly fx and fy channels, associated with a
// mark, either through top-level faceting or mark-level facet options {fx, fy}.
function maybeMarkFacet(mark, topFacetState, options) {
    if (mark.facet === null)
        return;
    // This mark defines a mark-level facet. TODO There’s some code duplication
    // here with maybeTopFacet that we could reduce.
    const { fx: x, fy: y } = mark;
    if (x != null || y != null) {
        const data = arrayify(mark.data);
        if (data == null)
            throw new Error(`missing facet data in ${mark.ariaLabel}`);
        const channels = {};
        if (x != null)
            channels.fx = Channel(data, { value: x, scale: "fx" });
        if (y != null)
            channels.fy = Channel(data, { value: y, scale: "fy" });
        applyScaleTransforms(channels, options);
        return { channels, groups: facetGroups(data, channels) };
    }
    // This mark links to a top-level facet, if present.
    if (topFacetState === undefined)
        return;
    // TODO Can we link the top-level facet channels here?
    const { channels, groups, data, dataLength } = topFacetState;
    if (mark.facet !== "auto" || mark.data === data)
        return { channels, groups };
    // Warn for the common pitfall of wanting to facet mapped data. See above for
    // the initialization of dataLength.
    if (dataLength !== undefined && arrayify(mark.data)?.length === dataLength) {
        warn(`Warning: the ${mark.ariaLabel} mark appears to use faceted data, but isn’t faceted. The mark data has the same length as the facet data and the mark facet option is "auto", but the mark data and facet data are distinct. If this mark should be faceted, set the mark facet option to true; otherwise, suppress this warning by setting the mark facet option to false.`);
    }
}
// Facet filter, by mark; for now only the "eq" filter is provided.
function filterFacets(facets, { channels: { fx, fy }, groups }) {
    return fx && fy
        ? facets.map(({ x, y }) => groups.get(x)?.get(y))
        : fx
            ? facets.map(({ x }) => groups.get(x))
            : facets.map(({ y }) => groups.get(y));
}

const curves = new Map([
    ["basis", d3.curveBasis],
    ["basis-closed", d3.curveBasisClosed],
    ["basis-open", d3.curveBasisOpen],
    ["bundle", d3.curveBundle],
    ["bump-x", d3.curveBumpX],
    ["bump-y", d3.curveBumpY],
    ["cardinal", d3.curveCardinal],
    ["cardinal-closed", d3.curveCardinalClosed],
    ["cardinal-open", d3.curveCardinalOpen],
    ["catmull-rom", d3.curveCatmullRom],
    ["catmull-rom-closed", d3.curveCatmullRomClosed],
    ["catmull-rom-open", d3.curveCatmullRomOpen],
    ["linear", d3.curveLinear],
    ["linear-closed", d3.curveLinearClosed],
    ["monotone-x", d3.curveMonotoneX],
    ["monotone-y", d3.curveMonotoneY],
    ["natural", d3.curveNatural],
    ["step", d3.curveStep],
    ["step-after", d3.curveStepAfter],
    ["step-before", d3.curveStepBefore]
]);
function Curve(curve = d3.curveLinear, tension) {
    if (typeof curve === "function")
        return curve; // custom curve
    const c = curves.get(`${curve}`.toLowerCase());
    if (!c)
        throw new Error(`unknown curve: ${curve}`);
    if (tension !== undefined) {
        if ("beta" in c) {
            return c.beta(tension);
        }
        else if ("tension" in c) {
            return c.tension(tension);
        }
        else if ("alpha" in c) {
            return c.alpha(tension);
        }
    }
    return c;
}

/** 
 * ```js
 * Plot.rectY(athletes, Plot.binX({y: "count"}, {x: "weight"}))
 * ```
 * 
 * Bins on *x*. Also groups on *y* and the first channel of *z*, *fill*, or *stroke*, if any.
 * 
 */
function binX(outputs = { y: "count" }, options = {}) {
    // Group on {z, fill, stroke}, then optionally on y, then bin x.
    [outputs, options] = mergeOptions$2(outputs, options);
    const { x, y } = options;
    return binn(maybeBinValue(x, options, identity$1), null, null, y, outputs, maybeInsetX(options));
}
/** 
 * ```js
 * Plot.rectX(athletes, Plot.binY({x: "count"}, {y: "weight"}))
 * ```
 * 
 * Bins on *y*. Also groups on *x* and first channel of *z*, *fill*, or *stroke*, if any.
 * 
 */
function binY(outputs = { x: "count" }, options = {}) {
    // Group on {z, fill, stroke}, then optionally on x, then bin y.
    [outputs, options] = mergeOptions$2(outputs, options);
    const { x, y } = options;
    return binn(null, maybeBinValue(y, options, identity$1), x, null, outputs, maybeInsetY(options));
}
/** 
 * ```js
 * Plot.rect(athletes, Plot.bin({fillOpacity: "count"}, {x: "weight", y: "height"}))
 * ```
 * 
 * Bins on *x* and *y*. Also groups on the first channel of *z*, *fill*, or *stroke*, if any.
 * 
 */
function bin(outputs = { fill: "count" }, options = {}) {
    // Group on {z, fill, stroke}, then bin on x and y.
    [outputs, options] = mergeOptions$2(outputs, options);
    const { x, y } = maybeBinValueTuple(options);
    return binn(x, y, null, null, outputs, maybeInsetX(maybeInsetY(options)));
}
function maybeDenseInterval(bin, k, options = {}) {
    return options?.interval == null
        ? options
        : bin({ [k]: options?.reduce === undefined ? reduceFirst$1 : options.reduce, filter: null }, options);
}
function maybeDenseIntervalX(options) {
    return maybeDenseInterval(binX, "y", options);
}
function maybeDenseIntervalY(options) {
    return maybeDenseInterval(binY, "x", options);
}
function binn(bx, // optionally bin on x (exclusive with gx)
by, // optionally bin on y (exclusive with gy)
gx, // optionally group on x (exclusive with bx and gy)
gy, // optionally group on y (exclusive with by and gx)
{ data: reduceData = reduceIdentity, filter = reduceCount, // return only non-empty bins by default
sort, reverse, ...outputs // output channel definitions
 } = {}, inputs = {} // input channels and options
) {
    bx = maybeBin(bx);
    by = maybeBin(by);
    // Compute the outputs.
    outputs = maybeOutputs(outputs, inputs);
    reduceData = maybeReduce$1(reduceData, identity$1);
    sort = sort == null ? undefined : maybeOutput("sort", sort, inputs);
    filter = filter == null ? undefined : maybeEvaluator("filter", filter, inputs);
    // Don’t group on a channel if an output requires it as an input!
    if (gx != null && hasOutput(outputs, "x", "x1", "x2"))
        gx = null;
    if (gy != null && hasOutput(outputs, "y", "y1", "y2"))
        gy = null;
    // Produce x1, x2, y1, and y2 output channels as appropriate (when binning).
    const [BX1, setBX1] = maybeColumn(bx);
    const [BX2, setBX2] = maybeColumn(bx);
    const [BY1, setBY1] = maybeColumn(by);
    const [BY2, setBY2] = maybeColumn(by);
    // Produce x or y output channels as appropriate (when grouping).
    const [k, gk] = gx != null ? [gx, "x"] : gy != null ? [gy, "y"] : [];
    const [GK, setGK] = maybeColumn(k);
    // Greedily materialize the z, fill, and stroke channels (if channels and not
    // constants) so that we can reference them for subdividing groups without
    // computing them more than once. We also want to consume options that should
    // only apply to this transform rather than passing them through to the next.
    const { x, y, z, fill, stroke, x1, x2, // consumed if x is an output
    y1, y2, // consumed if y is an output
    picker, domain, cumulative, thresholds, interval, ...options } = inputs;
    const [GZ, setGZ] = maybeColumn(z);
    const [vfill] = maybeColorChannel(fill);
    const [vstroke] = maybeColorChannel(stroke);
    const [GF, setGF] = maybeColumn(vfill);
    const [GS, setGS] = maybeColumn(vstroke);
    const [, setJ] = maybeColumn(picker);
    return {
        ...("z" in inputs && { z: GZ || z }),
        ...("fill" in inputs && { fill: GF || fill }),
        ...("stroke" in inputs && { stroke: GS || stroke }),
        ...basic(options, (data, facets) => {
            const K = valueof(data, k);
            const Z = valueof(data, z);
            const F = valueof(data, vfill);
            const S = valueof(data, vstroke);
            const G = maybeSubgroup(outputs, { z: Z, fill: F, stroke: S });
            const groupFacets = [];
            const groupData = [];
            const GK = K && setGK([]);
            const GZ = Z && setGZ([]);
            const GF = F && setGF([]);
            const GS = S && setGS([]);
            const BX = bx ? bx(data) : [[, , (I) => I]];
            const BY = by ? by(data) : [[, , (I) => I]];
            const BX1 = bx && setBX1([]);
            const BX2 = bx && setBX2([]);
            const BY1 = by && setBY1([]);
            const BY2 = by && setBY2([]);
            let i = 0;
            for (const o of outputs)
                o.initialize(data);
            if (sort)
                sort.initialize(data);
            if (filter)
                filter.initialize(data);
            for (const facet of facets) {
                const groupFacet = [];
                for (const o of outputs)
                    o.scope("facet", facet);
                if (sort)
                    sort.scope("facet", facet);
                if (filter)
                    filter.scope("facet", facet);
                for (const [f, I] of maybeGroup(facet, G)) {
                    for (const [k, g] of maybeGroup(I, K)) {
                        for (const [x1, x2, fx] of BX) {
                            const bb = fx(g);
                            for (const [y1, y2, fy] of BY) {
                                const extent = { x1, x2, y1, y2 };
                                const b = fy(bb);
                                if (filter && !filter.reduce(b, extent))
                                    continue;
                                groupFacet.push(i++);
                                groupData.push(reduceData.reduce(b, data, extent));
                                if (K)
                                    GK.push(k);
                                if (Z)
                                    GZ.push(G === Z ? f : Z[b[0]]);
                                if (F)
                                    GF.push(G === F ? f : F[b[0]]);
                                if (S)
                                    GS.push(G === S ? f : S[b[0]]);
                                if (BX1)
                                    BX1.push(x1), BX2.push(x2);
                                if (BY1)
                                    BY1.push(y1), BY2.push(y2);
                                for (const o of outputs)
                                    o.reduce(b, extent);
                                if (sort)
                                    sort.reduce(b);
                            }
                        }
                    }
                }
                groupFacets.push(groupFacet);
            }
            setJ && setJ(groupData);
            maybeSort(groupFacets, sort, reverse);
            return { data: groupData, facets: groupFacets };
        }),
        ...(!hasOutput(outputs, "x") && (BX1 ? { x1: BX1, x2: BX2, x: mid$1(BX1, BX2) } : { x, x1, x2 })),
        ...(!hasOutput(outputs, "y") && (BY1 ? { y1: BY1, y2: BY2, y: mid$1(BY1, BY2) } : { y, y1, y2 })),
        ...(GK && { [gk]: GK }),
        ...Object.fromEntries(outputs.map(({ name, output }) => [name, output]))
    };
}
// Allow bin options to be specified as part of outputs; merge them into options.
function mergeOptions$2({ cumulative, domain, thresholds, interval, ...outputs }, options) {
    return [outputs, { cumulative, domain, thresholds, interval, ...options }];
}
function maybeBinValue(value, { cumulative, domain, thresholds, interval }, defaultValue) {
    value = { ...maybeValue(value) };
    if (value.domain === undefined)
        value.domain = domain;
    if (value.cumulative === undefined)
        value.cumulative = cumulative;
    if (value.thresholds === undefined)
        value.thresholds = thresholds;
    if (value.interval === undefined)
        value.interval = interval;
    if (value.value === undefined)
        value.value = defaultValue;
    value.thresholds = maybeThresholds(value.thresholds, value.interval);
    return value;
}
function maybeBinValueTuple(options) {
    let { x, y } = options;
    x = maybeBinValue(x, options);
    y = maybeBinValue(y, options);
    [x.value, y.value] = maybeTuple(x.value, y.value);
    return { x, y };
}
function maybeBin(options) {
    if (options == null)
        return;
    const { value, cumulative, domain = d3.extent, thresholds } = options;
    const bin = (data) => {
        let V = valueof(data, value, Array); // d3.bin prefers Array input
        const bin = d3.bin().value((i) => V[i]);
        if (isTemporal(V) || isTimeThresholds(thresholds)) {
            V = V.map(coerceDate);
            let [min, max] = typeof domain === "function" ? domain(V) : domain;
            let t = typeof thresholds === "function" && !isInterval(thresholds) ? thresholds(V, min, max) : thresholds;
            if (typeof t === "number")
                t = d3.utcTickInterval(min, max, t);
            if (isInterval(t)) {
                if (domain === d3.extent) {
                    min = t.floor(min);
                    max = t.ceil(new Date(+max + 1));
                }
                t = t.range(min, max);
            }
            bin.thresholds(t).domain([min, max]);
        }
        else {
            V = V.map(coerceNumber);
            let d = domain;
            let t = thresholds;
            if (isInterval(t)) {
                let [min, max] = typeof d === "function" ? d(V) : d;
                if (d === d3.extent) {
                    min = t.floor(min);
                    max = t.offset(t.floor(max));
                    d = [min, max];
                }
                t = t.range(min, max);
            }
            bin.thresholds(t).domain(d);
        }
        let bins = bin(range(data)).map(binset);
        if (cumulative)
            bins = (cumulative < 0 ? bins.reverse() : bins).map(bincumset);
        return bins.map(binfilter);
    };
    bin.label = labelof(value);
    return bin;
}
function maybeThresholds(thresholds, interval) {
    if (thresholds === undefined) {
        return interval === undefined ? thresholdAuto : maybeRangeInterval(interval);
    }
    if (typeof thresholds === "string") {
        switch (thresholds.toLowerCase()) {
            case "freedman-diaconis":
                return d3.thresholdFreedmanDiaconis;
            case "scott":
                return d3.thresholdScott;
            case "sturges":
                return d3.thresholdSturges;
            case "auto":
                return thresholdAuto;
        }
        throw new Error(`invalid thresholds: ${thresholds}`);
    }
    return thresholds; // pass array, count, or function to bin.thresholds
}
// Unlike the interval transform, we require a range method, too.
function maybeRangeInterval(interval) {
    interval = maybeInterval(interval);
    if (!isInterval(interval))
        throw new Error(`invalid interval: ${interval}`);
    return interval;
}
function thresholdAuto(values, min, max) {
    return Math.min(200, d3.thresholdScott(values, min, max));
}
function isTimeThresholds(t) {
    return isTimeInterval(t) || (isIterable(t) && isTemporal(t));
}
function isTimeInterval(t) {
    return isInterval(t) && typeof t === "function" && t() instanceof Date;
}
function isInterval(t) {
    return t ? typeof t.range === "function" : false;
}
function binset(bin) {
    return [bin, new Set(bin)];
}
function bincumset([bin], j, bins) {
    return [
        bin,
        {
            get size() {
                for (let k = 0; k <= j; ++k) {
                    if (bins[k][1].size) {
                        return 1; // a non-empty value
                    }
                }
                return 0;
            },
            has(i) {
                for (let k = 0; k <= j; ++k) {
                    if (bins[k][1].has(i)) {
                        return true;
                    }
                }
                return false;
            }
        }
    ];
}
function binfilter([{ x0, x1 }, set]) {
    return [x0, x1, set.size ? (I) => I.filter(set.has, set) : binempty];
}
function binempty() {
    return new Uint32Array(0);
}

function maybeIdentityX(options = {}) {
    const { x, x1, x2 } = options;
    return x1 === undefined && x2 === undefined && x === undefined ? { ...options, x: identity$1 } : options;
}
function maybeIdentityY(options = {}) {
    const { y, y1, y2 } = options;
    return y1 === undefined && y2 === undefined && y === undefined ? { ...options, y: identity$1 } : options;
}

/** 
 * ```js
 * Plot.stackX({y: "year", x: "revenue", z: "format", fill: "group"})
 * ```
 * 
 * See Plot.stackY, but with *x* as the input value channel, *y* as the stack index, *x1*, *x2* and *x* as the output channels.
 * 
 */
function stackX(stack = {}, options = {}) {
    if (arguments.length === 1)
        [stack, options] = mergeOptions$1(stack);
    const { y1, y = y1, x, ...rest } = options; // note: consumes x!
    const [transform, Y, x1, x2] = stackAlias(y, x, "x", stack, rest);
    return { ...transform, y1, y: Y, x1, x2, x: mid$1(x1, x2) };
}
/** 
 * ```js
 * Plot.stackX1({y: "year", x: "revenue", z: "format", fill: "group"})
 * ```
 * 
 * Equivalent to [Plot.stackX](https://github.com/observablehq/plot/blob/main/README.md#plotstackxstack-options), except that the **x1** channel is returned as the **x** channel. This can be used, for example, to draw a line at the left edge of each stacked area.
 * 
 */
function stackX1(stack = {}, options = {}) {
    if (arguments.length === 1)
        [stack, options] = mergeOptions$1(stack);
    const { y1, y = y1, x } = options;
    const [transform, Y, X] = stackAlias(y, x, "x", stack, options);
    return { ...transform, y1, y: Y, x: X };
}
/** 
 * ```js
 * Plot.stackX2({y: "year", x: "revenue", z: "format", fill: "group"})
 * ```
 * 
 * Equivalent to [Plot.stackX](https://github.com/observablehq/plot/blob/main/README.md#plotstackxstack-options), except that the **x2** channel is returned as the **x** channel. This can be used, for example, to draw a line at the right edge of each stacked area.
 * 
 */
function stackX2(stack = {}, options = {}) {
    if (arguments.length === 1)
        [stack, options] = mergeOptions$1(stack);
    const { y1, y = y1, x } = options;
    const [transform, Y, , X] = stackAlias(y, x, "x", stack, options);
    return { ...transform, y1, y: Y, x: X };
}
/** 
 * ```js
 * Plot.stackY({x: "year", y: "revenue", z: "format", fill: "group"})
 * ```
 * 
 * Creates new channels **y1** and **y2**, obtained by stacking the original **y** channel for data points that share a common **x** (and possibly **z**) value. A new **y** channel is also returned, which lazily computes the middle value of **y1** and **y2**. The input **y** channel defaults to a constant 1, resulting in a count of the data points. The stack options (*offset*, *order*, and *reverse*) may be specified as part of the *options* object, if the only argument, or as a separate *stack* options argument.
 * 
 */
function stackY(stack = {}, options = {}) {
    if (arguments.length === 1)
        [stack, options] = mergeOptions$1(stack);
    const { x1, x = x1, y, ...rest } = options; // note: consumes y!
    const [transform, X, y1, y2] = stackAlias(x, y, "y", stack, rest);
    return { ...transform, x1, x: X, y1, y2, y: mid$1(y1, y2) };
}
/** 
 * ```js
 * Plot.stackY1({x: "year", y: "revenue", z: "format", fill: "group"})
 * ```
 * 
 * Equivalent to [Plot.stackY](https://github.com/observablehq/plot/blob/main/README.md#plotstackystack-options), except that the **y1** channel is returned as the **y** channel. This can be used, for example, to draw a line at the bottom of each stacked area.
 * 
 */
function stackY1(stack = {}, options = {}) {
    if (arguments.length === 1)
        [stack, options] = mergeOptions$1(stack);
    const { x1, x = x1, y } = options;
    const [transform, X, Y] = stackAlias(x, y, "y", stack, options);
    return { ...transform, x1, x: X, y: Y };
}
/** 
 * ```js
 * Plot.stackY2({x: "year", y: "revenue", z: "format", fill: "group"})
 * ```
 * 
 * Equivalent to [Plot.stackY](https://github.com/observablehq/plot/blob/main/README.md#plotstackystack-options), except that the **y2** channel is returned as the **y** channel. This can be used, for example, to draw a line at the top of each stacked area.
 * 
 */
function stackY2(stack = {}, options = {}) {
    if (arguments.length === 1)
        [stack, options] = mergeOptions$1(stack);
    const { x1, x = x1, y } = options;
    const [transform, X, , Y] = stackAlias(x, y, "y", stack, options);
    return { ...transform, x1, x: X, y: Y };
}
function maybeStackX({ x, x1, x2, ...options } = {}) {
    if (x1 === undefined && x2 === undefined)
        return stackX({ x, ...options });
    [x1, x2] = maybeZero(x, x1, x2);
    return { ...options, x1, x2 };
}
function maybeStackY({ y, y1, y2, ...options } = {}) {
    if (y1 === undefined && y2 === undefined)
        return stackY({ y, ...options });
    [y1, y2] = maybeZero(y, y1, y2);
    return { ...options, y1, y2 };
}
// The reverse option is ambiguous: it is both a stack option and a basic
// transform. If only one options object is specified, we interpret it as a
// stack option, and therefore must remove it from the propagated options.
function mergeOptions$1(options) {
    const { offset, order, reverse, ...rest } = options;
    return [{ offset, order, reverse }, rest];
}
function stack(x, y = one, ky, { offset, order, reverse }, options) {
    const z = maybeZ(options);
    const [X, setX] = maybeColumn(x);
    const [Y1, setY1] = column(y);
    const [Y2, setY2] = column(y);
    offset = maybeOffset(offset);
    order = maybeOrder(order, offset, ky);
    return [
        basic(options, (data, facets) => {
            const X = x == null ? undefined : setX(valueof(data, x));
            const Y = valueof(data, y, Float64Array);
            const Z = valueof(data, z);
            const O = order && order(data, X, Y, Z);
            const n = data.length;
            const Y1 = setY1(new Float64Array(n));
            const Y2 = setY2(new Float64Array(n));
            const facetstacks = [];
            for (const facet of facets) {
                const stacks = X ? Array.from(d3.group(facet, (i) => X[i]).values()) : [facet];
                if (O)
                    applyOrder(stacks, O);
                for (const stack of stacks) {
                    let yn = 0, yp = 0;
                    if (reverse)
                        stack.reverse();
                    for (const i of stack) {
                        const y = Y[i];
                        if (y < 0)
                            yn = Y2[i] = (Y1[i] = yn) + y;
                        else if (y > 0)
                            yp = Y2[i] = (Y1[i] = yp) + y;
                        else
                            Y2[i] = Y1[i] = yp; // NaN or zero
                    }
                }
                facetstacks.push(stacks);
            }
            if (offset)
                offset(facetstacks, Y1, Y2, Z);
            return { data, facets };
        }),
        X,
        Y1,
        Y2
    ];
}
// This is used internally so we can use `stack` as an argument name.
const stackAlias = stack;
function maybeOffset(offset) {
    if (offset == null)
        return;
    if (typeof offset === "function")
        return offset;
    switch (`${offset}`.toLowerCase()) {
        case "expand":
        case "normalize":
            return offsetExpand;
        case "center":
        case "silhouette":
            return offsetCenter;
        case "wiggle":
            return offsetWiggle;
    }
    throw new Error(`unknown offset: ${offset}`);
}
// Given a single stack, returns the minimum and maximum values from the given
// Y2 column. Note that this relies on Y2 always being the outer column for
// diverging values.
function extent(stack, Y2) {
    let min = 0, max = 0;
    for (const i of stack) {
        const y = Y2[i];
        if (y < min)
            min = y;
        if (y > max)
            max = y;
    }
    return [min, max];
}
function offsetExpand(facetstacks, Y1, Y2) {
    for (const stacks of facetstacks) {
        for (const stack of stacks) {
            const [yn, yp] = extent(stack, Y2);
            for (const i of stack) {
                const m = 1 / (yp - yn || 1);
                Y1[i] = m * (Y1[i] - yn);
                Y2[i] = m * (Y2[i] - yn);
            }
        }
    }
}
function offsetCenter(facetstacks, Y1, Y2) {
    for (const stacks of facetstacks) {
        for (const stack of stacks) {
            const [yn, yp] = extent(stack, Y2);
            for (const i of stack) {
                const m = (yp + yn) / 2;
                Y1[i] -= m;
                Y2[i] -= m;
            }
        }
        offsetZero(stacks, Y1, Y2);
    }
    offsetCenterFacets(facetstacks, Y1, Y2);
}
function offsetWiggle(facetstacks, Y1, Y2, Z) {
    for (const stacks of facetstacks) {
        const prev = new d3.InternMap();
        let y = 0;
        for (const stack of stacks) {
            let j = -1;
            const Fi = stack.map((i) => Math.abs(Y2[i] - Y1[i]));
            const Df = stack.map((i) => {
                j = Z ? Z[i] : ++j;
                const value = Y2[i] - Y1[i];
                const diff = prev.has(j) ? value - prev.get(j) : 0;
                prev.set(j, value);
                return diff;
            });
            const Cf1 = [0, ...d3.cumsum(Df)];
            for (const i of stack) {
                Y1[i] += y;
                Y2[i] += y;
            }
            const s1 = d3.sum(Fi);
            if (s1)
                y -= d3.sum(Fi, (d, i) => (Df[i] / 2 + Cf1[i]) * d) / s1;
        }
        offsetZero(stacks, Y1, Y2);
    }
    offsetCenterFacets(facetstacks, Y1, Y2);
}
function offsetZero(stacks, Y1, Y2) {
    const m = d3.min(stacks, (stack) => d3.min(stack, (i) => Y1[i]));
    for (const stack of stacks) {
        for (const i of stack) {
            Y1[i] -= m;
            Y2[i] -= m;
        }
    }
}
function offsetCenterFacets(facetstacks, Y1, Y2) {
    const n = facetstacks.length;
    if (n === 1)
        return;
    const facets = facetstacks.map((stacks) => stacks.flat());
    const m = facets.map((I) => (d3.min(I, (i) => Y1[i]) + d3.max(I, (i) => Y2[i])) / 2);
    const m0 = d3.min(m);
    for (let j = 0; j < n; j++) {
        const p = m0 - m[j];
        for (const i of facets[j]) {
            Y1[i] += p;
            Y2[i] += p;
        }
    }
}
function maybeOrder(order, offset, ky) {
    if (order === undefined && offset === offsetWiggle)
        return orderInsideOut;
    if (order == null)
        return;
    if (typeof order === "string") {
        switch (order.toLowerCase()) {
            case "value":
            case ky:
                return orderY;
            case "z":
                return orderZ;
            case "sum":
                return orderSum;
            case "appearance":
                return orderAppearance;
            case "inside-out":
                return orderInsideOut;
        }
        return orderFunction(field(order));
    }
    if (typeof order === "function")
        return orderFunction(order);
    if (Array.isArray(order))
        return orderGiven(order);
    throw new Error(`invalid order: ${order}`);
}
// by value
function orderY(data, X, Y) {
    return Y;
}
// by location
function orderZ(order, X, Y, Z) {
    return Z;
}
// by sum of value (a.k.a. “ascending”)
function orderSum(data, X, Y, Z) {
    return orderZDomain(Z, d3.groupSort(range(data), (I) => d3.sum(I, (i) => Y[i]), (i) => Z[i]));
}
// by x = argmax of value
function orderAppearance(data, X, Y, Z) {
    return orderZDomain(Z, d3.groupSort(range(data), (I) => X[d3.greatest(I, (i) => Y[i])], (i) => Z[i]));
}
// by x = argmax of value, but rearranged inside-out by alternating series
// according to the sign of a running divergence of sums
function orderInsideOut(data, X, Y, Z) {
    const I = range(data);
    const K = d3.groupSort(I, (I) => X[d3.greatest(I, (i) => Y[i])], (i) => Z[i]);
    const sums = d3.rollup(I, (I) => d3.sum(I, (i) => Y[i]), (i) => Z[i]);
    const Kp = [], Kn = [];
    let s = 0;
    for (const k of K) {
        if (s < 0) {
            s += sums.get(k);
            Kp.push(k);
        }
        else {
            s -= sums.get(k);
            Kn.push(k);
        }
    }
    return orderZDomain(Z, Kn.reverse().concat(Kp));
}
function orderFunction(f) {
    return (data) => valueof(data, f);
}
function orderGiven(domain) {
    return (data, X, Y, Z) => orderZDomain(Z, domain);
}
// Given an explicit ordering of distinct values in z, returns a parallel column
// O that can be used with applyOrder to sort stacks. Note that this is a series
// order: it will be consistent across stacks.
function orderZDomain(Z, domain) {
    domain = new d3.InternMap(domain.map((d, i) => [d, i]));
    return Z.map((z) => domain.get(z));
}
function applyOrder(stacks, O) {
    for (const stack of stacks) {
        stack.sort((i, j) => ascendingDefined(O[i], O[j]));
    }
}

const defaults$j = {
    ariaLabel: "area",
    strokeWidth: 1,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeMiterlimit: 1
};
class Area extends Mark {
    constructor(data, options = {}) {
        const { x1, y1, x2, y2, z, curve, tension } = options;
        super(data, {
            x1: { value: x1, scale: "x" },
            y1: { value: y1, scale: "y" },
            x2: { value: x2, scale: "x", optional: true },
            y2: { value: y2, scale: "y", optional: true },
            z: { value: maybeZ(options), optional: true }
        }, options, defaults$j);
        this.z = z;
        this.curve = Curve(curve, tension);
    }
    filter(index) {
        return index;
    }
    render(index, scales, channels, dimensions, context) {
        const { x1: X1, y1: Y1, x2: X2 = X1, y2: Y2 = Y1 } = channels;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, scales, 0, 0)
            .call((g) => g
            .selectAll()
            .data(groupIndex(index, [X1, Y1, X2, Y2], this, channels))
            .enter()
            .append("path")
            .call(applyDirectStyles, this)
            .call(applyGroupedChannelStyles, this, channels)
            .attr("d", d3.area()
            .curve(this.curve)
            .defined((i) => i >= 0)
            .x0((i) => X1[i])
            .y0((i) => Y1[i])
            .x1((i) => X2[i])
            .y1((i) => Y2[i])))
            .node();
    }
}
/** 
 * ```js
 * Plot.area(aapl, {x1: "Date", y1: 0, y2: "Close"})
 * ```
 * 
 * Returns a new area with the given *data* and *options*. Plot.area is rarely used directly; it is only needed when the baseline and topline have neither common *x* nor *y* values. [Plot.areaY](https://github.com/observablehq/plot/blob/main/README.md#plotareaydata-options) is used in the common horizontal orientation where the baseline and topline share *x* values, while [Plot.areaX](https://github.com/observablehq/plot/blob/main/README.md#plotareaxdata-options) is used in the vertical orientation where the baseline and topline share *y* values.
 * 
 */
function area(data, options) {
    if (options === undefined)
        return areaY(data, { x: first, y: second });
    return new Area(data, options);
}
/** 
 * ```js
 * Plot.areaX(aapl, {y: "Date", x: "Close"})
 * ```
 * 
 * Returns a new area with the given *data* and *options*. This constructor is used when the baseline and topline share *y* values, as in a time-series area chart where time goes up↑. If neither the **x1** nor **x2** option is specified, the **x** option may be specified as shorthand to apply an implicit [stackX transform](https://github.com/observablehq/plot/blob/main/README.md#plotstackxstack-options); this is the typical configuration for an area chart with a baseline at *x* = 0. If the **x** option is not specified, it defaults to the identity function. The **y** option specifies the **y1** channel; and the **y1** and **y2** options are ignored.
 * 
 * If the **interval** option is specified, the [binY transform](https://github.com/observablehq/plot/blob/main/README.md#bin) is implicitly applied to the specified *options*. The reducer of the output *x* channel may be specified via the **reduce** option, which defaults to *first*. To default to zero instead of showing gaps in data, as when the observed value represents a quantity, use the *sum* reducer.
 * 
 * ```js
 * Plot.areaX(observations, {y: "date", x: "temperature", interval: d3.utcDay})
 * ```
 * 
 * The **interval** option is recommended to “regularize” sampled data; for example, if your data represents timestamped temperature measurements and you expect one sample per day, use d3.utcDay as the interval.
 * 
 */
function areaX(data, options) {
    const { y = indexOf, ...rest } = maybeDenseIntervalY(options);
    return new Area(data, maybeStackX(maybeIdentityX({ ...rest, y1: y, y2: undefined })));
}
/** 
 * ```js
 * Plot.areaY(aapl, {x: "Date", y: "Close"})
 * ```
 * 
 * Returns a new area with the given *data* and *options*. This constructor is used when the baseline and topline share *x* values, as in a time-series area chart where time goes right→. If neither the **y1** nor **y2** option is specified, the **y** option may be specified as shorthand to apply an implicit [stackY transform](https://github.com/observablehq/plot/blob/main/README.md#plotstackystack-options); this is the typical configuration for an area chart with a baseline at *y* = 0. If the **y** option is not specified, it defaults to the identity function. The **x** option specifies the **x1** channel; and the **x1** and **x2** options are ignored.
 * 
 * If the **interval** option is specified, the [binX transform](https://github.com/observablehq/plot/blob/main/README.md#bin) is implicitly applied to the specified *options*. The reducer of the output *y* channel may be specified via the **reduce** option, which defaults to *first*. To default to zero instead of showing gaps in data, as when the observed value represents a quantity, use the *sum* reducer.
 * 
 * ```js
 * Plot.areaY(observations, {x: "date", y: "temperature", interval: d3.utcDay)
 * ```
 * 
 * The **interval** option is recommended to “regularize” sampled data; for example, if your data represents timestamped temperature measurements and you expect one sample per day, use d3.utcDay as the interval.
 * 
 */
function areaY(data, options) {
    const { x = indexOf, ...rest } = maybeDenseIntervalX(options);
    return new Area(data, maybeStackY(maybeIdentityY({ ...rest, x1: x, x2: undefined })));
}

function markers(mark, { marker, markerStart = marker, markerMid = marker, markerEnd = marker } = {}) {
    mark.markerStart = maybeMarker(markerStart);
    mark.markerMid = maybeMarker(markerMid);
    mark.markerEnd = maybeMarker(markerEnd);
}
function maybeMarker(marker) {
    if (marker == null || marker === false)
        return null;
    if (marker === true)
        return markerCircleFill;
    if (typeof marker === "function")
        return marker;
    switch (`${marker}`.toLowerCase()) {
        case "none":
            return null;
        case "arrow":
            return markerArrow;
        case "dot":
            return markerDot;
        case "circle":
        case "circle-fill":
            return markerCircleFill;
        case "circle-stroke":
            return markerCircleStroke;
    }
    throw new Error(`invalid marker: ${marker}`);
}
function markerArrow(color, context) {
    return create("svg:marker", context)
        .attr("viewBox", "-5 -5 10 10")
        .attr("markerWidth", 6.67)
        .attr("markerHeight", 6.67)
        .attr("orient", "auto")
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .call((marker) => marker.append("path").attr("d", "M-1.5,-3l3,3l-3,3"))
        .node();
}
function markerDot(color, context) {
    return create("svg:marker", context)
        .attr("viewBox", "-5 -5 10 10")
        .attr("markerWidth", 6.67)
        .attr("markerHeight", 6.67)
        .attr("fill", color)
        .attr("stroke", "none")
        .call((marker) => marker.append("circle").attr("r", 2.5))
        .node();
}
function markerCircleFill(color, context) {
    return create("svg:marker", context)
        .attr("viewBox", "-5 -5 10 10")
        .attr("markerWidth", 6.67)
        .attr("markerHeight", 6.67)
        .attr("fill", color)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .call((marker) => marker.append("circle").attr("r", 3))
        .node();
}
function markerCircleStroke(color, context) {
    return create("svg:marker", context)
        .attr("viewBox", "-5 -5 10 10")
        .attr("markerWidth", 6.67)
        .attr("markerHeight", 6.67)
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .call((marker) => marker.append("circle").attr("r", 3))
        .node();
}
let nextMarkerId = 0;
function applyMarkers(path, mark, { stroke: S } = {}) {
    return applyMarkersColor(path, mark, S && ((i) => S[i]));
}
function applyGroupedMarkers(path, mark, { stroke: S } = {}) {
    return applyMarkersColor(path, mark, S && (([i]) => S[i]));
}
function applyMarkersColor(path, { markerStart, markerMid, markerEnd, stroke }, strokeof = () => stroke) {
    const iriByMarkerColor = new Map();
    function applyMarker(marker) {
        return function (i) {
            const color = strokeof(i);
            let iriByColor = iriByMarkerColor.get(marker);
            if (!iriByColor)
                iriByMarkerColor.set(marker, (iriByColor = new Map()));
            let iri = iriByColor.get(color);
            if (!iri) {
                const context = { document: this.ownerDocument };
                const node = this.parentNode.insertBefore(marker(color, context), this);
                const id = `plot-marker-${++nextMarkerId}`;
                node.setAttribute("id", id);
                iriByColor.set(color, (iri = `url(#${id})`));
            }
            return iri;
        };
    }
    if (markerStart)
        path.attr("marker-start", applyMarker(markerStart));
    if (markerMid)
        path.attr("marker-mid", applyMarker(markerMid));
    if (markerEnd)
        path.attr("marker-end", applyMarker(markerEnd));
}

const defaults$i = {
    ariaLabel: "link",
    fill: "none",
    stroke: "currentColor",
    strokeMiterlimit: 1
};
class Link extends Mark {
    constructor(data, options = {}) {
        const { x1, y1, x2, y2, curve, tension } = options;
        super(data, {
            x1: { value: x1, scale: "x" },
            y1: { value: y1, scale: "y" },
            x2: { value: x2, scale: "x", optional: true },
            y2: { value: y2, scale: "y", optional: true }
        }, options, defaults$i);
        this.curve = Curve(curve, tension);
        markers(this, options);
    }
    render(index, scales, channels, dimensions, context) {
        const { x1: X1, y1: Y1, x2: X2 = X1, y2: Y2 = Y1 } = channels;
        const { curve } = this;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, scales)
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("path")
            .call(applyDirectStyles, this)
            .attr("d", (i) => {
            const p = d3.path();
            const c = curve(p);
            c.lineStart();
            c.point(X1[i], Y1[i]);
            c.point(X2[i], Y2[i]);
            c.lineEnd();
            return p;
        })
            .call(applyChannelStyles, this, channels)
            .call(applyMarkers, this, channels))
            .node();
    }
}
/** 
 * ```js
 * Plot.link(inequality, {x1: "POP_1980", y1: "R90_10_1980", x2: "POP_2015", y2: "R90_10_2015"})
 * ```
 * 
 * Returns a new link with the given *data* and *options*.
 * 
 */
function link(data, options = {}) {
    let { x, x1, x2, y, y1, y2, ...remainingOptions } = options;
    [x1, x2] = maybeSameValue(x, x1, x2);
    [y1, y2] = maybeSameValue(y, y1, y2);
    return new Link(data, { ...remainingOptions, x1, x2, y1, y2 });
}
// If x1 and x2 are specified, return them as {x1, x2}.
// If x and x1 and specified, or x and x2 are specified, return them as {x1, x2}.
// If only x, x1, or x2 are specified, return it as {x1}.
function maybeSameValue(x, x1, x2) {
    if (x === undefined) {
        if (x1 === undefined) {
            if (x2 !== undefined)
                return [x2];
        }
        else {
            if (x2 === undefined)
                return [x1];
        }
    }
    else if (x1 === undefined) {
        return x2 === undefined ? [x] : [x, x2];
    }
    else if (x2 === undefined) {
        return [x, x1];
    }
    return [x1, x2];
}

const defaults$h = {
    ariaLabel: "arrow",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeMiterlimit: 1,
    strokeWidth: 1.5
};
class Arrow extends Mark {
    constructor(data, options = {}) {
        const { x1, y1, x2, y2, bend = 0, headAngle = 60, headLength = 8, // Disable the arrow with headLength = 0; or, use Plot.link.
        inset = 0, insetStart = inset, insetEnd = inset } = options;
        super(data, {
            x1: { value: x1, scale: "x" },
            y1: { value: y1, scale: "y" },
            x2: { value: x2, scale: "x", optional: true },
            y2: { value: y2, scale: "y", optional: true }
        }, options, defaults$h);
        this.bend = bend === true ? 22.5 : Math.max(-90, Math.min(90, bend));
        this.headAngle = +headAngle;
        this.headLength = +headLength;
        this.insetStart = +insetStart;
        this.insetEnd = +insetEnd;
    }
    render(index, scales, channels, dimensions, context) {
        const { x1: X1, y1: Y1, x2: X2 = X1, y2: Y2 = Y1, SW } = channels;
        const { strokeWidth, bend, headAngle, headLength, insetStart, insetEnd } = this;
        const sw = SW ? (i) => SW[i] : constant(strokeWidth === undefined ? 1 : strokeWidth);
        // When bending, the offset between the straight line between the two points
        // and the outgoing tangent from the start point. (Also the negative
        // incoming tangent to the end point.) This must be within ±π/2. A positive
        // angle will produce a clockwise curve; a negative angle will produce a
        // counterclockwise curve; zero will produce a straight line.
        const bendAngle = bend * radians;
        // The angle between the arrow’s shaft and one of the wings; the “head”
        // angle between the wings is twice this value.
        const wingAngle = (headAngle * radians) / 2;
        // The length of the arrowhead’s “wings” (the line segments that extend from
        // the end point) relative to the stroke width.
        const wingScale = headLength / 1.5;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, scales)
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("path")
            .call(applyDirectStyles, this)
            .attr("d", (i) => {
            // The start ⟨x1,y1⟩ and end ⟨x2,y2⟩ points may be inset, and the
            // ending line angle may be altered for inset swoopy arrows.
            let x1 = X1[i], y1 = Y1[i], x2 = X2[i], y2 = Y2[i];
            const lineLength = Math.hypot(x2 - x1, y2 - y1);
            if (lineLength <= insetStart + insetEnd)
                return null;
            let lineAngle = Math.atan2(y2 - y1, x2 - x1);
            // We don’t allow the wing length to be too large relative to the
            // length of the arrow. (Plot.vector allows arbitrarily large
            // wings, but that’s okay since vectors are usually small.)
            const headLength = Math.min(wingScale * sw(i), lineLength / 3);
            // The radius of the circle that intersects with the two endpoints
            // and has the specified bend angle.
            const r = Math.hypot(lineLength / Math.tan(bendAngle), lineLength) / 2;
            // Apply insets.
            if (insetStart || insetEnd) {
                if (r < 1e5) {
                    // For inset swoopy arrows, compute the circle-circle
                    // intersection between a circle centered around the
                    // respective arrow endpoint and the center of the circle
                    // segment that forms the shaft of the arrow.
                    const sign = Math.sign(bendAngle);
                    const [cx, cy] = pointPointCenter([x1, y1], [x2, y2], r, sign);
                    if (insetStart) {
                        [x1, y1] = circleCircleIntersect([cx, cy, r], [x1, y1, insetStart], -sign * Math.sign(insetStart));
                    }
                    // For the end inset, rotate the arrowhead so that it aligns
                    // with the truncated end of the arrow. Since the arrow is a
                    // segment of the circle centered at ⟨cx,cy⟩, we can compute
                    // the angular difference to the new endpoint.
                    if (insetEnd) {
                        const [x, y] = circleCircleIntersect([cx, cy, r], [x2, y2, insetEnd], sign * Math.sign(insetEnd));
                        lineAngle += Math.atan2(y - cy, x - cx) - Math.atan2(y2 - cy, x2 - cx);
                        (x2 = x), (y2 = y);
                    }
                }
                else {
                    // For inset straight arrows, offset along the straight line.
                    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
                    if (insetStart)
                        (x1 += (dx / d) * insetStart), (y1 += (dy / d) * insetStart);
                    if (insetEnd)
                        (x2 -= (dx / d) * insetEnd), (y2 -= (dy / d) * insetEnd);
                }
            }
            // The angle of the arrow as it approaches the endpoint, and the
            // angles of the adjacent wings. Here “left” refers to if the
            // arrow is pointing up.
            const endAngle = lineAngle + bendAngle;
            const leftAngle = endAngle + wingAngle;
            const rightAngle = endAngle - wingAngle;
            // The endpoints of the two wings.
            const x3 = x2 - headLength * Math.cos(leftAngle);
            const y3 = y2 - headLength * Math.sin(leftAngle);
            const x4 = x2 - headLength * Math.cos(rightAngle);
            const y4 = y2 - headLength * Math.sin(rightAngle);
            // If the radius is very large (or even infinite, as when the bend
            // angle is zero), then render a straight line.
            return `M${x1},${y1}${r < 1e5 ? `A${r},${r} 0,0,${bendAngle > 0 ? 1 : 0} ` : `L`}${x2},${y2}M${x3},${y3}L${x2},${y2}L${x4},${y4}`;
        })
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
// Returns the center of a circle that goes through the two given points ⟨ax,ay⟩
// and ⟨bx,by⟩ and has radius r. There are two such points; use the sign +1 or
// -1 to chose between them. Returns [NaN, NaN] if r is too small.
function pointPointCenter([ax, ay], [bx, by], r, sign) {
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    const k = (sign * Math.sqrt(r * r - (d * d) / 4)) / d;
    return [(ax + bx) / 2 - dy * k, (ay + by) / 2 + dx * k];
}
// Given two circles, one centered at ⟨ax,ay⟩ with radius ar, and the other
// centered at ⟨bx,by⟩ with radius br, returns a point at which the two circles
// intersect. There are typically two such points; use the sign +1 or -1 to
// chose between them. Returns [NaN, NaN] if there is no intersection.
// https://mathworld.wolfram.com/Circle-CircleIntersection.html
function circleCircleIntersect([ax, ay, ar], [bx, by, br], sign) {
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    const x = (dx * dx + dy * dy - br * br + ar * ar) / (2 * d);
    const y = sign * Math.sqrt(ar * ar - x * x);
    return [ax + (dx * x + dy * y) / d, ay + (dy * x - dx * y) / d];
}
/** 
 * ```js
 * Plot.arrow(inequality, {x1: "POP_1980", y1: "R90_10_1980", x2: "POP_2015", y2: "R90_10_2015", bend: true})
 * ```
 * 
 * Returns a new arrow with the given *data* and *options*.
 * 
 */
function arrow(data, options = {}) {
    let { x, x1, x2, y, y1, y2, ...remainingOptions } = options;
    [x1, x2] = maybeSameValue(x, x1, x2);
    [y1, y2] = maybeSameValue(y, y1, y2);
    return new Arrow(data, { ...remainingOptions, x1, x2, y1, y2 });
}

class AbstractBar extends Mark {
    constructor(data, channels, options = {}, defaults) {
        super(data, channels, options, defaults);
        const { inset = 0, insetTop = inset, insetRight = inset, insetBottom = inset, insetLeft = inset, rx, ry } = options;
        this.insetTop = number(insetTop);
        this.insetRight = number(insetRight);
        this.insetBottom = number(insetBottom);
        this.insetLeft = number(insetLeft);
        this.rx = impliedString(rx, "auto"); // number or percentage
        this.ry = impliedString(ry, "auto");
        this.cursor = maybePickerCursor(channels.picker);
    }
    render(index, scales, channels, dimensions, context) {
        const { rx, ry } = this;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(this._transform, this, scales)
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("rect")
            .call(applyDirectStyles, this)
            .attr("x", this._x(scales, channels, dimensions))
            .attr("width", this._width(scales, channels, dimensions))
            .attr("y", this._y(scales, channels, dimensions))
            .attr("height", this._height(scales, channels, dimensions))
            .on("click", this._click(scales, channels))
            .call(applyStyle, "cursor", this.cursor)
            .call(applyAttr, "rx", rx)
            .call(applyAttr, "ry", ry)
            .call(applyChannelStyles, this, channels))
            .node();
    }
    _click(scales, { picker: J }) {
        if (!J) {
            return () => { };
        }
        return (event, i) => {
            event.target.dispatchEvent(new CustomEvent("pick", {
                bubbles: true,
                detail: { type: event.type, picked: J[i] }
            }));
        };
    }
    _x(scales, { x: X }, { marginLeft }) {
        const { insetLeft } = this;
        return X ? (i) => X[i] + insetLeft : marginLeft + insetLeft;
    }
    _y(scales, { y: Y }, { marginTop }) {
        const { insetTop } = this;
        return Y ? (i) => Y[i] + insetTop : marginTop + insetTop;
    }
    _width({ x }, { x: X }, { marginRight, marginLeft, width }) {
        const { insetLeft, insetRight } = this;
        const bandwidth = X && x ? x.bandwidth() : width - marginRight - marginLeft;
        return Math.max(0, bandwidth - insetLeft - insetRight);
    }
    _height({ y }, { y: Y }, { marginTop, marginBottom, height }) {
        const { insetTop, insetBottom } = this;
        const bandwidth = Y && y ? y.bandwidth() : height - marginTop - marginBottom;
        return Math.max(0, bandwidth - insetTop - insetBottom);
    }
}
const defaults$g = {
    ariaLabel: "bar"
};
class BarX extends AbstractBar {
    constructor(data, options = {}) {
        const { x1, x2, y, picker = each } = options;
        super(data, {
            x1: { value: x1, scale: "x" },
            x2: { value: x2, scale: "x" },
            y: { value: y, scale: "y", type: "band", optional: true },
            picker: { value: picker, optional: true }
        }, options, defaults$g);
    }
    _transform(selection, mark, { x }) {
        selection.call(applyTransform, mark, { x }, 0, 0);
    }
    _x({ x }, { x1: X1, x2: X2 }, { marginLeft }) {
        const { insetLeft } = this;
        return isCollapsed(x) ? marginLeft + insetLeft : (i) => Math.min(X1[i], X2[i]) + insetLeft;
    }
    _width({ x }, { x1: X1, x2: X2 }, { marginRight, marginLeft, width }) {
        const { insetLeft, insetRight } = this;
        return isCollapsed(x)
            ? width - marginRight - marginLeft - insetLeft - insetRight
            : (i) => Math.max(0, Math.abs(X2[i] - X1[i]) - insetLeft - insetRight);
    }
}
class BarY extends AbstractBar {
    constructor(data, options = {}) {
        const { x, y1, y2, picker = each } = options;
        super(data, {
            y1: { value: y1, scale: "y" },
            y2: { value: y2, scale: "y" },
            x: { value: x, scale: "x", type: "band", optional: true },
            picker: { value: picker, optional: true }
        }, options, defaults$g);
    }
    _transform(selection, mark, { y }) {
        selection.call(applyTransform, mark, { y }, 0, 0);
    }
    _y({ y }, { y1: Y1, y2: Y2 }, { marginTop }) {
        const { insetTop } = this;
        return isCollapsed(y) ? marginTop + insetTop : (i) => Math.min(Y1[i], Y2[i]) + insetTop;
    }
    _height({ y }, { y1: Y1, y2: Y2 }, { marginTop, marginBottom, height }) {
        const { insetTop, insetBottom } = this;
        return isCollapsed(y)
            ? height - marginTop - marginBottom - insetTop - insetBottom
            : (i) => Math.max(0, Math.abs(Y2[i] - Y1[i]) - insetTop - insetBottom);
    }
}
/** 
 * ```js
 * Plot.barX(alphabet, {y: "letter", x: "frequency"})
 * ```
 * 
 * Returns a new horizontal bar↔︎ with the given *data* and *options*. The following channels are required:
 * 
 * * **x1** - the starting horizontal position; bound to the *x* scale
 * * **x2** - the ending horizontal position; bound to the *x* scale
 * 
 * If neither the **x1** nor **x2** option is specified, the **x** option may be specified as shorthand to apply an implicit [stackX transform](https://github.com/observablehq/plot/blob/main/README.md#plotstackxstack-options); this is the typical configuration for a horizontal bar chart with bars aligned at *x* = 0. If the **x** option is not specified, it defaults to the identity function. If *options* is undefined, then it defaults to **x2** as the identity function and **y** as the index of data; this allows an array of numbers to be passed to Plot.barX to make a quick sequential bar chart.
 * 
 * If an **interval** is specified, such as d3.utcDay, **x1** and **x2** can be derived from **x**: *interval*.floor(*x*) is invoked for each *x* to produce *x1*, and *interval*.offset(*x1*) is invoked for each *x1* to produce *x2*. If the interval is specified as a number *n*, *x1* and *x2* are taken as the two consecutive multiples of *n* that bracket *x*.
 * 
 * In addition to the [standard bar channels](https://github.com/observablehq/plot/blob/main/README.md#bar), the following optional channels are supported:
 * 
 * * **y** - the vertical position; bound to the *y* scale, which must be *band*
 * 
 * If the **y** channel is not specified, the bar will span the full vertical extent of the plot (or facet).
 * 
 */
function barX(data, options = { y: indexOf, x2: identity$1 }) {
    return new BarX(data, maybeStackX(maybeIntervalX(maybeIdentityX(options))));
}
/** 
 * ```js
 * Plot.barY(alphabet, {x: "letter", y: "frequency"})
 * ```
 * 
 * Returns a new vertical bar↕︎ with the given *data* and *options*. The following channels are required:
 * 
 * * **y1** - the starting vertical position; bound to the *y* scale
 * * **y2** - the ending vertical position; bound to the *y* scale
 * 
 * If neither the **y1** nor **y2** option is specified, the **y** option may be specified as shorthand to apply an implicit [stackY transform](https://github.com/observablehq/plot/blob/main/README.md#plotstackystack-options); this is the typical configuration for a vertical bar chart with bars aligned at *y* = 0. If the **y** option is not specified, it defaults to the identity function. If *options* is undefined, then it defaults to **y2** as the identity function and **x** as the index of data; this allows an array of numbers to be passed to Plot.barY to make a quick sequential bar chart.
 * 
 * If an **interval** is specified, such as d3.utcDay, **y1** and **y2** can be derived from **y**: *interval*.floor(*y*) is invoked for each *y* to produce *y1*, and *interval*.offset(*y1*) is invoked for each *y1* to produce *y2*. If the interval is specified as a number *n*, *y1* and *y2* are taken as the two consecutive multiples of *n* that bracket *y*.
 * 
 * In addition to the [standard bar channels](https://github.com/observablehq/plot/blob/main/README.md#bar), the following optional channels are supported:
 * 
 * * **x** - the horizontal position; bound to the *x* scale, which must be *band*
 * 
 * If the **x** channel is not specified, the bar will span the full horizontal extent of the plot (or facet).
 * 
 */
function barY(data, options = { x: indexOf, y2: identity$1 }) {
    return new BarY(data, maybeStackY(maybeIntervalY(maybeIdentityY(options))));
}

/** 
 * ```js
 * Plot.mapX("cumsum", {x: d3.randomNormal()})
 * ```
 * 
 * Equivalent to Plot.map({x: *map*, x1: *map*, x2: *map*}, *options*), but ignores any of **x**, **x1**, and **x2** not present in *options*.
 * 
 */
function mapX(map, options = {}) {
    return mapAlias(Object.fromEntries(["x", "x1", "x2"].filter((key) => options[key] != null).map((key) => [key, map])), options);
}
/** 
 * ```js
 * Plot.mapY("cumsum", {y: d3.randomNormal()})
 * ```
 * 
 * Equivalent to Plot.map({y: *map*, y1: *map*, y2: *map*}, *options*), but ignores any of **y**, **y1**, and **y2** not present in *options*.
 * 
 */
function mapY(map, options = {}) {
    return mapAlias(Object.fromEntries(["y", "y1", "y2"].filter((key) => options[key] != null).map((key) => [key, map])), options);
}
/** 
 * ```js
 * Plot.map({y: "cumsum"}, {y: d3.randomNormal()})
 * ```
 * 
 * Groups on the first channel of *z*, *fill*, or *stroke*, if any, and then for each channel declared in the specified *outputs* object, applies the corresponding map method. Each channel in *outputs* must have a corresponding input channel in *options*.
 * 
 */
function map(outputs = {}, options = {}) {
    const z = maybeZ(options);
    const channels = Object.entries(outputs).map(([key, map]) => {
        const input = maybeInput(key, options);
        if (input == null)
            throw new Error(`missing channel: ${key}`);
        const [output, setOutput] = column(input);
        return { key, input, output, setOutput, map: maybeMap(map) };
    });
    return {
        ...basic(options, (data, facets) => {
            const Z = valueof(data, z);
            const X = channels.map(({ input }) => valueof(data, input));
            const MX = channels.map(({ setOutput }) => setOutput(new Array(data.length)));
            for (const facet of facets) {
                for (const I of Z ? d3.group(facet, (i) => Z[i]).values() : [facet]) {
                    channels.forEach(({ map }, i) => map.map(I, X[i], MX[i]));
                }
            }
            return { data, facets };
        }),
        ...Object.fromEntries(channels.map(({ key, output }) => [key, output]))
    };
}
// This is used internally so we can use `map` as an argument name.
const mapAlias = map;
function maybeMap(map) {
    if (map && typeof map.map === "function")
        return map;
    if (typeof map === "function")
        return mapFunction(map);
    switch (`${map}`.toLowerCase()) {
        case "cumsum":
            return mapCumsum;
        case "rank":
            return mapFunction(d3.rank);
        case "quantile":
            return mapFunction(rankQuantile);
    }
    throw new Error(`invalid map: ${map}`);
}
function rankQuantile(V) {
    const n = d3.count(V) - 1;
    return d3.rank(V).map((r) => r / n);
}
function mapFunction(f) {
    return {
        map(I, S, T) {
            const M = f(take(S, I));
            if (M.length !== I.length)
                throw new Error("map function returned a mismatched length");
            for (let i = 0, n = I.length; i < n; ++i)
                T[I[i]] = M[i];
        }
    };
}
const mapCumsum = {
    map(I, S, T) {
        let sum = 0;
        for (const i of I)
            T[i] = sum += S[i];
    }
};

const defaults$f = {
    ariaLabel: "dot",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5
};
function withDefaultSort(options) {
    return options.sort === undefined && options.reverse === undefined
        ? sort({ channel: "r", order: "descending" }, options)
        : options;
}
class Dot extends Mark {
    constructor(data, options = {}) {
        const { x, y, r, rotate, symbol = d3.symbolCircle, frameAnchor } = options;
        const [vrotate, crotate] = maybeNumberChannel(rotate, 0);
        const [vsymbol, csymbol] = maybeSymbolChannel(symbol);
        const [vr, cr] = maybeNumberChannel(r, vsymbol == null ? 3 : 4.5);
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true },
            r: { value: vr, scale: "r", filter: positive, optional: true },
            rotate: { value: vrotate, optional: true },
            symbol: { value: vsymbol, scale: "symbol", optional: true }
        }, withDefaultSort(options), defaults$f);
        this.r = cr;
        this.rotate = crotate;
        this.symbol = csymbol;
        this.frameAnchor = maybeFrameAnchor(frameAnchor);
        // Give a hint to the symbol scale; this allows the symbol scale to chose
        // appropriate default symbols based on whether the dots are filled or
        // stroked, and for the symbol legend to match the appearance of the dots.
        const { channels } = this;
        const { symbol: symbolChannel } = channels;
        if (symbolChannel) {
            const { fill: fillChannel, stroke: strokeChannel } = channels;
            symbolChannel.hint = {
                fill: fillChannel ? (fillChannel.value === symbolChannel.value ? "color" : "currentColor") : this.fill,
                stroke: strokeChannel ? (strokeChannel.value === symbolChannel.value ? "color" : "currentColor") : this.stroke
            };
        }
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y: Y, r: R, rotate: A, symbol: S } = channels;
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        const circle = this.symbol === d3.symbolCircle;
        const { r } = this;
        if (negative(r))
            index = [];
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, { x: X && x, y: Y && y })
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append(circle ? "circle" : "path")
            .call(applyDirectStyles, this)
            .call(circle
            ? (selection) => {
                selection
                    .attr("cx", X ? (i) => X[i] : cx)
                    .attr("cy", Y ? (i) => Y[i] : cy)
                    .attr("r", R ? (i) => R[i] : r);
            }
            : (selection) => {
                const translate = X && Y
                    ? (i) => `translate(${X[i]},${Y[i]})`
                    : X
                        ? (i) => `translate(${X[i]},${cy})`
                        : Y
                            ? (i) => `translate(${cx},${Y[i]})`
                            : () => `translate(${cx},${cy})`;
                selection
                    .attr("transform", A
                    ? (i) => `${translate(i)} rotate(${A[i]})`
                    : this.rotate
                        ? (i) => `${translate(i)} rotate(${this.rotate})`
                        : translate)
                    .attr("d", (i) => {
                    const p = d3.path(), radius = R ? R[i] : r;
                    (S ? S[i] : this.symbol).draw(p, radius * radius * Math.PI);
                    return p;
                });
            })
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
/** 
 * ```js
 * Plot.dot(sales, {x: "units", y: "fruit"})
 * ```
 * 
 * Returns a new dot with the given *data* and *options*. If neither the **x** nor **y** nor **frameAnchor** options are specified, *data* is assumed to be an array of pairs [[*x₀*, *y₀*], [*x₁*, *y₁*], [*x₂*, *y₂*], …] such that **x** = [*x₀*, *x₁*, *x₂*, …] and **y** = [*y₀*, *y₁*, *y₂*, …].
 * 
 */
function dot(data, options = {}) {
    let { x, y, ...remainingOptions } = options;
    if (options.frameAnchor === undefined)
        [x, y] = maybeTuple(x, y);
    return new Dot(data, { ...remainingOptions, x, y });
}
/** 
 * ```js
 * Plot.dotX(cars.map(d => d["economy (mpg)"]))
 * ```
 * 
 * Equivalent to [Plot.dot](https://github.com/observablehq/plot/blob/main/README.md#plotdotdata-options) except that if the **x** option is not specified, it defaults to the identity function and assumes that *data* = [*x₀*, *x₁*, *x₂*, …].
 * 
 * If an **interval** is specified, such as d3.utcDay, **y** is transformed to (*interval*.floor(*y*) + *interval*.offset(*interval*.floor(*y*))) / 2. If the interval is specified as a number *n*, *y* will be the midpoint of two consecutive multiples of *n* that bracket *y*.
 * 
 */
function dotX(data, options = {}) {
    const { x = identity$1, ...remainingOptions } = options;
    return new Dot(data, maybeIntervalMidY({ ...remainingOptions, x }));
}
/** 
 * ```js
 * Plot.dotY(cars.map(d => d["economy (mpg)"]))
 * ```
 * 
 * Equivalent to [Plot.dot](https://github.com/observablehq/plot/blob/main/README.md#plotdotdata-options) except that if the **y** option is not specified, it defaults to the identity function and assumes that *data* = [*y₀*, *y₁*, *y₂*, …].
 * 
 * If an **interval** is specified, such as d3.utcDay, **x** is transformed to (*interval*.floor(*x*) + *interval*.offset(*interval*.floor(*x*))) / 2. If the interval is specified as a number *n*, *x* will be the midpoint of two consecutive multiples of *n* that bracket *x*.
 * 
 */
function dotY(data, options = {}) {
    const { y = identity$1, ...remainingOptions } = options;
    return new Dot(data, maybeIntervalMidX({ ...remainingOptions, y }));
}
/** 
 * Equivalent to [Plot.dot](https://github.com/observablehq/plot/blob/main/README.md#plotdotdata-options) except that the **symbol** option is set to *circle*.
 * 
 */
function circle(data, options) {
    return dot(data, { ...options, symbol: "circle" });
}
/** 
 * Equivalent to [Plot.dot](https://github.com/observablehq/plot/blob/main/README.md#plotdotdata-options) except that the **symbol** option is set to *hexagon*.
 * 
 */
function hexagon(data, options) {
    return dot(data, { ...options, symbol: "hexagon" });
}

const defaults$e = {
    ariaLabel: "rule",
    fill: null,
    stroke: "currentColor"
};
class RuleX extends Mark {
    constructor(data, options = {}) {
        const { x, y1, y2, inset = 0, insetTop = inset, insetBottom = inset } = options;
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y1: { value: y1, scale: "y", optional: true },
            y2: { value: y2, scale: "y", optional: true }
        }, options, defaults$e);
        this.insetTop = number(insetTop);
        this.insetBottom = number(insetBottom);
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y1: Y1, y2: Y2 } = channels;
        const { width, height, marginTop, marginRight, marginLeft, marginBottom } = dimensions;
        const { insetTop, insetBottom } = this;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions)
            .call(applyTransform, this, { x: X && x }, offset, 0)
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("line")
            .call(applyDirectStyles, this)
            .attr("x1", X ? (i) => X[i] : (marginLeft + width - marginRight) / 2)
            .attr("x2", X ? (i) => X[i] : (marginLeft + width - marginRight) / 2)
            .attr("y1", Y1 && !isCollapsed(y) ? (i) => Y1[i] + insetTop : marginTop + insetTop)
            .attr("y2", Y2 && !isCollapsed(y)
            ? y.bandwidth
                ? (i) => Y2[i] + y.bandwidth() - insetBottom
                : (i) => Y2[i] - insetBottom
            : height - marginBottom - insetBottom)
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
class RuleY extends Mark {
    constructor(data, options = {}) {
        const { x1, x2, y, inset = 0, insetRight = inset, insetLeft = inset } = options;
        super(data, {
            y: { value: y, scale: "y", optional: true },
            x1: { value: x1, scale: "x", optional: true },
            x2: { value: x2, scale: "x", optional: true }
        }, options, defaults$e);
        this.insetRight = number(insetRight);
        this.insetLeft = number(insetLeft);
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { y: Y, x1: X1, x2: X2 } = channels;
        const { width, height, marginTop, marginRight, marginLeft, marginBottom } = dimensions;
        const { insetLeft, insetRight } = this;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, { y: Y && y }, 0, offset)
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("line")
            .call(applyDirectStyles, this)
            .attr("x1", X1 && !isCollapsed(x) ? (i) => X1[i] + insetLeft : marginLeft + insetLeft)
            .attr("x2", X2 && !isCollapsed(x)
            ? x.bandwidth
                ? (i) => X2[i] + x.bandwidth() - insetRight
                : (i) => X2[i] - insetRight
            : width - marginRight - insetRight)
            .attr("y1", Y ? (i) => Y[i] : (marginTop + height - marginBottom) / 2)
            .attr("y2", Y ? (i) => Y[i] : (marginTop + height - marginBottom) / 2)
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
/** 
 * ```js
 * Plot.ruleX([0]) // as annotation
 * ```
 * ```js
 * Plot.ruleX(alphabet, {x: "letter", y: "frequency"}) // like barY
 * ```
 * 
 * Returns a new rule↕︎ with the given *data* and *options*. In addition to the [standard mark options](https://github.com/observablehq/plot/blob/main/README.md#marks), the following channels are optional:
 * 
 * * **x** - the horizontal position; bound to the *x* scale
 * * **y1** - the starting vertical position; bound to the *y* scale
 * * **y2** - the ending vertical position; bound to the *y* scale
 * 
 * If the **x** option is not specified, it defaults to the identity function and assumes that *data* = [*x₀*, *x₁*, *x₂*, …]. If a **y** option is specified, it is shorthand for the **y2** option with **y1** equal to zero; this is the typical configuration for a vertical lollipop chart with rules aligned at *y* = 0. If the **y1** channel is not specified, the rule will start at the top of the plot (or facet). If the **y2** channel is not specified, the rule will end at the bottom of the plot (or facet).
 * 
 * If an **interval** is specified, such as d3.utcDay, **y1** and **y2** can be derived from **y**: *interval*.floor(*y*) is invoked for each *y* to produce *y1*, and *interval*.offset(*y1*) is invoked for each *y1* to produce *y2*. If the interval is specified as a number *n*, *y1* and *y2* are taken as the two consecutive multiples of *n* that bracket *y*.
 * 
 */
function ruleX(data, options) {
    let { x = identity$1, y, y1, y2, ...rest } = maybeIntervalY(options);
    [y1, y2] = maybeOptionalZero(y, y1, y2);
    return new RuleX(data, { ...rest, x, y1, y2 });
}
/** 
 * ```js
 * Plot.ruleY([0]) // as annotation
 * ```
 * 
 * ```js
 * Plot.ruleY(alphabet, {y: "letter", x: "frequency"}) // like barX
 * ```
 * 
 * Returns a new rule↔︎ with the given *data* and *options*. In addition to the [standard mark options](https://github.com/observablehq/plot/blob/main/README.md#marks), the following channels are optional:
 * 
 * * **y** - the vertical position; bound to the *y* scale
 * * **x1** - the starting horizontal position; bound to the *x* scale
 * * **x2** - the ending horizontal position; bound to the *x* scale
 * 
 * If the **y** option is not specified, it defaults to the identity function and assumes that *data* = [*y₀*, *y₁*, *y₂*, …]. If the **x** option is specified, it is shorthand for the **x2** option with **x1** equal to zero; this is the typical configuration for a horizontal lollipop chart with rules aligned at *x* = 0. If the **x1** channel is not specified, the rule will start at the left edge of the plot (or facet). If the **x2** channel is not specified, the rule will end at the right edge of the plot (or facet).
 * 
 * If an **interval** is specified, such as d3.utcDay, **x1** and **x2** can be derived from **x**: *interval*.floor(*x*) is invoked for each *x* to produce *x1*, and *interval*.offset(*x1*) is invoked for each *x1* to produce *x2*. If the interval is specified as a number *n*, *x1* and *x2* are taken as the two consecutive multiples of *n* that bracket *x*.
 * 
 */
function ruleY(data, options) {
    let { y = identity$1, x, x1, x2, ...rest } = maybeIntervalX(options);
    [x1, x2] = maybeOptionalZero(x, x1, x2);
    return new RuleY(data, { ...rest, y, x1, x2 });
}
// For marks specified either as [0, x] or [x1, x2], or nothing.
function maybeOptionalZero(x, x1, x2) {
    if (x === undefined) {
        if (x1 === undefined) {
            if (x2 !== undefined)
                return [0, x2];
        }
        else {
            if (x2 === undefined)
                return [0, x1];
        }
    }
    else if (x1 === undefined) {
        return x2 === undefined ? [0, x] : [x, x2];
    }
    else if (x2 === undefined) {
        return [x, x1];
    }
    return [x1, x2];
}

const defaults$d = {
    ariaLabel: "tick",
    fill: null,
    stroke: "currentColor"
};
class AbstractTick extends Mark {
    constructor(data, channels, options) {
        super(data, channels, options, defaults$d);
    }
    render(index, scales, channels, dimensions, context) {
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(this._transform, this, scales)
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("line")
            .call(applyDirectStyles, this)
            .attr("x1", this._x1(scales, channels, dimensions))
            .attr("x2", this._x2(scales, channels, dimensions))
            .attr("y1", this._y1(scales, channels, dimensions))
            .attr("y2", this._y2(scales, channels, dimensions))
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
class TickX extends AbstractTick {
    constructor(data, options = {}) {
        const { x, y, inset = 0, insetTop = inset, insetBottom = inset } = options;
        super(data, {
            x: { value: x, scale: "x" },
            y: { value: y, scale: "y", type: "band", optional: true }
        }, options);
        this.insetTop = number(insetTop);
        this.insetBottom = number(insetBottom);
    }
    _transform(selection, mark, { x }) {
        selection.call(applyTransform, mark, { x }, offset, 0);
    }
    _x1(scales, { x: X }) {
        return (i) => X[i];
    }
    _x2(scales, { x: X }) {
        return (i) => X[i];
    }
    _y1({ y }, { y: Y }, { marginTop }) {
        const { insetTop } = this;
        return Y && y ? (i) => Y[i] + insetTop : marginTop + insetTop;
    }
    _y2({ y }, { y: Y }, { height, marginBottom }) {
        const { insetBottom } = this;
        return Y && y ? (i) => Y[i] + y.bandwidth() - insetBottom : height - marginBottom - insetBottom;
    }
}
class TickY extends AbstractTick {
    constructor(data, options = {}) {
        const { x, y, inset = 0, insetRight = inset, insetLeft = inset } = options;
        super(data, {
            y: { value: y, scale: "y" },
            x: { value: x, scale: "x", type: "band", optional: true }
        }, options);
        this.insetRight = number(insetRight);
        this.insetLeft = number(insetLeft);
    }
    _transform(selection, mark, { y }) {
        selection.call(applyTransform, mark, { y }, 0, offset);
    }
    _x1({ x }, { x: X }, { marginLeft }) {
        const { insetLeft } = this;
        return X && x ? (i) => X[i] + insetLeft : marginLeft + insetLeft;
    }
    _x2({ x }, { x: X }, { width, marginRight }) {
        const { insetRight } = this;
        return X && x ? (i) => X[i] + x.bandwidth() - insetRight : width - marginRight - insetRight;
    }
    _y1(scales, { y: Y }) {
        return (i) => Y[i];
    }
    _y2(scales, { y: Y }) {
        return (i) => Y[i];
    }
}
/** 
 * ```js
 * Plot.tickX(stateage, {x: "population", y: "age"})
 * ```
 * 
 * Returns a new tick↕︎ with the given *data* and *options*. The following channels are required:
 * 
 * * **x** - the horizontal position; bound to the *x* scale
 * 
 * The following optional channels are supported:
 * 
 * * **y** - the vertical position; bound to the *y* scale, which must be *band*
 * 
 * If the **y** channel is not specified, the tick will span the full vertical extent of the plot (or facet).
 * 
 */
function tickX(data, options = {}) {
    const { x = identity$1, ...remainingOptions } = options;
    return new TickX(data, { ...remainingOptions, x });
}
/** 
 * ```js
 * Plot.tickY(stateage, {y: "population", x: "age"})
 * ```
 * 
 * Returns a new tick↔︎ with the given *data* and *options*. The following channels are required:
 * 
 * * **y** - the vertical position; bound to the *y* scale
 * 
 * The following optional channels are supported:
 * 
 * * **x** - the horizontal position; bound to the *x* scale, which must be *band*
 * 
 * If the **x** channel is not specified, the tick will span the full vertical extent of the plot (or facet).
 * 
 */
function tickY(data, options = {}) {
    const { y = identity$1, ...remainingOptions } = options;
    return new TickY(data, { ...remainingOptions, y });
}

/** 
 * ```js
 * Plot.boxX(simpsons.map(d => d.imdb_rating))
 * ```
 * 
 * Returns a horizontal boxplot mark. If the **x** option is not specified, it defaults to the identity function, as when *data* is an array of numbers. If the **y** option is not specified, it defaults to null; if the **y** option is specified, it should represent an ordinal (discrete) value.
 * 
 */
function boxX(data, options = {}) {
    // Returns a composite mark for producing a horizontal box plot, applying the
    // necessary statistical transforms. The boxes are grouped by y, if present.
    const { x = { transform: (x) => x }, y = null, fill = "#ccc", fillOpacity, stroke = "currentColor", strokeOpacity, strokeWidth = 2, sort, ...remainingOptions } = options;
    const group = y != null ? groupY : groupZ$1;
    return marks(ruleY(data, group({ x1: loqr1, x2: hiqr2 }, { x, y, stroke, strokeOpacity, ...remainingOptions })), barX(data, group({ x1: "p25", x2: "p75" }, { x, y, fill, fillOpacity, ...remainingOptions })), tickX(data, group({ x: "p50" }, { x, y, stroke, strokeOpacity, strokeWidth, sort, ...remainingOptions })), dot(data, map({ x: oqr }, { x, y, z: y, stroke, strokeOpacity, ...remainingOptions })));
}
/** 
 * ```js
 * Plot.boxY(simpsons.map(d => d.imdb_rating))
 * ```
 * 
 * Returns a vertical boxplot mark. If the **y** option is not specified, it defaults to the identity function, as when *data* is an array of numbers. If the **x** option is not specified, it defaults to null; if the **x** option is specified, it should represent an ordinal (discrete) value.
 * 
 */
function boxY(data, options = {}) {
    // Returns a composite mark for producing a vertical box plot, applying the
    // necessary statistical transforms. The boxes are grouped by x, if present.
    const { y = { transform: (y) => y }, x = null, fill = "#ccc", fillOpacity, stroke = "currentColor", strokeOpacity, strokeWidth = 2, sort, ...remainingOptions } = options;
    const group = x != null ? groupX : groupZ$1;
    return marks(ruleX(data, group({ y1: loqr1, y2: hiqr2 }, { x, y, stroke, strokeOpacity, ...remainingOptions })), barY(data, group({ y1: "p25", y2: "p75" }, { x, y, fill, fillOpacity, ...remainingOptions })), tickY(data, group({ y: "p50" }, { x, y, stroke, strokeOpacity, strokeWidth, sort, ...remainingOptions })), dot(data, map({ y: oqr }, { x, y, z: x, stroke, strokeOpacity, ...remainingOptions })));
}
// A map function that returns only outliers, returning NaN for non-outliers
function oqr(values) {
    const r1 = loqr1(values);
    const r2 = hiqr2(values);
    return values.map((v) => (v < r1 || v > r2 ? v : NaN));
}
function loqr1(values, value) {
    const lo = quartile1(values, value) * 2.5 - quartile3(values, value) * 1.5;
    return d3.min(values, (d) => (d >= lo ? d : NaN));
}
function hiqr2(values, value) {
    const hi = quartile3(values, value) * 2.5 - quartile1(values, value) * 1.5;
    return d3.max(values, (d) => (d <= hi ? d : NaN));
}
function quartile1(values, value) {
    return d3.quantile(values, 0.25, value);
}
function quartile3(values, value) {
    return d3.quantile(values, 0.75, value);
}

const defaults$c = {
    ariaLabel: "cell"
};
class Cell extends AbstractBar {
    constructor(data, { x, y, ...options } = {}) {
        super(data, {
            x: { value: x, scale: "x", type: "band", optional: true },
            y: { value: y, scale: "y", type: "band", optional: true }
        }, options, defaults$c);
    }
    _transform(selection, mark) {
        // apply dx, dy
        selection.call(applyTransform, mark, {}, 0, 0);
    }
}
/** 
 * ```js
 * Plot.cell(simpsons, {x: "number_in_season", y: "season", fill: "imdb_rating"})
 * ```
 * 
 * Returns a new cell with the given *data* and *options*. If neither the **x** nor **y** options are specified, *data* is assumed to be an array of pairs [[*x₀*, *y₀*], [*x₁*, *y₁*], [*x₂*, *y₂*], …] such that **x** = [*x₀*, *x₁*, *x₂*, …] and **y** = [*y₀*, *y₁*, *y₂*, …].
 * 
 */
function cell(data, options = {}) {
    let { x, y, ...remainingOptions } = options;
    [x, y] = maybeTuple(x, y);
    return new Cell(data, { ...remainingOptions, x, y });
}
/** 
 * ```js
 * Plot.cellX(simpsons.map(d => d.imdb_rating))
 * ```
 * 
 * Equivalent to [Plot.cell](https://github.com/observablehq/plot/blob/main/README.md#plotcelldata-options), except that if the **x** option is not specified, it defaults to [0, 1, 2, …], and if the **fill** option is not specified and **stroke** is not a channel, the fill defaults to the identity function and assumes that *data* = [*x₀*, *x₁*, *x₂*, …].
 * 
 */
function cellX(data, options = {}) {
    let { x = indexOf, fill, stroke, ...remainingOptions } = options;
    if (fill === undefined && maybeColorChannel(stroke)[0] === undefined)
        fill = identity$1;
    return new Cell(data, { ...remainingOptions, x, fill, stroke });
}
/** 
 * ```js
 * Plot.cellY(simpsons.map(d => d.imdb_rating))
 * ```
 * 
 * Equivalent to [Plot.cell](https://github.com/observablehq/plot/blob/main/README.md#plotcelldata-options), except that if the **y** option is not specified, it defaults to [0, 1, 2, …], and if the **fill** option is not specified and **stroke** is not a channel, the fill defaults to the identity function and assumes that *data* = [*y₀*, *y₁*, *y₂*, …].
 * 
 */
function cellY(data, options = {}) {
    let { y = indexOf, fill, stroke, ...remainingOptions } = options;
    if (fill === undefined && maybeColorChannel(stroke)[0] === undefined)
        fill = identity$1;
    return new Cell(data, { ...remainingOptions, y, fill, stroke });
}

const delaunayLinkDefaults = {
    ariaLabel: "delaunay link",
    fill: "none",
    stroke: "currentColor",
    strokeMiterlimit: 1
};
const delaunayMeshDefaults = {
    ariaLabel: "delaunay mesh",
    fill: null,
    stroke: "currentColor",
    strokeOpacity: 0.2
};
const hullDefaults = {
    ariaLabel: "hull",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeMiterlimit: 1
};
const voronoiDefaults = {
    ariaLabel: "voronoi",
    fill: "none",
    stroke: "currentColor",
    strokeMiterlimit: 1
};
const voronoiMeshDefaults = {
    ariaLabel: "voronoi mesh",
    fill: null,
    stroke: "currentColor",
    strokeOpacity: 0.2
};
class DelaunayLink extends Mark {
    constructor(data, options = {}) {
        const { x, y, z, curve, tension } = options;
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true },
            z: { value: z, optional: true }
        }, options, delaunayLinkDefaults);
        this.curve = Curve(curve, tension);
        markers(this, options);
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y: Y, z: Z } = channels;
        const { curve } = this;
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        const xi = X ? (i) => X[i] : constant(cx);
        const yi = Y ? (i) => Y[i] : constant(cy);
        const mark = this;
        function links(index) {
            let i = -1;
            const newIndex = [];
            const newChannels = {};
            for (const k in channels)
                newChannels[k] = [];
            const X1 = [];
            const X2 = [];
            const Y1 = [];
            const Y2 = [];
            function link(ti, tj) {
                ti = index[ti];
                tj = index[tj];
                newIndex.push(++i);
                X1[i] = xi(ti);
                Y1[i] = yi(ti);
                X2[i] = xi(tj);
                Y2[i] = yi(tj);
                for (const k in channels)
                    newChannels[k].push(channels[k][tj]);
            }
            const { halfedges, hull, triangles } = d3.Delaunay.from(index, xi, yi);
            for (let i = 0; i < halfedges.length; ++i) {
                // inner edges
                const j = halfedges[i];
                if (j > i)
                    link(triangles[i], triangles[j]);
            }
            for (let i = 0; i < hull.length; ++i) {
                // convex hull
                link(hull[i], hull[(i + 1) % hull.length]);
            }
            d3.select(this)
                .selectAll()
                .data(newIndex)
                .join("path")
                .call(applyDirectStyles, mark)
                .attr("d", (i) => {
                const p = d3.path();
                const c = curve(p);
                c.lineStart();
                c.point(X1[i], Y1[i]);
                c.point(X2[i], Y2[i]);
                c.lineEnd();
                return p;
            })
                .call(applyChannelStyles, mark, newChannels)
                .call(applyMarkers, mark, newChannels);
        }
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, { x: X && x, y: Y && y })
            .call(Z
            ? (g) => g
                .selectAll()
                .data(d3.group(index, (i) => Z[i]).values())
                .enter()
                .append("g")
                .each(links)
            : (g) => g.datum(index).each(links))
            .node();
    }
}
class AbstractDelaunayMark extends Mark {
    constructor(data, options = {}, defaults, zof = ({ z }) => z) {
        const { x, y } = options;
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true },
            z: { value: zof(options), optional: true }
        }, options, defaults);
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y: Y, z: Z } = channels;
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        const xi = X ? (i) => X[i] : constant(cx);
        const yi = Y ? (i) => Y[i] : constant(cy);
        const mark = this;
        function mesh(index) {
            const delaunay = d3.Delaunay.from(index, xi, yi);
            d3.select(this)
                .append("path")
                .datum(index[0])
                .call(applyDirectStyles, mark)
                .attr("d", mark._render(delaunay, dimensions))
                .call(applyChannelStyles, mark, channels);
        }
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, { x: X && x, y: Y && y })
            .call(Z
            ? (g) => g
                .selectAll()
                .data(d3.group(index, (i) => Z[i]).values())
                .enter()
                .append("g")
                .each(mesh)
            : (g) => g.datum(index).each(mesh))
            .node();
    }
}
class DelaunayMesh extends AbstractDelaunayMark {
    constructor(data, options = {}) {
        super(data, options, delaunayMeshDefaults);
        this.fill = "none";
    }
    _render(delaunay) {
        return delaunay.render();
    }
}
class Hull extends AbstractDelaunayMark {
    constructor(data, options = {}) {
        super(data, options, hullDefaults, maybeZ);
    }
    _render(delaunay) {
        return delaunay.renderHull();
    }
}
class Voronoi extends Mark {
    constructor(data, options = {}) {
        const { x, y, z } = options;
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true },
            z: { value: z, optional: true }
        }, options, voronoiDefaults);
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y: Y, z: Z } = channels;
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        const xi = X ? (i) => X[i] : constant(cx);
        const yi = Y ? (i) => Y[i] : constant(cy);
        function cells(index) {
            const delaunay = d3.Delaunay.from(index, xi, yi);
            const voronoi = voronoiof(delaunay, dimensions);
            d3.select(this)
                .selectAll()
                .data(index)
                .enter()
                .append("path")
                .call(applyDirectStyles, this)
                .attr("d", (_, i) => voronoi.renderCell(i))
                .call(applyChannelStyles, this, channels);
        }
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, { x: X && x, y: Y && y })
            .call(Z
            ? (g) => g
                .selectAll()
                .data(d3.group(index, (i) => Z[i]).values())
                .enter()
                .append("g")
                .each(cells)
            : (g) => g.datum(index).each(cells))
            .node();
    }
}
class VoronoiMesh extends AbstractDelaunayMark {
    constructor(data, options) {
        super(data, options, voronoiMeshDefaults);
        this.fill = "none";
    }
    _render(delaunay, dimensions) {
        return voronoiof(delaunay, dimensions).render();
    }
}
function voronoiof(delaunay, dimensions) {
    const { width, height, marginTop, marginRight, marginBottom, marginLeft } = dimensions;
    return delaunay.voronoi([marginLeft, marginTop, width - marginRight, height - marginBottom]);
}
function delaunayMark(DelaunayMark, data, { x, y, ...options } = {}) {
    [x, y] = maybeTuple(x, y);
    return new DelaunayMark(data, { ...options, x, y });
}
/** 
 * Draws links for each edge of the Delaunay triangulation of the points given by the **x** and **y** channels. Supports the same options as the [link mark](https://github.com/observablehq/plot/blob/main/README.md#link), except that **x1**, **y1**, **x2**, and **y2** are derived automatically from **x** and **y**. When an aesthetic channel is specified (such as **stroke** or **strokeWidth**), the link inherits the corresponding channel value from one of its two endpoints arbitrarily.
 * 
 * If a **z** channel is specified, the input points are grouped by *z*, and separate Delaunay triangulations are constructed for each group.
 * 
 */
function delaunayLink(data, options) {
    return delaunayMark(DelaunayLink, data, options);
}
/** 
 * Draws a mesh of the Delaunay triangulation of the points given by the **x** and **y** channels. The **stroke** option defaults to _currentColor_, and the **strokeOpacity** defaults to 0.2. The **fill** option is not supported. When an aesthetic channel is specified (such as **stroke** or **strokeWidth**), the mesh inherits the corresponding channel value from one of its constituent points arbitrarily.
 * 
 * If a **z** channel is specified, the input points are grouped by *z*, and separate Delaunay triangulations are constructed for each group.
 * 
 */
function delaunayMesh(data, options) {
    return delaunayMark(DelaunayMesh, data, options);
}
/** 
 * Draws a convex hull around the points given by the **x** and **y** channels. The **stroke** option defaults to _currentColor_ and the **fill** option defaults to _none_. When an aesthetic channel is specified (such as **stroke** or **strokeWidth**), the hull inherits the corresponding channel value from one of its constituent points arbitrarily.
 * 
 * If a **z** channel is specified, the input points are grouped by *z*, and separate convex hulls are constructed for each group. If the **z** channel is not specified, it defaults to either the **fill** channel, if any, or the **stroke** channel, if any.
 * 
 */
function hull(data, options) {
    return delaunayMark(Hull, data, options);
}
/** 
 * Draws polygons for each cell of the Voronoi tesselation of the points given by the **x** and **y** channels.
 * 
 * If a **z** channel is specified, the input points are grouped by *z*, and separate Voronoi tesselations are constructed for each group.
 * 
 */
function voronoi(data, options) {
    return delaunayMark(Voronoi, data, options);
}
/** 
 * Draws a mesh for the cell boundaries of the Voronoi tesselation of the points given by the **x** and **y** channels. The **stroke** option defaults to _currentColor_, and the **strokeOpacity** defaults to 0.2. The **fill** option is not supported. When an aesthetic channel is specified (such as **stroke** or **strokeWidth**), the mesh inherits the corresponding channel value from one of its constituent points arbitrarily.
 * 
 * If a **z** channel is specified, the input points are grouped by *z*, and separate Voronoi tesselations are constructed for each group.
 * 
 */
function voronoiMesh(data, options) {
    return delaunayMark(VoronoiMesh, data, options);
}

const defaults$b = {
    ariaLabel: "density",
    fill: "none",
    stroke: "currentColor",
    strokeMiterlimit: 1
};
class Density extends Mark {
    constructor(data, { x, y, z, weight, fill, stroke, ...options } = {}) {
        // If fill or stroke is specified as “density”, then temporarily treat these
        // as a literal color when computing defaults and maybeZ; below, we’ll unset
        // these constant colors back to undefined since they will instead be
        // populated by a channel generated by the initializer.
        const fillDensity = isDensity(fill) && ((fill = "currentColor"), true);
        const strokeDensity = isDensity(stroke) && ((stroke = "currentColor"), true);
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true },
            z: { value: maybeZ({ z, fill, stroke }), optional: true },
            weight: { value: weight, optional: true }
        }, densityInitializer({ ...options, fill, stroke }, fillDensity, strokeDensity), defaults$b);
        if (fillDensity)
            this.fill = undefined;
        if (strokeDensity)
            this.stroke = undefined;
        this.z = z;
    }
    filter(index) {
        return index; // don’t filter contours constructed by initializer
    }
    render(index, scales, channels, dimensions, context) {
        const { contours } = channels;
        const path = d3.geoPath();
        return d3.create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, {})
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("path")
            .call(applyDirectStyles, this)
            .call(applyChannelStyles, this, channels)
            .attr("d", (i) => path(contours[i])))
            .node();
    }
}
/** 
 * Draws contours representing the estimated density of the two-dimensional points given by the **x** and **y** channels, and possibly weighted by the **weight** channel. If either of the **x** or **y** channels are not specified, the corresponding position is controlled by the **frameAnchor** option.
 * 
 * The **thresholds** option, which defaults to 20, specifies one more than the number of contours that will be computed at uniformly-spaced intervals between 0 (exclusive) and the maximum density (exclusive). The **thresholds** option may also be specified as an array or iterable of explicit density values. The **bandwidth** option, which defaults to 20, specifies the standard deviation of the Gaussian kernel used for estimation in pixels.
 * 
 * If a **z**, **stroke** or **fill** channel is specified, the input points are grouped by series, and separate sets of contours are generated for each series. If the **stroke** or **fill** is specified as *density*, a color channel is constructed with values representing the density threshold value of each contour.
 * 
 */
function density(data, options = {}) {
    let { x, y, ...remainingOptions } = options;
    [x, y] = maybeTuple(x, y);
    return new Density(data, { ...remainingOptions, x, y });
}
const dropChannels = new Set(["x", "y", "z", "weight"]);
function densityInitializer(options, fillDensity, strokeDensity) {
    const k = 100; // arbitrary scale factor for readability
    let { bandwidth, thresholds } = options;
    bandwidth = bandwidth === undefined ? 20 : +bandwidth;
    thresholds =
        thresholds === undefined
            ? 20
            : typeof thresholds?.[Symbol.iterator] === "function"
                ? coerceNumbers(thresholds)
                : +thresholds;
    return initializer(options, function (data, facets, channels, scales, dimensions, context) {
        const W = channels.weight ? coerceNumbers(channels.weight.value) : null;
        const Z = channels.z?.value;
        const { z } = this;
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        const { width, height } = dimensions;
        // Get the (either scaled or projected) xy channels.
        const { x: X, y: Y } = Position(channels, scales, context);
        // Group any of the input channels according to the first index associated
        // with each z-series or facet. Drop any channels not be needed for
        // rendering after the contours are computed.
        const newChannels = Object.fromEntries(Object.entries(channels)
            .filter(([key]) => !dropChannels.has(key))
            .map(([key, channel]) => [key, { ...channel, value: [] }]));
        // If the fill or stroke encodes density, construct new output channels.
        const FD = fillDensity && [];
        const SD = strokeDensity && [];
        const density = d3.contourDensity()
            .x(X ? (i) => X[i] : cx)
            .y(Y ? (i) => Y[i] : cy)
            .weight(W ? (i) => W[i] : 1)
            .size([width, height])
            .bandwidth(bandwidth);
        // Compute the grid for each facet-series.
        const facetsContours = [];
        for (const facet of facets) {
            const facetContours = [];
            facetsContours.push(facetContours);
            for (const index of Z ? groupZ(facet, Z, z) : [facet]) {
                const contour = density.contours(index);
                facetContours.push([index, contour]);
            }
        }
        // If explicit thresholds were not specified, find the maximum density of
        // all grids and use this to compute thresholds.
        let T = thresholds;
        if (!isTypedArray(T)) {
            let maxValue = 0;
            for (const facetContours of facetsContours) {
                for (const [, contour] of facetContours) {
                    const max = contour.max;
                    if (max > maxValue)
                        maxValue = max;
                }
            }
            T = Float64Array.from({ length: thresholds - 1 }, (_, i) => (maxValue * k * (i + 1)) / thresholds);
        }
        // Generate contours for each facet-series.
        const newFacets = [];
        const contours = [];
        for (const facetContours of facetsContours) {
            const newFacet = [];
            newFacets.push(newFacet);
            for (const [index, contour] of facetContours) {
                for (const t of T) {
                    newFacet.push(contours.length);
                    contours.push(contour(t / k));
                    if (FD)
                        FD.push(t);
                    if (SD)
                        SD.push(t);
                    for (const key in newChannels) {
                        newChannels[key].value.push(channels[key].value[index[0]]);
                    }
                }
            }
        }
        // If the fill or stroke encodes density, ensure that a zero value is
        // included so that the default color scale domain starts at zero. Otherwise
        // if the starting range value is the same as the background color, the
        // first contour might not be visible.
        if (FD)
            FD.push(0);
        if (SD)
            SD.push(0);
        return {
            data,
            facets: newFacets,
            channels: {
                ...newChannels,
                ...(FD && { fill: { value: FD, scale: "color" } }),
                ...(SD && { stroke: { value: SD, scale: "color" } }),
                contours: { value: contours }
            }
        };
    });
}
function isDensity(value) {
    return /^density$/i.test(value);
}

const defaults$a = {
    ariaLabel: "frame",
    fill: "none",
    stroke: "currentColor"
};
class Frame extends Mark {
    constructor(options = {}) {
        const { inset = 0, insetTop = inset, insetRight = inset, insetBottom = inset, insetLeft = inset, rx, ry } = options;
        super(undefined, undefined, options, defaults$a);
        this.insetTop = number(insetTop);
        this.insetRight = number(insetRight);
        this.insetBottom = number(insetBottom);
        this.insetLeft = number(insetLeft);
        this.rx = number(rx);
        this.ry = number(ry);
    }
    render(index, scales, channels, dimensions, context) {
        const { marginTop, marginRight, marginBottom, marginLeft, width, height } = dimensions;
        const { insetTop, insetRight, insetBottom, insetLeft, rx, ry } = this;
        return create("svg:rect", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyDirectStyles, this)
            .call(applyTransform, this, {})
            .attr("x", marginLeft + insetLeft)
            .attr("y", marginTop + insetTop)
            .attr("width", width - marginLeft - marginRight - insetLeft - insetRight)
            .attr("height", height - marginTop - marginBottom - insetTop - insetBottom)
            .attr("rx", rx)
            .attr("ry", ry)
            .node();
    }
}
/** 
 * ```js
 * Plot.frame({stroke: "red"})
 * ```
 * 
 * Returns a new frame with the specified *options*.
 * 
 */
function frame(options) {
    return new Frame(options);
}

const defaults$9 = {
    ariaLabel: "geo",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeMiterlimit: 1
};
class Geo extends Mark {
    constructor(data, options = {}) {
        const [vr, cr] = maybeNumberChannel(options.r, 3);
        super(data, {
            geometry: { value: options.geometry },
            r: { value: vr, scale: "r", filter: positive, optional: true }
        }, withDefaultSort(options), defaults$9);
        this.r = cr;
    }
    render(index, scales, channels, dimensions, context) {
        const { geometry: G, r: R } = channels;
        const path = d3.geoPath(context.projection ?? scaleProjection(scales));
        const { r } = this;
        if (negative(r))
            index = [];
        else if (r !== undefined)
            path.pointRadius(r);
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, scales)
            .call((g) => {
            g.selectAll()
                .data(index)
                .enter()
                .append("path")
                .call(applyDirectStyles, this)
                .attr("d", R ? (i) => path.pointRadius(R[i])(G[i]) : (i) => path(G[i]))
                .call(applyChannelStyles, this, channels);
        })
            .node();
    }
}
// If no projection is specified, default to a projection that passes points
// through the x and y scales, if any.
function scaleProjection({ x: X, y: Y }) {
    if (X || Y) {
        X ??= (x) => x;
        Y ??= (y) => y;
        return d3.geoTransform({
            point(x, y) {
                this.stream.point(X(x), Y(y));
            }
        });
    }
}
function geo(data, { geometry = identity$1, ...options } = {}) {
    switch (data?.type) {
        case "FeatureCollection":
            data = data.features;
            break;
        case "GeometryCollection":
            data = data.geometries;
            break;
        case "Feature":
        case "LineString":
        case "MultiLineString":
        case "MultiPoint":
        case "MultiPolygon":
        case "Point":
        case "Polygon":
        case "Sphere":
            data = [data];
            break;
    }
    return new Geo(data, { geometry, ...options });
}
function sphere({ strokeWidth = 1.5, ...options } = {}) {
    return geo({ type: "Sphere" }, { strokeWidth, ...options });
}
function graticule({ strokeOpacity = 0.1, ...options } = {}) {
    return geo(d3.geoGraticule10(), { strokeOpacity, ...options });
}

// We don’t want the hexagons to align with the edges of the plot frame, as that
// would cause extreme x-values (the upper bound of the default x-scale domain)
// to be rounded up into a floating bin to the right of the plot. Therefore,
// rather than centering the origin hexagon around ⟨0,0⟩ in screen coordinates,
// we offset slightly to ⟨0.5,0⟩. The hexgrid mark uses the same origin.
const ox = 0.5, oy = 0;
/** 
 * Aggregates the given input channels into hexagonal bins, creating output channels with the reduced data. The *options* must specify the **x** and **y** channels. The **binWidth** option (default 20) defines the distance between centers of neighboring hexagons in pixels. If any of **z**, **fill**, or **stroke** is a channel, the first of these channels will be used to subdivide bins. The *outputs* options are similar to the [bin transform](https://github.com/observablehq/plot/blob/main/README.md#bin); each output channel receives as input, for each hexagon, the subset of the data which has been matched to its center. The outputs object specifies the aggregation method for each output channel.
 * 
 * The following aggregation methods are supported:
 * 
 * * *first* - the first value, in input order
 * * *last* - the last value, in input order
 * * *count* - the number of elements (frequency)
 * * *distinct* - the number of distinct values
 * * *sum* - the sum of values
 * * *proportion* - the sum proportional to the overall total (weighted frequency)
 * * *proportion-facet* - the sum proportional to the facet total
 * * *min* - the minimum value
 * * *min-index* - the zero-based index of the minimum value
 * * *max* - the maximum value
 * * *max-index* - the zero-based index of the maximum value
 * * *mean* - the mean value (average)
 * * *median* - the median value
 * * *deviation* - the standard deviation
 * * *variance* - the variance per [Welford’s algorithm](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm)
 * * *mode* - the value with the most occurrences
 * * a function to be passed the array of values for each bin and the extent of the bin
 * * an object with a *reduce* method
 * 
 * See also the [hexgrid](https://github.com/observablehq/plot/blob/main/README.md#hexgrid) mark.
 * 
 */
function hexbin(outputs = { fill: "count" }, { binWidth, ...options } = {}) {
    // TODO filter e.g. to show empty hexbins?
    // TODO disallow x, x1, x2, y, y1, y2 reducers?
    binWidth = binWidth === undefined ? 20 : number(binWidth);
    outputs = maybeOutputs(outputs, options);
    // A fill output means a fill channel, and hence the stroke should default to
    // none (assuming a mark that defaults to fill and no stroke, such as dot).
    // Note that it’s safe to mutate options here because we just created it with
    // the rest operator above.
    const { z, fill, stroke } = options;
    if (stroke === undefined && isNoneish(fill) && hasOutput(outputs, "fill"))
        options.stroke = "none";
    // Populate default values for the r and symbol options, as appropriate.
    if (options.symbol === undefined)
        options.symbol = "hexagon";
    if (options.r === undefined && !hasOutput(outputs, "r"))
        options.r = binWidth / 2;
    return initializer(options, (data, facets, channels, scales, _, context) => {
        let { x: X, y: Y, z: Z, fill: F, stroke: S, symbol: Q } = channels;
        if (X === undefined)
            throw new Error("missing channel: x");
        if (Y === undefined)
            throw new Error("missing channel: y");
        // Get the (either scaled or projected) xy channels.
        ({ x: X, y: Y } = Position(channels, scales, context));
        // Extract the values for channels that are eligible for grouping; not all
        // marks define a z channel, so compute one if it not already computed. If z
        // was explicitly set to null, ensure that we don’t subdivide bins.
        Z = Z ? Z.value : valueof(data, z);
        F = F?.value;
        S = S?.value;
        Q = Q?.value;
        // Group on the first of z, fill, stroke, and symbol. Implicitly reduce
        // these channels using the first corresponding value for each bin.
        const G = maybeSubgroup(outputs, { z: Z, fill: F, stroke: S, symbol: Q });
        const GZ = Z && [];
        const GF = F && [];
        const GS = S && [];
        const GQ = Q && [];
        // Construct the hexbins and populate the output channels.
        const binFacets = [];
        const BX = [];
        const BY = [];
        let i = -1;
        for (const o of outputs)
            o.initialize(data);
        for (const facet of facets) {
            const binFacet = [];
            for (const o of outputs)
                o.scope("facet", facet);
            for (const [f, I] of maybeGroup(facet, G)) {
                for (const bin of hbin(I, X, Y, binWidth)) {
                    binFacet.push(++i);
                    BX.push(bin.x);
                    BY.push(bin.y);
                    if (Z)
                        GZ.push(G === Z ? f : Z[bin[0]]);
                    if (F)
                        GF.push(G === F ? f : F[bin[0]]);
                    if (S)
                        GS.push(G === S ? f : S[bin[0]]);
                    if (Q)
                        GQ.push(G === Q ? f : Q[bin[0]]);
                    for (const o of outputs)
                        o.reduce(bin);
                }
            }
            binFacets.push(binFacet);
        }
        // Construct the output channels, and populate the radius scale hint.
        const binChannels = {
            x: { value: BX },
            y: { value: BY },
            ...(Z && { z: { value: GZ } }),
            ...(F && { fill: { value: GF, scale: true } }),
            ...(S && { stroke: { value: GS, scale: true } }),
            ...(Q && { symbol: { value: GQ, scale: true } }),
            ...Object.fromEntries(outputs.map(({ name, output }) => [
                name,
                { scale: true, radius: name === "r" ? binWidth / 2 : undefined, value: output.transform() }
            ]))
        };
        return { data, facets: binFacets, channels: binChannels };
    });
}
function hbin(I, X, Y, dx) {
    const dy = dx * (1.5 / sqrt3);
    const bins = new Map();
    for (const i of I) {
        let px = X[i], py = Y[i];
        if (isNaN(px) || isNaN(py))
            continue;
        let pj = Math.round((py = (py - oy) / dy)), pi = Math.round((px = (px - ox) / dx - (pj & 1) / 2)), py1 = py - pj;
        if (Math.abs(py1) * 3 > 1) {
            let px1 = px - pi, pi2 = pi + (px < pi ? -1 : 1) / 2, pj2 = pj + (py < pj ? -1 : 1), px2 = px - pi2, py2 = py - pj2;
            if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2)
                (pi = pi2 + (pj & 1 ? 1 : -1) / 2), (pj = pj2);
        }
        const key = `${pi},${pj}`;
        let bin = bins.get(key);
        if (bin === undefined) {
            bins.set(key, (bin = []));
            bin.x = (pi + (pj & 1) / 2) * dx + ox;
            bin.y = pj * dy + oy;
        }
        bin.push(i);
    }
    return bins.values();
}

const defaults$8 = {
    ariaLabel: "hexgrid",
    fill: "none",
    stroke: "currentColor",
    strokeOpacity: 0.1
};
/** 
 * The **binWidth** option specifies the distance between the centers of neighboring hexagons, in pixels (defaults to 20). The **clip** option defaults to true, clipping the mark to the frame’s dimensions.
 * 
 */
function hexgrid(options) {
    return new Hexgrid(options);
}
class Hexgrid extends Mark {
    constructor({ binWidth = 20, clip = true, ...options } = {}) {
        super(undefined, undefined, { clip, ...options }, defaults$8);
        this.binWidth = number(binWidth);
    }
    render(index, scales, channels, dimensions, context) {
        const { binWidth } = this;
        const { marginTop, marginRight, marginBottom, marginLeft, width, height } = dimensions;
        const x0 = marginLeft - ox, x1 = width - marginRight - ox, y0 = marginTop - oy, y1 = height - marginBottom - oy;
        const rx = binWidth / 2, ry = rx * sqrt4_3, hy = ry / 2, wx = rx * 2, wy = ry * 1.5;
        const path = `m0,${-ry}l${rx},${hy}v${ry}l${-rx},${hy}`;
        const i0 = Math.floor(x0 / wx), i1 = Math.ceil(x1 / wx);
        const j0 = Math.floor((y0 + hy) / wy), j1 = Math.ceil((y1 - hy) / wy) + 1;
        const m = [];
        for (let j = j0; j < j1; ++j) {
            for (let i = i0; i < i1; ++i) {
                m.push(`M${i * wx + (j & 1) * rx},${j * wy}${path}`);
            }
        }
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call((g) => g
            .append("path")
            .call(applyDirectStyles, this)
            .call(applyTransform, this, {}, offset + ox, offset + oy)
            .attr("d", m.join("")))
            .node();
    }
}

const defaults$7 = {
    ariaLabel: "image",
    fill: null,
    stroke: null
};
// Tests if the given string is a path: does it start with a dot-slash
// (./foo.png), dot-dot-slash (../foo.png), or slash (/foo.png)?
function isPath(string) {
    return /^\.*\//.test(string);
}
// Tests if the given string is a URL (e.g., https://placekitten.com/200/300).
// The allowed protocols is overly restrictive, but we don’t want to allow any
// scheme here because it would increase the likelihood of a false positive with
// a field name that happens to contain a colon.
function isUrl(string) {
    return /^(blob|data|file|http|https):/i.test(string);
}
// Disambiguates a constant src definition from a channel. A path or URL string
// is assumed to be a constant; any other string is assumed to be a field name.
function maybePathChannel(value) {
    return typeof value === "string" && (isPath(value) || isUrl(value)) ? [undefined, value] : [value, undefined];
}
class Image extends Mark {
    constructor(data, options = {}) {
        let { x, y, width, height, src, preserveAspectRatio, crossOrigin, frameAnchor } = options;
        if (width === undefined && height !== undefined)
            width = height;
        else if (height === undefined && width !== undefined)
            height = width;
        const [vs, cs] = maybePathChannel(src);
        const [vw, cw] = maybeNumberChannel(width, 16);
        const [vh, ch] = maybeNumberChannel(height, 16);
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true },
            width: { value: vw, filter: positive, optional: true },
            height: { value: vh, filter: positive, optional: true },
            src: { value: vs, optional: true }
        }, options, defaults$7);
        this.src = cs;
        this.width = cw;
        this.height = ch;
        this.preserveAspectRatio = impliedString(preserveAspectRatio, "xMidYMid");
        this.crossOrigin = string(crossOrigin);
        this.frameAnchor = maybeFrameAnchor(frameAnchor);
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y: Y, width: W, height: H, src: S } = channels;
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, { x: X && x, y: Y && y })
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("image")
            .call(applyDirectStyles, this)
            .attr("x", W && X
            ? (i) => X[i] - W[i] / 2
            : W
                ? (i) => cx - W[i] / 2
                : X
                    ? (i) => X[i] - this.width / 2
                    : cx - this.width / 2)
            .attr("y", H && Y
            ? (i) => Y[i] - H[i] / 2
            : H
                ? (i) => cy - H[i] / 2
                : Y
                    ? (i) => Y[i] - this.height / 2
                    : cy - this.height / 2)
            .attr("width", W ? (i) => W[i] : this.width)
            .attr("height", H ? (i) => H[i] : this.height)
            .call(applyAttr, "href", S ? (i) => S[i] : this.src)
            .call(applyAttr, "preserveAspectRatio", this.preserveAspectRatio)
            .call(applyAttr, "crossorigin", this.crossOrigin)
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
/** 
 * ```js
 * Plot.image(presidents, {x: "inauguration", y: "favorability", src: "portrait"})
 * ```
 * 
 * Returns a new image with the given *data* and *options*. If neither the **x** nor **y** nor **frameAnchor** options are specified, *data* is assumed to be an array of pairs [[*x₀*, *y₀*], [*x₁*, *y₁*], [*x₂*, *y₂*], …] such that **x** = [*x₀*, *x₁*, *x₂*, …] and **y** = [*y₀*, *y₁*, *y₂*, …].
 * 
 */
function image(data, options = {}) {
    let { x, y, ...remainingOptions } = options;
    if (options.frameAnchor === undefined)
        [x, y] = maybeTuple(x, y);
    return new Image(data, { ...remainingOptions, x, y });
}

const defaults$6 = {
    ariaLabel: "line",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeMiterlimit: 1
};
// This is a special built-in curve that will use d3.geoPath when there is a
// projection, and the linear curve when there is not. You can explicitly
// opt-out of d3.geoPath and instead use d3.line with the "linear" curve.
function curveAuto(context) {
    return d3.curveLinear(context);
}
// For the “auto” curve, return a symbol instead of a curve implementation;
// we’ll use d3.geoPath instead of d3.line to render if there’s a projection.
function LineCurve({ curve = curveAuto, tension }) {
    return typeof curve !== "function" && `${curve}`.toLowerCase() === "auto" ? curveAuto : Curve(curve, tension);
}
class Line extends Mark {
    constructor(data, options = {}) {
        const { x, y, z } = options;
        super(data, {
            x: { value: x, scale: "x" },
            y: { value: y, scale: "y" },
            z: { value: maybeZ(options), optional: true }
        }, options, defaults$6);
        this.z = z;
        this.curve = LineCurve(options);
        markers(this, options);
    }
    filter(index) {
        return index;
    }
    project(channels, values, context) {
        // For the auto curve, projection is handled at render.
        if (this.curve !== curveAuto) {
            super.project(channels, values, context);
        }
    }
    render(index, scales, channels, dimensions, context) {
        const { x: X, y: Y } = channels;
        const { curve } = this;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, scales)
            .call((g) => g
            .selectAll()
            .data(groupIndex(index, [X, Y], this, channels))
            .enter()
            .append("path")
            .call(applyDirectStyles, this)
            .call(applyGroupedChannelStyles, this, channels)
            .call(applyGroupedMarkers, this, channels)
            .attr("d", curve === curveAuto && context.projection
            ? sphereLine(context.projection, X, Y)
            : d3.line()
                .curve(curve)
                .defined((i) => i >= 0)
                .x((i) => X[i])
                .y((i) => Y[i])))
            .node();
    }
}
function sphereLine(projection, X, Y) {
    const path = d3.geoPath(projection);
    X = coerceNumbers(X);
    Y = coerceNumbers(Y);
    return (I) => {
        let line = [];
        const lines = [line];
        for (const i of I) {
            // Check for undefined value; see groupIndex.
            if (i === -1) {
                line = [];
                lines.push(line);
            }
            else {
                line.push([X[i], Y[i]]);
            }
        }
        return path({ type: "MultiLineString", coordinates: lines });
    };
}
/** 
 * ```js
 * Plot.line(aapl, {x: "Date", y: "Close"})
 * ```
 * 
 * Returns a new line with the given *data* and *options*. If neither the **x** nor **y** options are specified, *data* is assumed to be an array of pairs [[*x₀*, *y₀*], [*x₁*, *y₁*], [*x₂*, *y₂*], …] such that **x** = [*x₀*, *x₁*, *x₂*, …] and **y** = [*y₀*, *y₁*, *y₂*, …].
 * 
 */
function line(data, options = {}) {
    let { x, y, ...remainingOptions } = options;
    [x, y] = maybeTuple(x, y);
    return new Line(data, { ...remainingOptions, x, y });
}
/** 
 * ```js
 * Plot.lineX(aapl.map(d => d.Close))
 * ```
 * 
 * Similar to [Plot.line](https://github.com/observablehq/plot/blob/main/README.md#plotlinedata-options) except that if the **x** option is not specified, it defaults to the identity function and assumes that *data* = [*x₀*, *x₁*, *x₂*, …]. If the **y** option is not specified, it defaults to [0, 1, 2, …].
 * 
 * If the **interval** option is specified, the [binY transform](https://github.com/observablehq/plot/blob/main/README.md#bin) is implicitly applied to the specified *options*. The reducer of the output *x* channel may be specified via the **reduce** option, which defaults to *first*. To default to zero instead of showing gaps in data, as when the observed value represents a quantity, use the *sum* reducer.
 * 
 * ```js
 * Plot.lineX(observations, {y: "date", x: "temperature", interval: d3.utcDay})
 * ```
 * 
 * The **interval** option is recommended to “regularize” sampled data; for example, if your data represents timestamped temperature measurements and you expect one sample per day, use d3.utcDay as the interval.
 * 
 */
function lineX(data, options = {}) {
    const { x = identity$1, y = indexOf, ...remainingOptions } = options;
    return new Line(data, maybeDenseIntervalY({ ...remainingOptions, x, y }));
}
/** 
 * ```js
 * Plot.lineY(aapl.map(d => d.Close))
 * ```
 * 
 * Similar to [Plot.line](https://github.com/observablehq/plot/blob/main/README.md#plotlinedata-options) except that if the **y** option is not specified, it defaults to the identity function and assumes that *data* = [*y₀*, *y₁*, *y₂*, …]. If the **x** option is not specified, it defaults to [0, 1, 2, …].
 * 
 * If the **interval** option is specified, the [binX transform](https://github.com/observablehq/plot/blob/main/README.md#bin) is implicitly applied to the specified *options*. The reducer of the output *y* channel may be specified via the **reduce** option, which defaults to *first*. To default to zero instead of showing gaps in data, as when the observed value represents a quantity, use the *sum* reducer.
 * 
 * ```js
 * Plot.lineY(observations, {x: "date", y: "temperature", interval: d3.utcDay})
 * ```
 * 
 * The **interval** option is recommended to “regularize” sampled data; for example, if your data represents timestamped temperature measurements and you expect one sample per day, use d3.utcDay as the interval.
 * 
 */
function lineY(data, options = {}) {
    const { x = indexOf, y = identity$1, ...remainingOptions } = options;
    return new Line(data, maybeDenseIntervalX({ ...remainingOptions, x, y }));
}

// https://github.com/jstat/jstat
//
// Copyright (c) 2013 jStat
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
function ibetainv(p, a, b) {
    var EPS = 1e-8;
    var a1 = a - 1;
    var b1 = b - 1;
    var j = 0;
    var lna, lnb, pp, t, u, err, x, al, h, w, afac;
    if (p <= 0)
        return 0;
    if (p >= 1)
        return 1;
    if (a >= 1 && b >= 1) {
        pp = p < 0.5 ? p : 1 - p;
        t = Math.sqrt(-2 * Math.log(pp));
        x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t;
        if (p < 0.5)
            x = -x;
        al = (x * x - 3) / 6;
        h = 2 / (1 / (2 * a - 1) + 1 / (2 * b - 1));
        w = (x * Math.sqrt(al + h)) / h - (1 / (2 * b - 1) - 1 / (2 * a - 1)) * (al + 5 / 6 - 2 / (3 * h));
        x = a / (a + b * Math.exp(2 * w));
    }
    else {
        lna = Math.log(a / (a + b));
        lnb = Math.log(b / (a + b));
        t = Math.exp(a * lna) / a;
        u = Math.exp(b * lnb) / b;
        w = t + u;
        if (p < t / w)
            x = Math.pow(a * w * p, 1 / a);
        else
            x = 1 - Math.pow(b * w * (1 - p), 1 / b);
    }
    afac = -gammaln(a) - gammaln(b) + gammaln(a + b);
    for (; j < 10; j++) {
        if (x === 0 || x === 1)
            return x;
        err = ibeta(x, a, b) - p;
        t = Math.exp(a1 * Math.log(x) + b1 * Math.log(1 - x) + afac);
        u = err / t;
        x -= t = u / (1 - 0.5 * Math.min(1, u * (a1 / x - b1 / (1 - x))));
        if (x <= 0)
            x = 0.5 * (x + t);
        if (x >= 1)
            x = 0.5 * (x + t + 1);
        if (Math.abs(t) < EPS * x && j > 0)
            break;
    }
    return x;
}
function ibeta(x, a, b) {
    // Factors in front of the continued fraction.
    var bt = x === 0 || x === 1 ? 0 : Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < 0 || x > 1)
        return false;
    if (x < (a + 1) / (a + b + 2))
        // Use continued fraction directly.
        return (bt * betacf(x, a, b)) / a;
    // else use continued fraction after making the symmetry transformation.
    return 1 - (bt * betacf(1 - x, b, a)) / b;
}
function betacf(x, a, b) {
    var fpmin = 1e-30;
    var m = 1;
    var qab = a + b;
    var qap = a + 1;
    var qam = a - 1;
    var c = 1;
    var d = 1 - (qab * x) / qap;
    var m2, aa, del, h;
    // These q's will be used in factors that occur in the coefficients
    if (Math.abs(d) < fpmin)
        d = fpmin;
    d = 1 / d;
    h = d;
    for (; m <= 100; m++) {
        m2 = 2 * m;
        aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        // One step (the even one) of the recurrence
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin)
            d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin)
            c = fpmin;
        d = 1 / d;
        h *= d * c;
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        // Next step of the recurrence (the odd one)
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin)
            d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin)
            c = fpmin;
        d = 1 / d;
        del = d * c;
        h *= del;
        if (Math.abs(del - 1.0) < 3e-7)
            break;
    }
    return h;
}
function gammaln(x) {
    var j = 0;
    var cof = [
        76.18009172947146, -86.5053203294167, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2,
        -0.5395239384953e-5
    ];
    var ser = 1.000000000190015;
    var xx, y, tmp;
    tmp = (y = xx = x) + 5.5;
    tmp -= (xx + 0.5) * Math.log(tmp);
    for (; j < 6; j++)
        ser += cof[j] / ++y;
    return Math.log((2.506628274631 * ser) / xx) - tmp;
}
function qt(p, dof) {
    var x = ibetainv(2 * Math.min(p, 1 - p), 0.5 * dof, 0.5);
    x = Math.sqrt((dof * (1 - x)) / x);
    return p > 0.5 ? x : -x;
}

const defaults$5 = {
    ariaLabel: "linear-regression",
    fill: "currentColor",
    fillOpacity: 0.1,
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeMiterlimit: 1
};
class LinearRegression extends Mark {
    constructor(data, options = {}) {
        const { x, y, z, ci = 0.95, precision = 4 } = options;
        super(data, {
            x: { value: x, scale: "x" },
            y: { value: y, scale: "y" },
            z: { value: maybeZ(options), optional: true }
        }, options, defaults$5);
        this.z = z;
        this.ci = +ci;
        this.precision = +precision;
        if (!(0 <= this.ci && this.ci < 1))
            throw new Error(`invalid ci; not in [0, 1): ${ci}`);
        if (!(this.precision > 0))
            throw new Error(`invalid precision: ${precision}`);
    }
    render(index, scales, channels, dimensions, context) {
        const { x: X, y: Y, z: Z } = channels;
        const { ci } = this;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, scales)
            .call((g) => g
            .selectAll()
            .data(Z ? groupZ(index, Z, this.z) : [index])
            .enter()
            .call((enter) => enter
            .append("path")
            .attr("fill", "none")
            .call(applyDirectStyles, this)
            .call(applyGroupedChannelStyles, this, { ...channels, fill: null, fillOpacity: null })
            .attr("d", (I) => this._renderLine(I, X, Y))
            .call(ci && !isNone(this.fill)
            ? (path) => path
                .select(pathBefore)
                .attr("stroke", "none")
                .call(applyDirectStyles, this)
                .call(applyGroupedChannelStyles, this, {
                ...channels,
                stroke: null,
                strokeOpacity: null,
                strokeWidth: null
            })
                .attr("d", (I) => this._renderBand(I, X, Y))
            : () => { })))
            .node();
    }
}
function pathBefore() {
    return this.parentNode.insertBefore(this.ownerDocument.createElementNS(d3.namespaces.svg, "path"), this);
}
class LinearRegressionX extends LinearRegression {
    constructor(data, options) {
        super(data, options);
    }
    _renderBand(I, X, Y) {
        const { ci, precision } = this;
        const [y1, y2] = d3.extent(I, (i) => Y[i]);
        const f = linearRegressionF(I, Y, X);
        const g = confidenceIntervalF(I, Y, X, (1 - ci) / 2, f);
        return d3.area()
            .y((y) => y)
            .x0((y) => g(y, -1))
            .x1((y) => g(y, +1))(d3.range(y1, y2 - precision / 2, precision).concat(y2));
    }
    _renderLine(I, X, Y) {
        const [y1, y2] = d3.extent(I, (i) => Y[i]);
        const f = linearRegressionF(I, Y, X);
        return `M${f(y1)},${y1}L${f(y2)},${y2}`;
    }
}
class LinearRegressionY extends LinearRegression {
    constructor(data, options) {
        super(data, options);
    }
    _renderBand(I, X, Y) {
        const { ci, precision } = this;
        const [x1, x2] = d3.extent(I, (i) => X[i]);
        const f = linearRegressionF(I, X, Y);
        const g = confidenceIntervalF(I, X, Y, (1 - ci) / 2, f);
        return d3.area()
            .x((x) => x)
            .y0((x) => g(x, -1))
            .y1((x) => g(x, +1))(d3.range(x1, x2 - precision / 2, precision).concat(x2));
    }
    _renderLine(I, X, Y) {
        const [x1, x2] = d3.extent(I, (i) => X[i]);
        const f = linearRegressionF(I, X, Y);
        return `M${x1},${f(x1)}L${x2},${f(x2)}`;
    }
}
/** 
 * ```js
 * Plot.linearRegressionX(mtcars, {y: "wt", x: "hp"})
 * ```
 * 
 * Returns a linear regression mark where *x* is the dependent variable and *y* is the independent variable.
 * 
 */
function linearRegressionX(data, options = {}) {
    const { y = indexOf, x = identity$1, stroke, fill = isNoneish(stroke) ? "currentColor" : stroke, ...remainingOptions } = options;
    return new LinearRegressionX(data, maybeDenseIntervalY({ ...remainingOptions, x, y, fill, stroke }));
}
/** 
 * ```js
 * Plot.linearRegressionY(mtcars, {x: "wt", y: "hp"})
 * ```
 * 
 * Returns a linear regression mark where *y* is the dependent variable and *x* is the independent variable.
 * 
 */
function linearRegressionY(data, options = {}) {
    const { x = indexOf, y = identity$1, stroke, fill = isNoneish(stroke) ? "currentColor" : stroke, ...remainingOptions } = options;
    return new LinearRegressionY(data, maybeDenseIntervalX({ ...remainingOptions, x, y, fill, stroke }));
}
function linearRegressionF(I, X, Y) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const i of I) {
        const xi = X[i];
        const yi = Y[i];
        sumX += xi;
        sumY += yi;
        sumXY += xi * yi;
        sumX2 += xi * xi;
    }
    const n = I.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return (x) => slope * x + intercept;
}
function confidenceIntervalF(I, X, Y, p, f) {
    const mean = d3.sum(I, (i) => X[i]) / I.length;
    let a = 0, b = 0;
    for (const i of I) {
        a += (X[i] - mean) ** 2;
        b += (Y[i] - f(X[i])) ** 2;
    }
    const sy = Math.sqrt(b / (I.length - 2));
    const t = qt(p, I.length - 2);
    return (x, k) => {
        const Y = f(x);
        const se = sy * Math.sqrt(1 / I.length + (x - mean) ** 2 / a);
        return Y + k * t * se;
    };
}

const defaults$4 = {
    ariaLabel: "rect"
};
class Rect extends Mark {
    constructor(data, options = {}) {
        const { x1, y1, x2, y2, inset = 0, insetTop = inset, insetRight = inset, insetBottom = inset, insetLeft = inset, rx, ry } = options;
        super(data, {
            x1: { value: x1, scale: "x", optional: true },
            y1: { value: y1, scale: "y", optional: true },
            x2: { value: x2, scale: "x", optional: true },
            y2: { value: y2, scale: "y", optional: true }
        }, options, defaults$4);
        this.insetTop = number(insetTop);
        this.insetRight = number(insetRight);
        this.insetBottom = number(insetBottom);
        this.insetLeft = number(insetLeft);
        this.rx = impliedString(rx, "auto"); // number or percentage
        this.ry = impliedString(ry, "auto");
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x1: X1, y1: Y1, x2: X2, y2: Y2 } = channels;
        const { marginTop, marginRight, marginBottom, marginLeft, width, height } = dimensions;
        const { projection } = context;
        const { insetTop, insetRight, insetBottom, insetLeft, rx, ry } = this;
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, { x: X1 && X2 && x, y: Y1 && Y2 && y }, 0, 0)
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("rect")
            .call(applyDirectStyles, this)
            .attr("x", X1 && X2 && (projection || !isCollapsed(x))
            ? (i) => Math.min(X1[i], X2[i]) + insetLeft
            : marginLeft + insetLeft)
            .attr("y", Y1 && Y2 && (projection || !isCollapsed(y))
            ? (i) => Math.min(Y1[i], Y2[i]) + insetTop
            : marginTop + insetTop)
            .attr("width", X1 && X2 && (projection || !isCollapsed(x))
            ? (i) => Math.max(0, Math.abs(X2[i] - X1[i]) - insetLeft - insetRight)
            : width - marginRight - marginLeft - insetRight - insetLeft)
            .attr("height", Y1 && Y2 && (projection || !isCollapsed(y))
            ? (i) => Math.max(0, Math.abs(Y1[i] - Y2[i]) - insetTop - insetBottom)
            : height - marginTop - marginBottom - insetTop - insetBottom)
            .call(applyAttr, "rx", rx)
            .call(applyAttr, "ry", ry)
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
/** 
 * ```js
 * Plot.rect(athletes, Plot.bin({fill: "count"}, {x: "weight", y: "height"}))
 * ```
 * 
 * Returns a new rect with the given *data* and *options*.
 * 
 */
function rect(data, options) {
    return new Rect(data, maybeTrivialIntervalX(maybeTrivialIntervalY(options)));
}
/** 
 * ```js
 * Plot.rectX(athletes, Plot.binY({x: "count"}, {y: "weight"}))
 * ```
 * 
 * Equivalent to [Plot.rect](https://github.com/observablehq/plot/blob/main/README.md#plotrectdata-options), except that if neither the **x1** nor **x2** option is specified, the **x** option may be specified as shorthand to apply an implicit [stackX transform](https://github.com/observablehq/plot/blob/main/README.md#plotstackxstack-options); this is the typical configuration for a histogram with rects aligned at *x* = 0. If the **x** option is not specified, it defaults to the identity function.
 * 
 */
function rectX(data, options = { y: indexOf, interval: 1, x2: identity$1 }) {
    return new Rect(data, maybeStackX(maybeTrivialIntervalY(maybeIdentityX(options))));
}
/** 
 * ```js
 * Plot.rectY(athletes, Plot.binX({y: "count"}, {x: "weight"}))
 * ```
 * 
 * Equivalent to [Plot.rect](https://github.com/observablehq/plot/blob/main/README.md#plotrectdata-options), except that if neither the **y1** nor **y2** option is specified, the **y** option may be specified as shorthand to apply an implicit [stackY transform](https://github.com/observablehq/plot/blob/main/README.md#plotstackystack-options); this is the typical configuration for a histogram with rects aligned at *y* = 0. If the **y** option is not specified, it defaults to the identity function.
 * 
 */
function rectY(data, options = { x: indexOf, interval: 1, y2: identity$1 }) {
    return new Rect(data, maybeStackY(maybeTrivialIntervalX(maybeIdentityY(options))));
}

const defaults$3 = {
    ariaLabel: "text",
    strokeLinejoin: "round",
    strokeWidth: 3,
    paintOrder: "stroke"
};
class Text extends Mark {
    constructor(data, options = {}) {
        const { x, y, text = isIterable(data) && isTextual(data) ? identity$1 : indexOf, frameAnchor, textAnchor = /right$/i.test(frameAnchor) ? "end" : /left$/i.test(frameAnchor) ? "start" : "middle", lineAnchor = /^top/i.test(frameAnchor) ? "top" : /^bottom/i.test(frameAnchor) ? "bottom" : "middle", lineHeight = 1, lineWidth = Infinity, monospace, fontFamily = monospace ? "ui-monospace, monospace" : undefined, fontSize, fontStyle, fontVariant, fontWeight, rotate } = options;
        const [vrotate, crotate] = maybeNumberChannel(rotate, 0);
        const [vfontSize, cfontSize] = maybeFontSizeChannel(fontSize);
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true },
            fontSize: { value: vfontSize, optional: true },
            rotate: { value: numberChannel(vrotate), optional: true },
            text: { value: text, filter: nonempty }
        }, options, defaults$3);
        this.rotate = crotate;
        this.textAnchor = impliedString(textAnchor, "middle");
        this.lineAnchor = keyword(lineAnchor, "lineAnchor", ["top", "middle", "bottom"]);
        this.lineHeight = +lineHeight;
        this.lineWidth = +lineWidth;
        this.monospace = !!monospace;
        this.fontFamily = string(fontFamily);
        this.fontSize = cfontSize;
        this.fontStyle = string(fontStyle);
        this.fontVariant = string(fontVariant);
        this.fontWeight = string(fontWeight);
        this.frameAnchor = maybeFrameAnchor(frameAnchor);
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y: Y, rotate: R, text: T, fontSize: FS } = channels;
        const { rotate } = this;
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        return create("svg:g", context)
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyIndirectTextStyles, this, T, dimensions)
            .call(applyTransform, this, { x: X && x, y: Y && y })
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("text")
            .call(applyDirectStyles, this)
            .call(applyMultilineText, this, T)
            .attr("transform", R
            ? X && Y
                ? (i) => `translate(${X[i]},${Y[i]}) rotate(${R[i]})`
                : X
                    ? (i) => `translate(${X[i]},${cy}) rotate(${R[i]})`
                    : Y
                        ? (i) => `translate(${cx},${Y[i]}) rotate(${R[i]})`
                        : (i) => `translate(${cx},${cy}) rotate(${R[i]})`
            : rotate
                ? X && Y
                    ? (i) => `translate(${X[i]},${Y[i]}) rotate(${rotate})`
                    : X
                        ? (i) => `translate(${X[i]},${cy}) rotate(${rotate})`
                        : Y
                            ? (i) => `translate(${cx},${Y[i]}) rotate(${rotate})`
                            : `translate(${cx},${cy}) rotate(${rotate})`
                : X && Y
                    ? (i) => `translate(${X[i]},${Y[i]})`
                    : X
                        ? (i) => `translate(${X[i]},${cy})`
                        : Y
                            ? (i) => `translate(${cx},${Y[i]})`
                            : `translate(${cx},${cy})`)
            .call(applyAttr, "font-size", FS && ((i) => FS[i]))
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
function applyMultilineText(selection, { monospace, lineAnchor, lineHeight, lineWidth }, T) {
    if (!T)
        return;
    const linesof = isFinite(lineWidth)
        ? monospace
            ? (t) => lineWrap(t, lineWidth, monospaceWidth)
            : (t) => lineWrap(t, lineWidth * 100, defaultWidth)
        : (t) => t.split(/\r\n?|\n/g);
    selection.each(function (i) {
        const lines = linesof(formatDefault(T[i]));
        const n = lines.length;
        const y = lineAnchor === "top" ? 0.71 : lineAnchor === "bottom" ? 1 - n : (164 - n * 100) / 200;
        if (n > 1) {
            for (let i = 0; i < n; ++i) {
                if (!lines[i])
                    continue;
                const tspan = this.ownerDocument.createElementNS(d3.namespaces.svg, "tspan");
                tspan.setAttribute("x", 0);
                tspan.setAttribute("y", `${(y + i) * lineHeight}em`);
                tspan.textContent = lines[i];
                this.appendChild(tspan);
            }
        }
        else {
            if (y)
                this.setAttribute("y", `${y * lineHeight}em`);
            this.textContent = lines[0];
        }
    });
}
/** 
 * Returns a new text mark with the given *data* and *options*. If neither the **x** nor **y** nor **frameAnchor** options are specified, *data* is assumed to be an array of pairs [[*x₀*, *y₀*], [*x₁*, *y₁*], [*x₂*, *y₂*], …] such that **x** = [*x₀*, *x₁*, *x₂*, …] and **y** = [*y₀*, *y₁*, *y₂*, …].
 * 
 */
function text(data, options = {}) {
    let { x, y, ...remainingOptions } = options;
    if (options.frameAnchor === undefined)
        [x, y] = maybeTuple(x, y);
    return new Text(data, { ...remainingOptions, x, y });
}
/** 
 * Equivalent to [Plot.text](https://github.com/observablehq/plot/blob/main/README.md#plottextdata-options), except **x** defaults to the identity function and assumes that *data* = [*x₀*, *x₁*, *x₂*, …].
 * 
 * If an **interval** is specified, such as d3.utcDay, **y** is transformed to (*interval*.floor(*y*) + *interval*.offset(*interval*.floor(*y*))) / 2. If the interval is specified as a number *n*, *y* will be the midpoint of two consecutive multiples of *n* that bracket *y*.
 * 
 */
function textX(data, options = {}) {
    const { x = identity$1, ...remainingOptions } = options;
    return new Text(data, maybeIntervalMidY({ ...remainingOptions, x }));
}
/** 
 * Equivalent to [Plot.text](https://github.com/observablehq/plot/blob/main/README.md#plottextdata-options), except **y** defaults to the identity function and assumes that *data* = [*y₀*, *y₁*, *y₂*, …].
 * 
 * If an **interval** is specified, such as d3.utcDay, **x** is transformed to (*interval*.floor(*x*) + *interval*.offset(*interval*.floor(*x*))) / 2. If the interval is specified as a number *n*, *x* will be the midpoint of two consecutive multiples of *n* that bracket *x*.
 * 
 */
function textY(data, options = {}) {
    const { y = identity$1, ...remainingOptions } = options;
    return new Text(data, maybeIntervalMidX({ ...remainingOptions, y }));
}
function applyIndirectTextStyles(selection, mark, T) {
    applyAttr(selection, "text-anchor", mark.textAnchor);
    applyAttr(selection, "font-family", mark.fontFamily);
    applyAttr(selection, "font-size", mark.fontSize);
    applyAttr(selection, "font-style", mark.fontStyle);
    applyAttr(selection, "font-variant", mark.fontVariant === undefined && (isNumeric(T) || isTemporal(T)) ? "tabular-nums" : mark.fontVariant);
    applyAttr(selection, "font-weight", mark.fontWeight);
}
// https://developer.mozilla.org/en-US/docs/Web/CSS/font-size
const fontSizes = new Set([
    // global keywords
    "inherit",
    "initial",
    "revert",
    "unset",
    // absolute keywords
    "xx-small",
    "x-small",
    "small",
    "medium",
    "large",
    "x-large",
    "xx-large",
    "xxx-large",
    // relative keywords
    "larger",
    "smaller"
]);
// The font size may be expressed as a constant in the following forms:
// - number in pixels
// - string keyword: see above
// - string <length>: e.g., "12px"
// - string <percentage>: e.g., "80%"
// Anything else is assumed to be a channel definition.
function maybeFontSizeChannel(fontSize) {
    if (fontSize == null || typeof fontSize === "number")
        return [undefined, fontSize];
    if (typeof fontSize !== "string")
        return [fontSize, undefined];
    fontSize = fontSize.trim().toLowerCase();
    return fontSizes.has(fontSize) || /^[+-]?\d*\.?\d+(e[+-]?\d+)?(\w*|%)$/.test(fontSize)
        ? [undefined, fontSize]
        : [fontSize, undefined];
}
// This is a greedy algorithm for line wrapping. It would be better to use the
// Knuth–Plass line breaking algorithm (but that would be much more complex).
// https://en.wikipedia.org/wiki/Line_wrap_and_word_wrap
function lineWrap(input, maxWidth, widthof = (_, i, j) => j - i) {
    const lines = [];
    let lineStart, lineEnd = 0;
    for (const [wordStart, wordEnd, required] of lineBreaks(input)) {
        // Record the start of a line. This isn’t the same as the previous line’s
        // end because we often skip spaces between lines.
        if (lineStart === undefined)
            lineStart = wordStart;
        // If the current line is not empty, and if adding the current word would
        // make the line longer than the allowed width, then break the line at the
        // previous word end.
        if (lineEnd > lineStart && widthof(input, lineStart, wordEnd) > maxWidth) {
            lines.push(input.slice(lineStart, lineEnd));
            lineStart = wordStart;
        }
        // If this is a required break (a newline), emit the line and reset.
        if (required) {
            lines.push(input.slice(lineStart, wordEnd));
            lineStart = undefined;
            continue;
        }
        // Extend the current line to include the new word.
        lineEnd = wordEnd;
    }
    return lines;
}
// This is a rudimentary (and U.S.-centric) algorithm for finding opportunities
// to break lines between words. A better and far more comprehensive approach
// would be to use the official Unicode Line Breaking Algorithm.
// https://unicode.org/reports/tr14/
function* lineBreaks(input) {
    let i = 0, j = 0;
    const n = input.length;
    while (j < n) {
        let k = 1;
        switch (input[j]) {
            case "-": // hyphen
                ++j;
                yield [i, j, false];
                i = j;
                break;
            case " ":
                yield [i, j, false];
                while (input[++j] === " ")
                    ; // skip multiple spaces
                i = j;
                break;
            case "\r":
                if (input[j + 1] === "\n")
                    ++k; // falls through
            case "\n":
                yield [i, j, true];
                j += k;
                i = j;
                break;
            default:
                ++j;
                break;
        }
    }
    yield [i, j, true];
}
// Computed as round(measureText(text).width * 10) at 10px system-ui. For
// characters that are not represented in this map, we’d ideally want to use a
// weighted average of what we expect to see. But since we don’t really know
// what that is, using “e” seems reasonable.
const defaultWidthMap = {
    a: 56,
    b: 63,
    c: 57,
    d: 63,
    e: 58,
    f: 37,
    g: 62,
    h: 60,
    i: 26,
    j: 26,
    k: 55,
    l: 26,
    m: 88,
    n: 60,
    o: 60,
    p: 62,
    q: 62,
    r: 39,
    s: 54,
    t: 38,
    u: 60,
    v: 55,
    w: 79,
    x: 54,
    y: 55,
    z: 55,
    A: 69,
    B: 67,
    C: 73,
    D: 74,
    E: 61,
    F: 58,
    G: 76,
    H: 75,
    I: 28,
    J: 55,
    K: 67,
    L: 58,
    M: 89,
    N: 75,
    O: 78,
    P: 65,
    Q: 78,
    R: 67,
    S: 65,
    T: 65,
    U: 75,
    V: 69,
    W: 98,
    X: 69,
    Y: 67,
    Z: 67,
    0: 64,
    1: 48,
    2: 62,
    3: 64,
    4: 66,
    5: 63,
    6: 65,
    7: 58,
    8: 65,
    9: 65,
    " ": 29,
    "!": 32,
    '"': 49,
    "'": 31,
    "(": 39,
    ")": 39,
    ",": 31,
    "-": 48,
    ".": 31,
    "/": 32,
    ":": 31,
    ";": 31,
    "?": 52,
    "‘": 31,
    "’": 31,
    "“": 47,
    "”": 47
};
// This is a rudimentary (and U.S.-centric) algorithm for measuring the width of
// a string based on a technique of Gregor Aisch; it assumes that individual
// characters are laid out independently and does not implement the Unicode
// grapheme cluster breaking algorithm. It does understand code points, though,
// and so treats things like emoji as having the width of a lowercase e (and
// should be equivalent to using for-of to iterate over code points, while also
// being fast). TODO Optimize this by noting that we often re-measure characters
// that were previously measured?
// http://www.unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries
// https://exploringjs.com/impatient-js/ch_strings.html#atoms-of-text
function defaultWidth(text, start, end) {
    let sum = 0;
    for (let i = start; i < end; ++i) {
        sum += defaultWidthMap[text[i]] || defaultWidthMap.e;
        const first = text.charCodeAt(i);
        if (first >= 0xd800 && first <= 0xdbff) {
            // high surrogate
            const second = text.charCodeAt(i + 1);
            if (second >= 0xdc00 && second <= 0xdfff) {
                // low surrogate
                ++i; // surrogate pair
            }
        }
    }
    return sum;
}
function monospaceWidth(text, start, end) {
    return end - start;
}

/** 
 * Based on the tree options described above, populates the **x** and **y** channels with the positions for each node. The following defaults are also applied: the default **frameAnchor** inherits the **treeAnchor**. This transform is intended to be used with [dot](https://github.com/observablehq/plot/blob/main/README.md#dot), [text](https://github.com/observablehq/plot/blob/main/README.md#text), and other point-based marks. This transform is rarely used directly; see the [Plot.tree compound mark](https://github.com/observablehq/plot/blob/main/README.md#plottreedata-options).
 * 
 * The treeNode transform will derive output columns for any *options* that have one of the following named node values:
 * 
 * * *node:name* - the node’s name (the last part of its path)
 * * *node:path* - the node’s full, normalized, slash-separated path
 * * *node:internal* - true if the node is internal, or false for leaves
 * * *node:depth* - the distance from the node to the root
 * * *node:height* - the distance from the node to its deepest descendant
 * 
 * In addition, if any option value is specified as an object with a **node** method, a derived output column will be generated by invoking the **node** method for each node in the tree.
 * 
 */
function treeNode(options = {}) {
    let { path = identity$1, // the delimited path
    delimiter, // how the path is separated
    frameAnchor, treeLayout = d3.tree, treeSort, treeSeparation, treeAnchor, ...remainingOptions } = options;
    treeAnchor = maybeTreeAnchor(treeAnchor);
    treeSort = maybeTreeSort(treeSort);
    if (frameAnchor === undefined)
        frameAnchor = treeAnchor.frameAnchor;
    const normalize = normalizer(delimiter);
    const outputs = treeOutputs(remainingOptions, maybeNodeValue);
    const [X, setX] = column();
    const [Y, setY] = column();
    return {
        x: X,
        y: Y,
        frameAnchor,
        ...basic(remainingOptions, (data, facets) => {
            const P = normalize(valueof(data, path));
            const X = setX([]);
            const Y = setY([]);
            let treeIndex = -1;
            const treeData = [];
            const treeFacets = [];
            const rootof = d3.stratify().path((i) => P[i]);
            const layout = treeLayout();
            if (layout.nodeSize)
                layout.nodeSize([1, 1]);
            if (layout.separation && treeSeparation !== undefined)
                layout.separation(treeSeparation ?? one);
            for (const o of outputs)
                o[output_values] = o[output_setValues]([]);
            for (const facet of facets) {
                const treeFacet = [];
                const root = rootof(facet.filter((i) => P[i] != null)).each((node) => (node.data = data[node.data]));
                if (treeSort != null)
                    root.sort(treeSort);
                layout(root);
                for (const node of root.descendants()) {
                    treeFacet.push(++treeIndex);
                    treeData[treeIndex] = node.data;
                    treeAnchor.position(node, treeIndex, X, Y);
                    for (const o of outputs)
                        o[output_values][treeIndex] = o[output_evaluate](node);
                }
                treeFacets.push(treeFacet);
            }
            return { data: treeData, facets: treeFacets };
        }),
        ...Object.fromEntries(outputs)
    };
}
/** 
 * Based on the tree options described above, populates the **x1**, **y1**, **x2**, and **y2** channels. The following defaults are also applied: the default **curve** is *bump-x*, the default **stroke** is #555, the default **strokeWidth** is 1.5, and the default **strokeOpacity** is 0.5. This transform is intended to be used with [link](https://github.com/observablehq/plot/blob/main/README.md#link), [arrow](https://github.com/observablehq/plot/blob/main/README.md#arrow), and other two-point-based marks. This transform is rarely used directly; see the [Plot.tree compound mark](https://github.com/observablehq/plot/blob/main/README.md#plottreedata-options).
 * 
 * The treeLink transform will derive output columns for any *options* that have one of the following named link values:
 * 
 * * *node:name* - the child node’s name (the last part of its path)
 * * *node:path* - the child node’s full, normalized, slash-separated path
 * * *node:internal* - true if the child node is internal, or false for leaves
 * * *node:depth* - the distance from the child node to the root
 * * *node:height* - the distance from the child node to its deepest descendant
 * * *parent:name* - the parent node’s name (the last part of its path)
 * * *parent:path* - the parent node’s full, normalized, slash-separated path
 * * *parent:depth* - the distance from the parent node to the root
 * * *parent:height* - the distance from the parent node to its deepest descendant
 * 
 * In addition, if any option value is specified as an object with a **node** method, a derived output column will be generated by invoking the **node** method for each child node in the tree; likewise if any option value is specified as an object with a **link** method, a derived output column will be generated by invoking the **link** method for each link in the tree, being passed two node arguments, the child and the parent.
 * 
 */
function treeLink(options = {}) {
    let { path = identity$1, // the delimited path
    delimiter, // how the path is separated
    curve = "bump-x", stroke = "#555", strokeWidth = 1.5, strokeOpacity = 0.5, treeLayout = d3.tree, treeSort, treeSeparation, treeAnchor, ...remainingOptions } = options;
    treeAnchor = maybeTreeAnchor(treeAnchor);
    treeSort = maybeTreeSort(treeSort);
    remainingOptions = { curve, stroke, strokeWidth, strokeOpacity, ...remainingOptions };
    const normalize = normalizer(delimiter);
    const outputs = treeOutputs(remainingOptions, maybeLinkValue);
    const [X1, setX1] = column();
    const [X2, setX2] = column();
    const [Y1, setY1] = column();
    const [Y2, setY2] = column();
    return {
        x1: X1,
        x2: X2,
        y1: Y1,
        y2: Y2,
        ...basic(remainingOptions, (data, facets) => {
            const P = normalize(valueof(data, path));
            const X1 = setX1([]);
            const X2 = setX2([]);
            const Y1 = setY1([]);
            const Y2 = setY2([]);
            let treeIndex = -1;
            const treeData = [];
            const treeFacets = [];
            const rootof = d3.stratify().path((i) => P[i]);
            const layout = treeLayout();
            if (layout.nodeSize)
                layout.nodeSize([1, 1]);
            if (layout.separation && treeSeparation !== undefined)
                layout.separation(treeSeparation ?? one);
            for (const o of outputs)
                o[output_values] = o[output_setValues]([]);
            for (const facet of facets) {
                const treeFacet = [];
                const root = rootof(facet.filter((i) => P[i] != null)).each((node) => (node.data = data[node.data]));
                if (treeSort != null)
                    root.sort(treeSort);
                layout(root);
                for (const { source, target } of root.links()) {
                    treeFacet.push(++treeIndex);
                    treeData[treeIndex] = target.data;
                    treeAnchor.position(source, treeIndex, X1, Y1);
                    treeAnchor.position(target, treeIndex, X2, Y2);
                    for (const o of outputs)
                        o[output_values][treeIndex] = o[output_evaluate](target, source);
                }
                treeFacets.push(treeFacet);
            }
            return { data: treeData, facets: treeFacets };
        }),
        ...Object.fromEntries(outputs)
    };
}
function maybeTreeAnchor(anchor = "left") {
    switch (`${anchor}`.trim().toLowerCase()) {
        case "left":
            return treeAnchorLeft;
        case "right":
            return treeAnchorRight;
    }
    throw new Error(`invalid tree anchor: ${anchor}`);
}
const treeAnchorLeft = {
    frameAnchor: "left",
    dx: 6,
    position({ x, y }, i, X, Y) {
        X[i] = y;
        Y[i] = -x;
    }
};
const treeAnchorRight = {
    frameAnchor: "right",
    dx: -6,
    position({ x, y }, i, X, Y) {
        X[i] = -y;
        Y[i] = -x;
    }
};
function maybeTreeSort(sort) {
    return sort == null || typeof sort === "function"
        ? sort
        : `${sort}`.trim().toLowerCase().startsWith("node:")
            ? nodeSort(maybeNodeValue(sort))
            : nodeSort(nodeData(sort));
}
function nodeSort(value) {
    return (a, b) => ascendingDefined(value(a), value(b));
}
function nodeData(field) {
    return (node) => node.data?.[field];
}
function normalizer(delimiter = "/") {
    return `${delimiter}` === "/"
        ? (P) => P // paths are already slash-separated
        : (P) => P.map(replaceAll(delimiter, "/")); // TODO string.replaceAll when supported
}
function replaceAll(search, replace) {
    search = new RegExp(regexEscape(search), "g");
    return (value) => (value == null ? null : `${value}`.replace(search, replace));
}
function regexEscape(string) {
    return `${string}`.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}
function isNodeValue(option) {
    return isObject(option) && typeof option.node === "function";
}
function isLinkValue(option) {
    return isObject(option) && typeof option.link === "function";
}
function maybeNodeValue(value) {
    if (isNodeValue(value))
        return value.node;
    value = `${value}`.trim().toLowerCase();
    if (!value.startsWith("node:"))
        return;
    switch (value) {
        case "node:name":
            return nodeName;
        case "node:path":
            return nodePath;
        case "node:internal":
            return nodeInternal;
        case "node:depth":
            return nodeDepth;
        case "node:height":
            return nodeHeight;
    }
    throw new Error(`invalid node value: ${value}`);
}
function maybeLinkValue(value) {
    if (isNodeValue(value))
        return value.node;
    if (isLinkValue(value))
        return value.link;
    value = `${value}`.trim().toLowerCase();
    if (!value.startsWith("node:") && !value.startsWith("parent:"))
        return;
    switch (value) {
        case "parent:name":
            return parentValue(nodeName);
        case "parent:path":
            return parentValue(nodePath);
        case "parent:depth":
            return parentValue(nodeDepth);
        case "parent:height":
            return parentValue(nodeHeight);
        case "node:name":
            return nodeName;
        case "node:path":
            return nodePath;
        case "node:internal":
            return nodeInternal;
        case "node:depth":
            return nodeDepth;
        case "node:height":
            return nodeHeight;
    }
    throw new Error(`invalid link value: ${value}`);
}
function nodePath(node) {
    return node.id;
}
function nodeName(node) {
    return nameof(node.id);
}
function nodeDepth(node) {
    return node.depth;
}
function nodeHeight(node) {
    return node.height;
}
function nodeInternal(node) {
    return !!node.children;
}
function parentValue(evaluate) {
    return (child, parent) => (parent == null ? undefined : evaluate(parent));
}
// Walk backwards to find the first slash.
function nameof(path) {
    let i = path.length;
    while (--i > 0)
        if (slash(path, i))
            break;
    return path.slice(i + 1);
}
// Slashes can be escaped; to determine whether a slash is a path delimiter, we
// count the number of preceding backslashes escaping the forward slash: an odd
// number indicates an escaped forward slash.
function slash(path, i) {
    if (path[i] === "/") {
        let k = 0;
        while (i > 0 && path[--i] === "\\")
            ++k;
        if ((k & 1) === 0)
            return true;
    }
    return false;
}
// These indexes match the array returned by nodeOutputs. The first two elements
// are always the name of the output and its column value definition so that
// the outputs can be passed directly to Object.fromEntries.
const output_setValues = 2;
const output_evaluate = 3;
const output_values = 4;
function treeOutputs(options, maybeTreeValue) {
    const outputs = [];
    for (const name in options) {
        const value = options[name];
        const treeValue = maybeTreeValue(value);
        if (treeValue !== undefined) {
            outputs.push([name, ...column(value), treeValue]);
        }
    }
    return outputs;
}

/** 
 * A convenience compound mark for rendering a tree diagram, including a [link](https://github.com/observablehq/plot/blob/main/README.md#link) to render links from parent to child, an optional [dot](https://github.com/observablehq/plot/blob/main/README.md#dot) for nodes, and a [text](https://github.com/observablehq/plot/blob/main/README.md#text) for node labels. The link mark uses the [treeLink transform](https://github.com/observablehq/plot/blob/main/README.md#plottreelinkoptions), while the dot and text marks use the [treeNode transform](https://github.com/observablehq/plot/blob/main/README.md#plottreenodeoptions). The following options are supported:
 * 
 * * **fill** - the dot and text fill color; defaults to *node:internal*
 * * **stroke** - the link stroke color; inherits **fill** by default
 * * **strokeWidth** - the link stroke width
 * * **strokeOpacity** - the link stroke opacity
 * * **strokeLinejoin** - the link stroke linejoin
 * * **strokeLinecap** - the link stroke linecap
 * * **strokeMiterlimit** - the link stroke miter limit
 * * **strokeDasharray** - the link stroke dash array
 * * **strokeDashoffset** - the link stroke dash offset
 * * **marker** - the link start and end marker
 * * **markerStart** - the link start marker
 * * **markerEnd** - the link end marker
 * * **dot** - if true, whether to render a dot; defaults to false if no link marker
 * * **title** - the text and dot title; defaults to *node:path*
 * * **text** - the text label; defaults to *node:name*
 * * **textStroke** - the text stroke; defaults to *white*
 * * **dx** - the text horizontal offset; defaults to 6 if left-anchored, or -6 if right-anchored
 * * **dy** - the text vertical offset; defaults to 0
 * 
 * Any additional *options* are passed through to the constituent link, dot, and text marks and their corresponding treeLink or treeNode transform.
 * 
 */
function tree(data, options = {}) {
    let { fill, stroke, strokeWidth, strokeOpacity, strokeLinejoin, strokeLinecap, strokeMiterlimit, strokeDasharray, strokeDashoffset, marker, markerStart = marker, markerEnd = marker, dot: dotDot = isNoneish(markerStart) && isNoneish(markerEnd), text: textText = "node:name", textStroke = "white", title = "node:path", dx, dy, ...remainingOptions } = options;
    if (dx === undefined)
        dx = maybeTreeAnchor(remainingOptions.treeAnchor).dx;
    return marks(link(data, treeLink({
        markerStart,
        markerEnd,
        stroke: stroke !== undefined ? stroke : fill === undefined ? "node:internal" : fill,
        strokeWidth,
        strokeOpacity,
        strokeLinejoin,
        strokeLinecap,
        strokeMiterlimit,
        strokeDasharray,
        strokeDashoffset,
        ...remainingOptions
    })), dotDot
        ? dot(data, treeNode({ fill: fill === undefined ? "node:internal" : fill, title, ...remainingOptions }))
        : null, textText != null
        ? text(data, treeNode({
            text: textText,
            fill: fill === undefined ? "currentColor" : fill,
            stroke: textStroke,
            dx,
            dy,
            title,
            ...remainingOptions
        }))
        : null);
}
/** 
 * Like [Plot.tree](https://github.com/observablehq/plot/blob/main/README.md#plottreedata-options), except sets the **treeLayout** option to D3’s cluster (dendrogram) algorithm, which aligns leaf nodes.
 * 
 */
function cluster(data, options) {
    return tree(data, { ...options, treeLayout: d3.cluster });
}

const defaults$2 = {
    ariaLabel: "vector",
    fill: null,
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round"
};
class Vector extends Mark {
    constructor(data, options = {}) {
        const { x, y, length, rotate, anchor = "middle", frameAnchor } = options;
        const [vl, cl] = maybeNumberChannel(length, 12);
        const [vr, cr] = maybeNumberChannel(rotate, 0);
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true },
            length: { value: vl, scale: "length", optional: true },
            rotate: { value: vr, optional: true }
        }, options, defaults$2);
        this.length = cl;
        this.rotate = cr;
        this.anchor = keyword(anchor, "anchor", ["start", "middle", "end"]);
        this.frameAnchor = maybeFrameAnchor(frameAnchor);
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y: Y, length: L, rotate: R } = channels;
        const { length, rotate, anchor } = this;
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        const fl = L ? (i) => L[i] : () => length;
        const fr = R ? (i) => R[i] : () => rotate;
        const fx = X ? (i) => X[i] : () => cx;
        const fy = Y ? (i) => Y[i] : () => cy;
        const k = anchor === "start" ? 0 : anchor === "end" ? 1 : 0.5;
        return create("svg:g", context)
            .attr("fill", "none")
            .call(applyIndirectStyles, this, scales, dimensions, context)
            .call(applyTransform, this, { x: X && x, y: Y && y })
            .call((g) => g
            .selectAll()
            .data(index)
            .enter()
            .append("path")
            .call(applyDirectStyles, this)
            .attr("d", (i) => {
            const l = fl(i), a = fr(i) * radians;
            const x = Math.sin(a) * l, y = -Math.cos(a) * l;
            const d = (x + y) / 5, e = (x - y) / 5;
            return `M${fx(i) - x * k},${fy(i) - y * k}l${x},${y}m${-e},${-d}l${e},${d}l${-d},${e}`;
        })
            .call(applyChannelStyles, this, channels))
            .node();
    }
}
/** 
 * ```js
 * Plot.vector(wind, {x: "longitude", y: "latitude", length: "speed", rotate: "direction"})
 * ```
 * 
 * Returns a new vector with the given *data* and *options*. If neither the **x** nor **y** options are specified, *data* is assumed to be an array of pairs [[*x₀*, *y₀*], [*x₁*, *y₁*], [*x₂*, *y₂*], …] such that **x** = [*x₀*, *x₁*, *x₂*, …] and **y** = [*y₀*, *y₁*, *y₂*, …].
 * 
 */
function vector(data, options = {}) {
    let { x, y, ...remainingOptions } = options;
    if (options.frameAnchor === undefined)
        [x, y] = maybeTuple(x, y);
    return new Vector(data, { ...remainingOptions, x, y });
}
/** 
 * Equivalent to [Plot.vector](https://github.com/observablehq/plot/blob/main/README.md#plotvectordata-options) except that if the **x** option is not specified, it defaults to the identity function and assumes that *data* = [*x₀*, *x₁*, *x₂*, …].
 * 
 */
function vectorX(data, options = {}) {
    const { x = identity$1, ...remainingOptions } = options;
    return new Vector(data, { ...remainingOptions, x });
}
/** 
 * Equivalent to [Plot.vector](https://github.com/observablehq/plot/blob/main/README.md#plotvectordata-options) except that if the **y** option is not specified, it defaults to the identity function and assumes that *data* = [*y₀*, *y₁*, *y₂*, …].
 * 
 */
function vectorY(data, options = {}) {
    const { y = identity$1, ...remainingOptions } = options;
    return new Vector(data, { ...remainingOptions, y });
}

// (a, y, c, l, h) = (array, y[, cmp, lo, hi])

function ge(a, y, c, l, h) {
  var i = h + 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p >= 0) { i = m; h = m - 1; } else { l = m + 1; }
  }
  return i;
}
function gt(a, y, c, l, h) {
  var i = h + 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p > 0) { i = m; h = m - 1; } else { l = m + 1; }
  }
  return i;
}
function lt(a, y, c, l, h) {
  var i = l - 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p < 0) { i = m; l = m + 1; } else { h = m - 1; }
  }
  return i;
}
function le(a, y, c, l, h) {
  var i = l - 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p <= 0) { i = m; l = m + 1; } else { h = m - 1; }
  }
  return i;
}
function eq(a, y, c, l, h) {
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p === 0) { return m }
    if (p <= 0) { l = m + 1; } else { h = m - 1; }
  }
  return -1;
}
function norm(a, y, c, l, h, f) {
  if (typeof c === 'function') {
    return f(a, y, c, (l === undefined) ? 0 : l | 0, (h === undefined) ? a.length - 1 : h | 0);
  }
  return f(a, y, undefined, (c === undefined) ? 0 : c | 0, (l === undefined) ? a.length - 1 : l | 0);
}

var searchBounds = {
  ge: function(a, y, c, l, h) { return norm(a, y, c, l, h, ge)},
  gt: function(a, y, c, l, h) { return norm(a, y, c, l, h, gt)},
  lt: function(a, y, c, l, h) { return norm(a, y, c, l, h, lt)},
  le: function(a, y, c, l, h) { return norm(a, y, c, l, h, le)},
  eq: function(a, y, c, l, h) { return norm(a, y, c, l, h, eq)}
};

var bounds = searchBounds;

var NOT_FOUND = 0;
var SUCCESS = 1;
var EMPTY = 2;

var intervalTree = createWrapper;

function IntervalTreeNode(mid, left, right, leftPoints, rightPoints) {
  this.mid = mid;
  this.left = left;
  this.right = right;
  this.leftPoints = leftPoints;
  this.rightPoints = rightPoints;
  this.count = (left ? left.count : 0) + (right ? right.count : 0) + leftPoints.length;
}

var proto = IntervalTreeNode.prototype;

function copy(a, b) {
  a.mid = b.mid;
  a.left = b.left;
  a.right = b.right;
  a.leftPoints = b.leftPoints;
  a.rightPoints = b.rightPoints;
  a.count = b.count;
}

function rebuild(node, intervals) {
  var ntree = createIntervalTree(intervals);
  node.mid = ntree.mid;
  node.left = ntree.left;
  node.right = ntree.right;
  node.leftPoints = ntree.leftPoints;
  node.rightPoints = ntree.rightPoints;
  node.count = ntree.count;
}

function rebuildWithInterval(node, interval) {
  var intervals = node.intervals([]);
  intervals.push(interval);
  rebuild(node, intervals);    
}

function rebuildWithoutInterval(node, interval) {
  var intervals = node.intervals([]);
  var idx = intervals.indexOf(interval);
  if(idx < 0) {
    return NOT_FOUND
  }
  intervals.splice(idx, 1);
  rebuild(node, intervals);
  return SUCCESS
}

proto.intervals = function(result) {
  result.push.apply(result, this.leftPoints);
  if(this.left) {
    this.left.intervals(result);
  }
  if(this.right) {
    this.right.intervals(result);
  }
  return result
};

proto.insert = function(interval) {
  var weight = this.count - this.leftPoints.length;
  this.count += 1;
  if(interval[1] < this.mid) {
    if(this.left) {
      if(4*(this.left.count+1) > 3*(weight+1)) {
        rebuildWithInterval(this, interval);
      } else {
        this.left.insert(interval);
      }
    } else {
      this.left = createIntervalTree([interval]);
    }
  } else if(interval[0] > this.mid) {
    if(this.right) {
      if(4*(this.right.count+1) > 3*(weight+1)) {
        rebuildWithInterval(this, interval);
      } else {
        this.right.insert(interval);
      }
    } else {
      this.right = createIntervalTree([interval]);
    }
  } else {
    var l = bounds.ge(this.leftPoints, interval, compareBegin);
    var r = bounds.ge(this.rightPoints, interval, compareEnd);
    this.leftPoints.splice(l, 0, interval);
    this.rightPoints.splice(r, 0, interval);
  }
};

proto.remove = function(interval) {
  var weight = this.count - this.leftPoints;
  if(interval[1] < this.mid) {
    if(!this.left) {
      return NOT_FOUND
    }
    var rw = this.right ? this.right.count : 0;
    if(4 * rw > 3 * (weight-1)) {
      return rebuildWithoutInterval(this, interval)
    }
    var r = this.left.remove(interval);
    if(r === EMPTY) {
      this.left = null;
      this.count -= 1;
      return SUCCESS
    } else if(r === SUCCESS) {
      this.count -= 1;
    }
    return r
  } else if(interval[0] > this.mid) {
    if(!this.right) {
      return NOT_FOUND
    }
    var lw = this.left ? this.left.count : 0;
    if(4 * lw > 3 * (weight-1)) {
      return rebuildWithoutInterval(this, interval)
    }
    var r = this.right.remove(interval);
    if(r === EMPTY) {
      this.right = null;
      this.count -= 1;
      return SUCCESS
    } else if(r === SUCCESS) {
      this.count -= 1;
    }
    return r
  } else {
    if(this.count === 1) {
      if(this.leftPoints[0] === interval) {
        return EMPTY
      } else {
        return NOT_FOUND
      }
    }
    if(this.leftPoints.length === 1 && this.leftPoints[0] === interval) {
      if(this.left && this.right) {
        var p = this;
        var n = this.left;
        while(n.right) {
          p = n;
          n = n.right;
        }
        if(p === this) {
          n.right = this.right;
        } else {
          var l = this.left;
          var r = this.right;
          p.count -= n.count;
          p.right = n.left;
          n.left = l;
          n.right = r;
        }
        copy(this, n);
        this.count = (this.left?this.left.count:0) + (this.right?this.right.count:0) + this.leftPoints.length;
      } else if(this.left) {
        copy(this, this.left);
      } else {
        copy(this, this.right);
      }
      return SUCCESS
    }
    for(var l = bounds.ge(this.leftPoints, interval, compareBegin); l<this.leftPoints.length; ++l) {
      if(this.leftPoints[l][0] !== interval[0]) {
        break
      }
      if(this.leftPoints[l] === interval) {
        this.count -= 1;
        this.leftPoints.splice(l, 1);
        for(var r = bounds.ge(this.rightPoints, interval, compareEnd); r<this.rightPoints.length; ++r) {
          if(this.rightPoints[r][1] !== interval[1]) {
            break
          } else if(this.rightPoints[r] === interval) {
            this.rightPoints.splice(r, 1);
            return SUCCESS
          }
        }
      }
    }
    return NOT_FOUND
  }
};

function reportLeftRange(arr, hi, cb) {
  for(var i=0; i<arr.length && arr[i][0] <= hi; ++i) {
    var r = cb(arr[i]);
    if(r) { return r }
  }
}

function reportRightRange(arr, lo, cb) {
  for(var i=arr.length-1; i>=0 && arr[i][1] >= lo; --i) {
    var r = cb(arr[i]);
    if(r) { return r }
  }
}

function reportRange(arr, cb) {
  for(var i=0; i<arr.length; ++i) {
    var r = cb(arr[i]);
    if(r) { return r }
  }
}

proto.queryPoint = function(x, cb) {
  if(x < this.mid) {
    if(this.left) {
      var r = this.left.queryPoint(x, cb);
      if(r) { return r }
    }
    return reportLeftRange(this.leftPoints, x, cb)
  } else if(x > this.mid) {
    if(this.right) {
      var r = this.right.queryPoint(x, cb);
      if(r) { return r }
    }
    return reportRightRange(this.rightPoints, x, cb)
  } else {
    return reportRange(this.leftPoints, cb)
  }
};

proto.queryInterval = function(lo, hi, cb) {
  if(lo < this.mid && this.left) {
    var r = this.left.queryInterval(lo, hi, cb);
    if(r) { return r }
  }
  if(hi > this.mid && this.right) {
    var r = this.right.queryInterval(lo, hi, cb);
    if(r) { return r }
  }
  if(hi < this.mid) {
    return reportLeftRange(this.leftPoints, hi, cb)
  } else if(lo > this.mid) {
    return reportRightRange(this.rightPoints, lo, cb)
  } else {
    return reportRange(this.leftPoints, cb)
  }
};

function compareNumbers(a, b) {
  return a - b
}

function compareBegin(a, b) {
  var d = a[0] - b[0];
  if(d) { return d }
  return a[1] - b[1]
}

function compareEnd(a, b) {
  var d = a[1] - b[1];
  if(d) { return d }
  return a[0] - b[0]
}

function createIntervalTree(intervals) {
  if(intervals.length === 0) {
    return null
  }
  var pts = [];
  for(var i=0; i<intervals.length; ++i) {
    pts.push(intervals[i][0], intervals[i][1]);
  }
  pts.sort(compareNumbers);

  var mid = pts[pts.length>>1];

  var leftIntervals = [];
  var rightIntervals = [];
  var centerIntervals = [];
  for(var i=0; i<intervals.length; ++i) {
    var s = intervals[i];
    if(s[1] < mid) {
      leftIntervals.push(s);
    } else if(mid < s[0]) {
      rightIntervals.push(s);
    } else {
      centerIntervals.push(s);
    }
  }

  //Split center intervals
  var leftPoints = centerIntervals;
  var rightPoints = centerIntervals.slice();
  leftPoints.sort(compareBegin);
  rightPoints.sort(compareEnd);

  return new IntervalTreeNode(mid, 
    createIntervalTree(leftIntervals),
    createIntervalTree(rightIntervals),
    leftPoints,
    rightPoints)
}

//User friendly wrapper that makes it possible to support empty trees
function IntervalTree(root) {
  this.root = root;
}

var tproto = IntervalTree.prototype;

tproto.insert = function(interval) {
  if(this.root) {
    this.root.insert(interval);
  } else {
    this.root = new IntervalTreeNode(interval[0], null, null, [interval], [interval]);
  }
};

tproto.remove = function(interval) {
  if(this.root) {
    var r = this.root.remove(interval);
    if(r === EMPTY) {
      this.root = null;
    }
    return r !== NOT_FOUND
  }
  return false
};

tproto.queryPoint = function(p, cb) {
  if(this.root) {
    return this.root.queryPoint(p, cb)
  }
};

tproto.queryInterval = function(lo, hi, cb) {
  if(lo <= hi && this.root) {
    return this.root.queryInterval(lo, hi, cb)
  }
};

Object.defineProperty(tproto, "count", {
  get: function() {
    if(this.root) {
      return this.root.count
    }
    return 0
  }
});

Object.defineProperty(tproto, "intervals", {
  get: function() {
    if(this.root) {
      return this.root.intervals([])
    }
    return []
  }
});

function createWrapper(intervals) {
  if(!intervals || intervals.length === 0) {
    return new IntervalTree(null)
  }
  return new IntervalTree(createIntervalTree(intervals))
}

const anchorXLeft = ({ marginLeft }) => [1, marginLeft];
const anchorXRight = ({ width, marginRight }) => [-1, width - marginRight];
const anchorXMiddle = ({ width, marginLeft, marginRight }) => [0, (marginLeft + width - marginRight) / 2];
const anchorYTop = ({ marginTop }) => [1, marginTop];
const anchorYBottom = ({ height, marginBottom }) => [-1, height - marginBottom];
const anchorYMiddle = ({ height, marginTop, marginBottom }) => [0, (marginTop + height - marginBottom) / 2];
function maybeAnchor$1(anchor) {
    return typeof anchor === "string" ? { anchor } : anchor;
}
/** 
 * ```js
 * Plot.dodgeX({y: "value"})
 * ```
 * 
 * Equivalent to Plot.dodgeY, but piling horizontally, creating a new *x* position channel that avoids overlapping. The *y* position channel is unchanged.
 * 
 */
function dodgeX(dodgeOptions = {}, options = {}) {
    if (arguments.length === 1)
        [dodgeOptions, options] = mergeOptions(dodgeOptions);
    let { anchor = "left", padding = 1 } = maybeAnchor$1(dodgeOptions);
    switch (`${anchor}`.toLowerCase()) {
        case "left":
            anchor = anchorXLeft;
            break;
        case "right":
            anchor = anchorXRight;
            break;
        case "middle":
            anchor = anchorXMiddle;
            break;
        default:
            throw new Error(`unknown dodge anchor: ${anchor}`);
    }
    return dodge("x", "y", anchor, number(padding), options);
}
/** 
 * ```js
 * Plot.dodgeY({x: "date"})
 * ```
 * 
 * Given marks arranged along the *x* axis, the dodgeY transform piles them vertically by defining a *y* position channel that avoids overlapping. The *x* position channel is unchanged.
 * 
 */
function dodgeY(dodgeOptions = {}, options = {}) {
    if (arguments.length === 1)
        [dodgeOptions, options] = mergeOptions(dodgeOptions);
    let { anchor = "bottom", padding = 1 } = maybeAnchor$1(dodgeOptions);
    switch (`${anchor}`.toLowerCase()) {
        case "top":
            anchor = anchorYTop;
            break;
        case "bottom":
            anchor = anchorYBottom;
            break;
        case "middle":
            anchor = anchorYMiddle;
            break;
        default:
            throw new Error(`unknown dodge anchor: ${anchor}`);
    }
    return dodge("y", "x", anchor, number(padding), options);
}
function mergeOptions(options) {
    const { anchor, padding, ...rest } = options;
    return [{ anchor, padding }, rest];
}
function dodge(y, x, anchor, padding, options) {
    const { r } = options;
    if (r != null && typeof r !== "number") {
        const { channels, sort, reverse } = options;
        options = { ...options, channels: { r: { value: r, scale: "r" }, ...maybeNamed(channels) } };
        if (sort === undefined && reverse === undefined)
            options.sort = { channel: "r", order: "descending" };
    }
    return initializer(options, function (data, facets, channels, scales, dimensions, context) {
        let { [x]: X, r: R } = channels;
        if (!channels[x])
            throw new Error(`missing channel: ${x}`);
        ({ [x]: X } = Position(channels, scales, context));
        const r = R ? undefined : this.r !== undefined ? this.r : options.r !== undefined ? number(options.r) : 3;
        if (R)
            R = coerceNumbers(valueof(R.value, scales[R.scale] || identity$1));
        let [ky, ty] = anchor(dimensions);
        const compare = ky ? compareAscending : compareSymmetric;
        const Y = new Float64Array(X.length);
        const radius = R ? (i) => R[i] : () => r;
        for (let I of facets) {
            const tree = intervalTree();
            I = I.filter(R ? (i) => finite(X[i]) && positive(R[i]) : (i) => finite(X[i]));
            const intervals = new Float64Array(2 * I.length + 2);
            for (const i of I) {
                const ri = radius(i);
                const y0 = ky ? ri + padding : 0; // offset baseline for varying radius
                const l = X[i] - ri;
                const h = X[i] + ri;
                // The first two positions are 0 to test placing the dot on the baseline.
                let k = 2;
                // For any previously placed circles that may overlap this circle, compute
                // the y-positions that place this circle tangent to these other circles.
                // https://observablehq.com/@mbostock/circle-offset-along-line
                tree.queryInterval(l - padding, h + padding, ([, , j]) => {
                    const yj = Y[j] - y0;
                    const dx = X[i] - X[j];
                    const dr = padding + (R ? R[i] + R[j] : 2 * r);
                    const dy = Math.sqrt(dr * dr - dx * dx);
                    intervals[k++] = yj - dy;
                    intervals[k++] = yj + dy;
                });
                // Find the best y-value where this circle can fit.
                let candidates = intervals.slice(0, k);
                if (ky)
                    candidates = candidates.filter((y) => y >= 0);
                out: for (const y of candidates.sort(compare)) {
                    for (let j = 0; j < k; j += 2) {
                        if (intervals[j] + 1e-6 < y && y < intervals[j + 1] - 1e-6) {
                            continue out;
                        }
                    }
                    Y[i] = y + y0;
                    break;
                }
                // Insert the placed circle into the interval tree.
                tree.insert([l, h, i]);
            }
        }
        if (!ky)
            ky = 1;
        for (const I of facets) {
            for (const i of I) {
                Y[i] = Y[i] * ky + ty;
            }
        }
        return {
            data,
            facets,
            channels: {
                [x]: { value: X },
                [y]: { value: Y },
                ...(R && { r: { value: R } })
            }
        };
    });
}
function compareSymmetric(a, b) {
    return Math.abs(a) - Math.abs(b);
}
function compareAscending(a, b) {
    return a - b;
}

/** 
 * ```js
 * Plot.normalizeX("first", {y: "Date", x: "Close", stroke: "Symbol"})
 * ```
 * 
 * Like [Plot.mapX](https://github.com/observablehq/plot/blob/main/README.md#plotmapxmap-options), but applies the normalize map method with the given *basis*.
 * 
 */
function normalizeX(basis, options) {
    if (arguments.length === 1)
        ({ basis, ...options } = basis);
    return mapX(normalize(basis), options);
}
/** 
 * ```js
 * Plot.normalizeY("first", {x: "Date", y: "Close", stroke: "Symbol"})
 * ```
 * 
 * Like [Plot.mapY](https://github.com/observablehq/plot/blob/main/README.md#plotmapymap-options), but applies the normalize map method with the given *basis*.
 * 
 */
function normalizeY(basis, options) {
    if (arguments.length === 1)
        ({ basis, ...options } = basis);
    return mapY(normalize(basis), options);
}
/** 
 * ```js
 * Plot.map({y: Plot.normalize("first")}, {x: "Date", y: "Close", stroke: "Symbol"})
 * ```
 * 
 * Returns a normalize map method for the given *basis*, suitable for use with Plot.map.
 * 
 */
function normalize(basis) {
    if (basis === undefined)
        return normalizeFirst;
    if (typeof basis === "function")
        return normalizeBasis((I, S) => basis(take(S, I)));
    if (/^p\d{2}$/i.test(basis))
        return normalizeAccessor(percentile(basis));
    switch (`${basis}`.toLowerCase()) {
        case "deviation":
            return normalizeDeviation;
        case "first":
            return normalizeFirst;
        case "last":
            return normalizeLast;
        case "max":
            return normalizeMax;
        case "mean":
            return normalizeMean;
        case "median":
            return normalizeMedian;
        case "min":
            return normalizeMin;
        case "sum":
            return normalizeSum;
        case "extent":
            return normalizeExtent;
    }
    throw new Error(`invalid basis: ${basis}`);
}
function normalizeBasis(basis) {
    return {
        map(I, S, T) {
            const b = +basis(I, S);
            for (const i of I) {
                T[i] = S[i] === null ? NaN : S[i] / b;
            }
        }
    };
}
function normalizeAccessor(f) {
    return normalizeBasis((I, S) => f(I, (i) => S[i]));
}
const normalizeExtent = {
    map(I, S, T) {
        const [s1, s2] = d3.extent(I, (i) => S[i]), d = s2 - s1;
        for (const i of I) {
            T[i] = S[i] === null ? NaN : (S[i] - s1) / d;
        }
    }
};
const normalizeFirst = normalizeBasis((I, S) => {
    for (let i = 0; i < I.length; ++i) {
        const s = S[I[i]];
        if (defined(s))
            return s;
    }
});
const normalizeLast = normalizeBasis((I, S) => {
    for (let i = I.length - 1; i >= 0; --i) {
        const s = S[I[i]];
        if (defined(s))
            return s;
    }
});
const normalizeDeviation = {
    map(I, S, T) {
        const m = d3.mean(I, (i) => S[i]);
        const d = d3.deviation(I, (i) => S[i]);
        for (const i of I) {
            T[i] = S[i] === null ? NaN : d ? (S[i] - m) / d : 0;
        }
    }
};
const normalizeMax = normalizeAccessor(d3.max);
const normalizeMean = normalizeAccessor(d3.mean);
const normalizeMedian = normalizeAccessor(d3.median);
const normalizeMin = normalizeAccessor(d3.min);
const normalizeSum = normalizeAccessor(d3.sum);

function windowX(windowOptions = {}, options) {
    if (arguments.length === 1)
        options = windowOptions;
    return mapX(window$1(windowOptions), options);
}
function windowY(windowOptions = {}, options) {
    if (arguments.length === 1)
        options = windowOptions;
    return mapY(window$1(windowOptions), options);
}
function window$1(options = {}) {
    if (typeof options === "number")
        options = { k: options };
    let { k, reduce, shift, anchor, strict } = options;
    if (anchor === undefined && shift !== undefined) {
        anchor = maybeShift(shift);
        warn(`Warning: the shift option is deprecated; please use anchor "${anchor}" instead.`);
    }
    if (!((k = Math.floor(k)) > 0))
        throw new Error(`invalid k: ${k}`);
    return maybeReduce(reduce)(k, maybeAnchor(anchor, k), strict);
}
function maybeAnchor(anchor = "middle", k) {
    switch (`${anchor}`.toLowerCase()) {
        case "middle":
            return (k - 1) >> 1;
        case "start":
            return 0;
        case "end":
            return k - 1;
    }
    throw new Error(`invalid anchor: ${anchor}`);
}
function maybeShift(shift) {
    switch (`${shift}`.toLowerCase()) {
        case "centered":
            return "middle";
        case "leading":
            return "start";
        case "trailing":
            return "end";
    }
    throw new Error(`invalid shift: ${shift}`);
}
function maybeReduce(reduce = "mean") {
    if (typeof reduce === "string") {
        if (/^p\d{2}$/i.test(reduce))
            return reduceNumbers(percentile(reduce));
        switch (reduce.toLowerCase()) {
            case "deviation":
                return reduceNumbers(d3.deviation);
            case "max":
                return reduceArray(d3.max);
            case "mean":
                return reduceMean;
            case "median":
                return reduceNumbers(d3.median);
            case "min":
                return reduceArray(d3.min);
            case "mode":
                return reduceArray(d3.mode);
            case "sum":
                return reduceSum;
            case "variance":
                return reduceNumbers(d3.variance);
            case "difference":
                return reduceDifference;
            case "ratio":
                return reduceRatio;
            case "first":
                return reduceFirst;
            case "last":
                return reduceLast;
        }
    }
    if (typeof reduce !== "function")
        throw new Error(`invalid reduce: ${reduce}`);
    return reduceArray(reduce);
}
function slice(I, i, j) {
    return I.subarray ? I.subarray(i, j) : I.slice(i, j);
}
// Note that the subarray may include NaN in the non-strict case; we expect the
// function f to handle that itself (e.g., by filtering as needed). The D3
// reducers (e.g., min, max, mean, median) do, and it’s faster to avoid
// redundant filtering.
function reduceNumbers(f) {
    return (k, s, strict) => strict
        ? {
            map(I, S, T) {
                const C = Float64Array.from(I, (i) => (S[i] === null ? NaN : S[i]));
                let nans = 0;
                for (let i = 0; i < k - 1; ++i)
                    if (isNaN(C[i]))
                        ++nans;
                for (let i = 0, n = I.length - k + 1; i < n; ++i) {
                    if (isNaN(C[i + k - 1]))
                        ++nans;
                    T[I[i + s]] = nans === 0 ? f(C.subarray(i, i + k)) : NaN;
                    if (isNaN(C[i]))
                        --nans;
                }
            }
        }
        : {
            map(I, S, T) {
                const C = Float64Array.from(I, (i) => (S[i] === null ? NaN : S[i]));
                for (let i = -s; i < 0; ++i) {
                    T[I[i + s]] = f(C.subarray(0, i + k));
                }
                for (let i = 0, n = I.length - s; i < n; ++i) {
                    T[I[i + s]] = f(C.subarray(i, i + k));
                }
            }
        };
}
function reduceArray(f) {
    return (k, s, strict) => strict
        ? {
            map(I, S, T) {
                let count = 0;
                for (let i = 0; i < k - 1; ++i)
                    count += defined(S[I[i]]);
                for (let i = 0, n = I.length - k + 1; i < n; ++i) {
                    count += defined(S[I[i + k - 1]]);
                    if (count === k)
                        T[I[i + s]] = f(take(S, slice(I, i, i + k)));
                    count -= defined(S[I[i]]);
                }
            }
        }
        : {
            map(I, S, T) {
                for (let i = -s; i < 0; ++i) {
                    T[I[i + s]] = f(take(S, slice(I, 0, i + k)));
                }
                for (let i = 0, n = I.length - s; i < n; ++i) {
                    T[I[i + s]] = f(take(S, slice(I, i, i + k)));
                }
            }
        };
}
function reduceSum(k, s, strict) {
    return strict
        ? {
            map(I, S, T) {
                let nans = 0;
                let sum = 0;
                for (let i = 0; i < k - 1; ++i) {
                    const v = S[I[i]];
                    if (v === null || isNaN(v))
                        ++nans;
                    else
                        sum += +v;
                }
                for (let i = 0, n = I.length - k + 1; i < n; ++i) {
                    const a = S[I[i]];
                    const b = S[I[i + k - 1]];
                    if (b === null || isNaN(b))
                        ++nans;
                    else
                        sum += +b;
                    T[I[i + s]] = nans === 0 ? sum : NaN;
                    if (a === null || isNaN(a))
                        --nans;
                    else
                        sum -= +a;
                }
            }
        }
        : {
            map(I, S, T) {
                let sum = 0;
                const n = I.length;
                for (let i = 0, j = Math.min(n, k - s - 1); i < j; ++i) {
                    sum += +S[I[i]] || 0;
                }
                for (let i = -s, j = n - s; i < j; ++i) {
                    sum += +S[I[i + k - 1]] || 0;
                    T[I[i + s]] = sum;
                    sum -= +S[I[i]] || 0;
                }
            }
        };
}
function reduceMean(k, s, strict) {
    if (strict) {
        const sum = reduceSum(k, s, strict);
        return {
            map(I, S, T) {
                sum.map(I, S, T);
                for (let i = 0, n = I.length - k + 1; i < n; ++i) {
                    T[I[i + s]] /= k;
                }
            }
        };
    }
    else {
        return {
            map(I, S, T) {
                let sum = 0;
                let count = 0;
                const n = I.length;
                for (let i = 0, j = Math.min(n, k - s - 1); i < j; ++i) {
                    let v = S[I[i]];
                    if (v !== null && !isNaN((v = +v)))
                        (sum += v), ++count;
                }
                for (let i = -s, j = n - s; i < j; ++i) {
                    let a = S[I[i + k - 1]];
                    let b = S[I[i]];
                    if (a !== null && !isNaN((a = +a)))
                        (sum += a), ++count;
                    T[I[i + s]] = sum / count;
                    if (b !== null && !isNaN((b = +b)))
                        (sum -= b), --count;
                }
            }
        };
    }
}
function firstDefined(S, I, i, k) {
    for (let j = i + k; i < j; ++i) {
        const v = S[I[i]];
        if (defined(v))
            return v;
    }
}
function lastDefined(S, I, i, k) {
    for (let j = i + k - 1; j >= i; --j) {
        const v = S[I[j]];
        if (defined(v))
            return v;
    }
}
function firstNumber(S, I, i, k) {
    for (let j = i + k; i < j; ++i) {
        let v = S[I[i]];
        if (v !== null && !isNaN((v = +v)))
            return v;
    }
}
function lastNumber(S, I, i, k) {
    for (let j = i + k - 1; j >= i; --j) {
        let v = S[I[j]];
        if (v !== null && !isNaN((v = +v)))
            return v;
    }
}
function reduceDifference(k, s, strict) {
    return strict
        ? {
            map(I, S, T) {
                for (let i = 0, n = I.length - k; i < n; ++i) {
                    const a = S[I[i]];
                    const b = S[I[i + k - 1]];
                    T[I[i + s]] = a === null || b === null ? NaN : b - a;
                }
            }
        }
        : {
            map(I, S, T) {
                for (let i = -s, n = I.length - k + s + 1; i < n; ++i) {
                    T[I[i + s]] = lastNumber(S, I, i, k) - firstNumber(S, I, i, k);
                }
            }
        };
}
function reduceRatio(k, s, strict) {
    return strict
        ? {
            map(I, S, T) {
                for (let i = 0, n = I.length - k; i < n; ++i) {
                    const a = S[I[i]];
                    const b = S[I[i + k - 1]];
                    T[I[i + s]] = a === null || b === null ? NaN : b / a;
                }
            }
        }
        : {
            map(I, S, T) {
                for (let i = -s, n = I.length - k + s + 1; i < n; ++i) {
                    T[I[i + s]] = lastNumber(S, I, i, k) / firstNumber(S, I, i, k);
                }
            }
        };
}
function reduceFirst(k, s, strict) {
    return strict
        ? {
            map(I, S, T) {
                for (let i = 0, n = I.length - k; i < n; ++i) {
                    T[I[i + s]] = S[I[i]];
                }
            }
        }
        : {
            map(I, S, T) {
                for (let i = -s, n = I.length - k + s + 1; i < n; ++i) {
                    T[I[i + s]] = firstDefined(S, I, i, k);
                }
            }
        };
}
function reduceLast(k, s, strict) {
    return strict
        ? {
            map(I, S, T) {
                for (let i = 0, n = I.length - k; i < n; ++i) {
                    T[I[i + s]] = S[I[i + k - 1]];
                }
            }
        }
        : {
            map(I, S, T) {
                for (let i = -s, n = I.length - k + s + 1; i < n; ++i) {
                    T[I[i + s]] = lastDefined(S, I, i, k);
                }
            }
        };
}

/** 
 * Selects the points of each series selected by the *selector*, which can be specified either as a function which receives as input the index of the series, the shorthand “first” or “last”, or as a {*key*: *value*} object with exactly one *key* being the name of a channel and the *value* being a function which receives as input the index of the series and the channel values. The *value* may alternatively be specified as the shorthand “min” and “max” which respectively select the minimum and maximum points for the specified channel.
 * 
 * For example, to select the point within each series that is the closest to the median of the *y* channel:
 * 
 * ```js
 * Plot.select({
 *   y: (I, V) => {
 *     const median = d3.median(I, i => V[i]);
 *     const i = d3.least(I, i => Math.abs(V[i] - median));
 *     return [i];
 *   }
 * }, {
 *   x: "year",
 *   y: "revenue",
 *   fill: "format"
 * })
 * ```
 * 
 * To pick three points at random in each series:
 * 
 * ```js
 * Plot.select(I => d3.shuffle(I.slice()).slice(0, 3), {z: "year", ...})
 * ```
 * 
 * To pick the point in each city with the highest temperature:
 * 
 * ```js
 * Plot.select({fill: "max"}, {x: "date", y: "city", fill: "temperature", z: "city"})
 * ```
 * 
 */
function select(selector, options = {}) {
    // If specified selector is a string or function, it’s a selector without an
    // input channel such as first or last.
    if (typeof selector === "string") {
        switch (selector.toLowerCase()) {
            case "first":
                return selectFirst(options);
            case "last":
                return selectLast(options);
        }
    }
    if (typeof selector === "function") {
        return selectChannel(null, selector, options);
    }
    // Otherwise the selector is an option {name: value} where name is a channel
    // name and value is a selector definition that additionally takes the given
    // channel values as input. The selector object must have exactly one key.
    let key, value;
    for (key in selector) {
        if (value !== undefined)
            throw new Error("ambiguous selector; multiple inputs");
        value = maybeSelector(selector[key]);
    }
    if (value === undefined)
        throw new Error(`invalid selector: ${selector}`);
    return selectChannel(key, value, options);
}
function maybeSelector(selector) {
    if (typeof selector === "function")
        return selector;
    switch (`${selector}`.toLowerCase()) {
        case "min":
            return selectorMin;
        case "max":
            return selectorMax;
    }
    throw new Error(`unknown selector: ${selector}`);
}
/** 
 * Selects the first point of each series according to input order.
 * 
 */
function selectFirst(options) {
    return selectChannel(null, selectorFirst, options);
}
/** 
 * Selects the last point of each series according to input order.
 * 
 */
function selectLast(options) {
    return selectChannel(null, selectorLast, options);
}
/** 
 * Selects the leftmost point of each series.
 * 
 */
function selectMinX(options) {
    return selectChannel("x", selectorMin, options);
}
/** 
 * Selects the lowest point of each series.
 * 
 */
function selectMinY(options) {
    return selectChannel("y", selectorMin, options);
}
/** 
 * Selects the rightmost point of each series.
 * 
 */
function selectMaxX(options) {
    return selectChannel("x", selectorMax, options);
}
/** 
 * Selects the highest point of each series.
 * 
 */
function selectMaxY(options) {
    return selectChannel("y", selectorMax, options);
}
function* selectorFirst(I) {
    yield I[0];
}
function* selectorLast(I) {
    yield I[I.length - 1];
}
function* selectorMin(I, X) {
    yield d3.least(I, (i) => X[i]);
}
function* selectorMax(I, X) {
    yield d3.greatest(I, (i) => X[i]);
}
function selectChannel(v, selector, options) {
    if (v != null) {
        if (options[v] == null)
            throw new Error(`missing channel: ${v}`);
        v = options[v];
    }
    const z = maybeZ(options);
    return basic(options, (data, facets) => {
        const Z = valueof(data, z);
        const V = valueof(data, v);
        const selectFacets = [];
        for (const facet of facets) {
            const selectFacet = [];
            for (const I of Z ? d3.group(facet, (i) => Z[i]).values() : [facet]) {
                for (const i of selector(I, V)) {
                    selectFacet.push(i);
                }
            }
            selectFacets.push(selectFacet);
        }
        return { data, facets: selectFacets };
    });
}

const defaults$1 = {
    ariaLabel: "brush",
    fill: "#777",
    fillOpacity: 0.3,
    stroke: "#fff"
};
class Brush extends Mark {
    constructor(data, { x, y, ...options } = {}) {
        super(data, {
            x: { value: x, scale: "x", optional: true },
            y: { value: y, scale: "y", optional: true }
        }, options, defaults$1);
        // TODO make into a channel?
        // TODO validate is tuple of points
        this.initialX = options.initialX;
        this.initialY = options.initialY;
        this.activeElement = null;
    }
    render(index, scales, channels, dimensions, context) {
        const { x: X, y: Y } = channels;
        const { x, y } = scales;
        const { ariaLabel, ariaDescription, ariaHidden, ...options } = this;
        const { marginLeft, width, marginRight, marginTop, height, marginBottom } = dimensions;
        const brush = this;
        const d3Brush = (X && Y ? d3.brush : X ? d3.brushX : d3.brushY)().extent([
            [marginLeft, marginTop],
            [width - marginRight, height - marginBottom]
        ]);
        const brushG = d3.create("svg:g", context)
            .call(applyIndirectStyles, { ariaLabel, ariaDescription, ariaHidden }, scales, dimensions, context)
            .call(d3Brush)
            .call((g) => g
            .selectAll(".selection")
            .attr("shape-rendering", null) // reset d3-brush
            .call(applyIndirectStyles, options, dimensions, context)
            .call(applyTransform, this, scales));
        if (this.initialX && this.initialY && x && y) {
            const [x0, x1] = this.initialX.map(x);
            const [y0, y1] = this.initialY.map(y);
            brushG.call(d3Brush.move, [
                [x0, y0],
                [x1, y1]
            ]);
        }
        if (this.initialX && X) {
            const [x0, x1] = this.initialX.map(x);
            brushG.call(d3Brush.move, [x0, x1]);
        }
        else if (this.initialY && Y) {
            const [y0, y1] = this.initialY.map(y);
            brushG.call(d3Brush.move, [y0, y1]);
        }
        d3Brush.on("start end brush", function (event) {
            const { type, selection: extent } = event;
            // For faceting, when starting a brush in a new facet, clear the
            // brush and selection on the old facet. In the future, we might
            // allow independent brushes across facets by disabling this?
            if (type === "start" && brush.activeElement !== this) {
                if (brush.activeElement !== null) {
                    d3.select(brush.activeElement).call(event.target.clear, event);
                    brush.activeElement[selection] = null;
                }
                brush.activeElement = this;
            }
            let S = null;
            let extentX, extentY;
            if (extent) {
                S = index;
                if (X) {
                    let [x0, x1] = Y ? [extent[0][0], extent[1][0]] : extent;
                    extentX = [x.invert(x0), x.invert(x1)];
                    if (x.bandwidth)
                        x0 -= x.bandwidth();
                    S = S.filter((i) => x0 <= X[i] && X[i] <= x1);
                }
                if (Y) {
                    let [y0, y1] = X ? [extent[0][1], extent[1][1]] : extent;
                    extentY = [y.invert(y0), y.invert(y1)];
                    if (y.bandwidth)
                        y0 -= y.bandwidth();
                    S = S.filter((i) => y0 <= Y[i] && Y[i] <= y1);
                }
            }
            if (!selectionEquals(this[selection], S) || event.type === "end") {
                this[selection] = S;
                const selected = S === null ? brush.data : take(brush.data, S);
                this.dispatchEvent(new CustomEvent("input", {
                    bubbles: true,
                    detail: { type: event.type, selected, extentX, extentY }
                }));
            }
        });
        const g = brushG.node();
        g[selection] = null;
        return g;
    }
}
function brush(data, { x, y, ...options } = {}) {
    [x, y] = maybeTuple(x, y);
    return new Brush(data, { ...options, x, y });
}
function brushX(data, { x = identity$1, ...options } = {}) {
    return new Brush(data, { ...options, x });
}
function brushY(data, { y = identity$1, ...options } = {}) {
    return new Brush(data, { ...options, y });
}

const defaults = {
    ariaLabel: "pointer",
    fill: "none",
    stroke: "#3b5fc0",
    strokeWidth: 1.5
};
class Pointer extends Mark {
    constructor(data, { x, y, n = 1, r = isFinite(n) ? 120 : 20, mode = "auto", ...options } = {}) {
        super(data, [
            { name: "x", value: x, scale: "x", optional: true },
            { name: "y", value: y, scale: "y", optional: true }
        ], options, defaults);
        this.n = +n;
        this.r = +r;
        this.mode = maybeMode(mode, x, y);
    }
    render(index, { x, y }, { x: X, y: Y }, dimensions) {
        const { marginLeft, width, marginRight, marginTop, height, marginBottom } = dimensions;
        const { mode, n, r } = this;
        const r2 = r * r; // the squared radius; to determine points in proximity to the pointer
        const down = new Set(); // the set of pointers that are currently down
        let C = []; // a sparse index from index[i] to an svg:circle element
        let P = null; // the persistent selection; a subset of index, or null
        const g = d3.create("svg:g");
        const parent = g.append("g").call(applyIndirectStyles, this, dimensions).call(applyDirectStyles, this).node();
        // Note that point scales also expose a bandwidth function, but that always
        // returns zero. SVG will not render a stroked rect with zero width or
        // height, so we’ll render these as lines instead.
        const bx = x?.bandwidth?.();
        const by = y?.bandwidth?.();
        // The visual representation of the logical selection depends on which
        // channels are available (x, y, or both) and whether the corresponding
        // scales are band scales.
        const createElement = X && Y
            ? bx && by
                ? (i) => element("rect", { x: X[i], y: Y[i], width: bx, height: by })
                : bx
                    ? (i) => element("line", { x1: X[i], x2: X[i] + bx, y1: Y[i], y2: Y[i] })
                    : by
                        ? (i) => element("line", { x1: X[i], x2: X[i], y1: Y[i], y2: Y[i] + by })
                        : (i) => element("circle", { cx: X[i], cy: Y[i], r: 4 })
            : X
                ? bx
                    ? (i) => element("rect", { x: X[i], y: marginTop, width: bx, height: height - marginBottom - marginTop })
                    : (i) => element("line", { x1: X[i], x2: X[i], y1: marginTop, y2: height - marginBottom })
                : by
                    ? (i) => element("rect", { x: marginLeft, y: Y[i], width: width - marginRight - marginLeft, height: by })
                    : (i) => element("line", { y1: Y[i], y2: Y[i], x1: marginLeft, x2: width - marginRight });
        // Renders the given logical selection S, a subset of index. Applies
        // copy-on-write to the array of elements C. Returns true if the selection
        // changed, and false otherwise.
        function render(S) {
            const SC = [];
            let changed = false;
            // Enter (append) the newly-selected elements. The order of elements is
            // arbitrary, with the most recently selected datum on top.
            S.forEach((i) => {
                let c = C[i];
                if (!c) {
                    c = createElement(i);
                    parent.appendChild(c);
                    changed = true;
                }
                SC[i] = c;
            });
            // Exit (remove) the no-longer-selected elements.
            C.forEach((c, i) => {
                if (!SC[i]) {
                    c.remove();
                    changed = true;
                }
            });
            if (changed)
                C = SC;
            return changed;
        }
        // Selects the given logical selection S, a subset of index, or null if
        // there is no selection.
        function select(S) {
            if (S === null)
                render([]);
            else if (!render(S))
                return;
            node[selection] = S;
            node.dispatchEvent(new Event("input", { bubbles: true }));
        }
        g.append("rect")
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .attr("width", width + marginLeft + marginRight)
            .attr("height", height + marginTop + marginBottom)
            .on("pointerdown pointerover pointermove", (event) => {
            // On pointerdown, initiate a new persistent selection, P, or extend
            // the existing persistent selection if the shift key is down; then
            // add to P for as long as the pointer remains down. If there is no
            // existing persistent selection on pointerdown, initialize P to the
            // empty selection rather than the points near the pointer such that
            // you can clear the persistent selection with a pointerdown followed
            // by a pointerup. (See below.)
            if (event.type === "pointerdown") {
                const nop = !P;
                down.add(event.pointerId);
                if (nop || !event.shiftKey)
                    P = [];
                if (!nop && !event.shiftKey)
                    return select(P);
            }
            // If any pointer is down, only consider pointers that are down.
            if (P && !down.has(event.pointerId))
                return;
            // Adjust the pointer to account for band scales; for band scales, the
            // data is mapped to the start of the band (e.g., a bar’s left edge).
            let [mx, my] = d3.pointer(event);
            if (x.bandwidth)
                mx -= x.bandwidth() / 2;
            if (y.bandwidth)
                my -= y.bandwidth() / 2;
            // Compute the current selection, S: the subset of index that is
            // logically selected. Normally this should be an in-order subset of
            // index, but it isn’t here because quickselect will reorder in-place
            // if the n option is used!
            let S = index;
            switch (mode) {
                case "xy": {
                    if (r < Infinity) {
                        S = S.filter((i) => {
                            const dx = X[i] - mx, dy = Y[i] - my;
                            return dx * dx + dy * dy <= r2;
                        });
                    }
                    if (S.length > n) {
                        S = S.slice();
                        d3.quickselect(S, n, undefined, undefined, (i, j) => {
                            const ix = X[i] - mx, iy = Y[i] - my;
                            const jx = X[j] - mx, jy = Y[j] - my;
                            return ix * ix + iy * iy - (jx * jx + jy * jy);
                        });
                        S = S.slice(0, n);
                    }
                    break;
                }
                case "x": {
                    if (r < Infinity) {
                        const [x0, x1] = [mx - r, mx + r];
                        S = S.filter((i) => x0 <= X[i] && X[i] <= x1);
                    }
                    if (S.length > n) {
                        S = S.slice();
                        d3.quickselect(S, n, undefined, undefined, (i, j) => {
                            const ix = X[i] - mx;
                            const jx = X[j] - mx;
                            return ix * ix - jx * jx;
                        });
                        S = S.slice(0, n);
                    }
                    break;
                }
                case "y": {
                    if (r < Infinity) {
                        const [y0, y1] = [my - r, my + r];
                        S = S.filter((i) => y0 <= Y[i] && Y[i] <= y1);
                    }
                    if (S.length > n) {
                        S = S.slice();
                        d3.quickselect(S, n, undefined, undefined, (i, j) => {
                            const iy = Y[i] - my;
                            const jy = Y[j] - my;
                            return iy * iy - jy * jy;
                        });
                        S = S.slice(0, n);
                    }
                    break;
                }
            }
            // If there is a persistent selection, add the new selection to the
            // persistent selection; otherwise just use the current selection.
            select(P ? (P = Array.from(d3.union(P, S))) : S);
        })
            .on("pointerup", (event) => {
            // On pointerup, if the selection is empty, clear the persistent to
            // selection to allow the ephemeral selection on subsequent hover.
            if (P && !P.length)
                select((P = null));
            down.delete(event.pointerId);
        })
            .on("pointerout", () => {
            // On pointerout, if there is no persistent selection, clear the
            // ephemeral selection.
            if (!P)
                select(null);
        });
        const node = g.node();
        node[selection] = null;
        return node;
    }
}
function maybeMode(mode = "auto", x, y) {
    switch ((mode = `${mode}`.toLowerCase())) {
        case "auto":
            mode = y == null ? "x" : x == null ? "y" : "xy";
            break;
        case "x":
        case "y":
        case "xy":
            break;
        default:
            throw new Error(`invalid mode: ${mode}`);
    }
    if (/^x/.test(mode) && x == null)
        throw new Error("missing channel: x");
    if (/y$/.test(mode) && y == null)
        throw new Error("missing channel: y");
    return mode;
}
function element(name, attrs) {
    const e = document.createElementNS(d3.namespaces.svg, name);
    for (const key in attrs)
        e.setAttribute(key, attrs[key]);
    return e;
}
function pointer(data, { x, y, ...options } = {}) {
    [x, y] = maybeTuple(x, y);
    return new Pointer(data, { ...options, x, y });
}
function pointerX(data, { mode = "x", x = identity$1, ...options } = {}) {
    return new Pointer(data, { ...options, mode, x });
}
function pointerY(data, { mode = "y", y = identity$1, ...options } = {}) {
    return new Pointer(data, { ...options, mode, y });
}

exports.Area = Area;
exports.Arrow = Arrow;
exports.BarX = BarX;
exports.BarY = BarY;
exports.Brush = Brush;
exports.Cell = Cell;
exports.Density = Density;
exports.Dot = Dot;
exports.Frame = Frame;
exports.Geo = Geo;
exports.Hexgrid = Hexgrid;
exports.Image = Image;
exports.Line = Line;
exports.Link = Link;
exports.Mark = Mark;
exports.Pointer = Pointer;
exports.Rect = Rect;
exports.RuleX = RuleX;
exports.RuleY = RuleY;
exports.Text = Text;
exports.TickX = TickX;
exports.TickY = TickY;
exports.Vector = Vector;
exports.area = area;
exports.areaX = areaX;
exports.areaY = areaY;
exports.arrow = arrow;
exports.barX = barX;
exports.barY = barY;
exports.bin = bin;
exports.binX = binX;
exports.binY = binY;
exports.boxX = boxX;
exports.boxY = boxY;
exports.brush = brush;
exports.brushX = brushX;
exports.brushY = brushY;
exports.cell = cell;
exports.cellX = cellX;
exports.cellY = cellY;
exports.circle = circle;
exports.cluster = cluster;
exports.column = column;
exports.delaunayLink = delaunayLink;
exports.delaunayMesh = delaunayMesh;
exports.density = density;
exports.dodgeX = dodgeX;
exports.dodgeY = dodgeY;
exports.dot = dot;
exports.dotX = dotX;
exports.dotY = dotY;
exports.filter = filter;
exports.formatIsoDate = formatIsoDate;
exports.formatMonth = formatMonth;
exports.formatWeekday = formatWeekday;
exports.frame = frame;
exports.geo = geo;
exports.graticule = graticule;
exports.group = group;
exports.groupX = groupX;
exports.groupY = groupY;
exports.groupZ = groupZ$1;
exports.hexagon = hexagon;
exports.hexbin = hexbin;
exports.hexgrid = hexgrid;
exports.hull = hull;
exports.image = image;
exports.initializer = initializer;
exports.legend = legend;
exports.line = line;
exports.lineX = lineX;
exports.lineY = lineY;
exports.linearRegressionX = linearRegressionX;
exports.linearRegressionY = linearRegressionY;
exports.link = link;
exports.map = map;
exports.mapX = mapX;
exports.mapY = mapY;
exports.marks = marks;
exports.normalize = normalize;
exports.normalizeX = normalizeX;
exports.normalizeY = normalizeY;
exports.plot = plot;
exports.pointer = pointer;
exports.pointerX = pointerX;
exports.pointerY = pointerY;
exports.rect = rect;
exports.rectX = rectX;
exports.rectY = rectY;
exports.reverse = reverse;
exports.ruleX = ruleX;
exports.ruleY = ruleY;
exports.scale = scale;
exports.select = select;
exports.selectFirst = selectFirst;
exports.selectLast = selectLast;
exports.selectMaxX = selectMaxX;
exports.selectMaxY = selectMaxY;
exports.selectMinX = selectMinX;
exports.selectMinY = selectMinY;
exports.selection = selection;
exports.shuffle = shuffle;
exports.sort = sort;
exports.sphere = sphere;
exports.stackX = stackX;
exports.stackX1 = stackX1;
exports.stackX2 = stackX2;
exports.stackY = stackY;
exports.stackY1 = stackY1;
exports.stackY2 = stackY2;
exports.text = text;
exports.textX = textX;
exports.textY = textY;
exports.tickX = tickX;
exports.tickY = tickY;
exports.transform = basic;
exports.tree = tree;
exports.treeLink = treeLink;
exports.treeNode = treeNode;
exports.valueof = valueof;
exports.vector = vector;
exports.vectorX = vectorX;
exports.vectorY = vectorY;
exports.version = version;
exports.voronoi = voronoi;
exports.voronoiMesh = voronoiMesh;
exports.window = window$1;
exports.windowX = windowX;
exports.windowY = windowY;

}));