import { cross, group, sum, select, sort, InternMap } from "d3";
import { Axes, autoAxisTicks, autoScaleLabels } from "./axes.js";
import { Channel, Channels, channelDomain, valueObject } from "./channel.js";
import { Context, create } from "./context.js";
import { defined } from "./defined.js";
import { Dimensions } from "./dimensions.js";
import { Legends, exposeLegends } from "./legends.js";
import { arrayify, isDomainSort, isScaleOptions, keyword, map, maybeNamed, range, take, where, yes } from "./options.js";
import { maybeProject } from "./projection.js";
import { Scales, ScaleFunctions, autoScaleRange, exposeScales } from "./scales.js";
import { position, registry as scaleRegistry } from "./scales/index.js";
import { applyInlineStyles, maybeClassName, maybeClip, styles } from "./style.js";
import { basic, initializer } from "./transforms/basic.js";
import { maybeInterval } from "./transforms/interval.js";
import { consumeWarnings, warn } from "./warnings.js";
import { selection } from "./selection.js";
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
export function plot(options = {}) {
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
    for (const key of scaleRegistry.keys()) {
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
                inferChannelScale(channels, mark);
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
            if (scaleRegistry.get(key) === position) {
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
        const selection = select(svg);
        // When faceting by both fx and fy, this nested Map allows to look up the
        // non-empty facets and draw the grid lines properly.
        const fxy = fx && fy && (axes.x || axes.y)
            ? group(facets, ({ x }) => x, ({ y }) => y)
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
        select(svg)
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
export class Mark {
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
            ({ facets, data } = this.transform(data, facets)), (data = arrayify(data));
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
export function marks(...marks) {
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
                channel.value = map(channel.value, transform);
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
                    scale = scaleRegistry.has(name) ? name : null;
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
        ? cross(fxDomain, fyDomain).map(([x, y]) => ({ x, y }))
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
    const fxI = fx && new InternMap(fx.domain().map((x, i) => [x, i]));
    const fyI = fy && new InternMap(fy.domain().map((y, i) => [y, i]));
    return sort(facets, (a, b) => (fxI && fxI.get(a.x) - fxI.get(b.x)) || (fyI && fyI.get(a.y) - fyI.get(b.y)));
}
// Returns a (possibly nested) Map of [[key1, index1], [key2, index2], …]
// representing the data indexes associated with each facet.
function facetGroups(data, { fx, fy }) {
    const index = range(data);
    return fx && fy ? facetGroup2(index, fx, fy) : fx ? facetGroup1(index, fx) : facetGroup1(index, fy);
}
function facetGroup1(index, { value: F }) {
    return group(index, (i) => F[i]);
}
function facetGroup2(index, { value: FX }, { value: FY }) {
    return group(index, (i) => FX[i], (i) => FY[i]);
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
    const e = new Uint32Array(sum(index, (d) => d.length));
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