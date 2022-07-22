import { brush as brusher, brushX as brusherX, brushY as brusherY, select, extent as d3Extent } from "d3";
import { create } from "../context.js";
import { identity, maybeTuple } from "../options.js";
import { Mark } from "../plot.js";
import { selectionKey, selectionEquals } from "../selection.js";
import { applyDirectStyles, applyIndirectStyles } from "../style.js";
const defaults = {
    ariaLabel: "brush",
    fill: "#777",
    fillOpacity: 0.3,
    stroke: "#fff"
};
export class Brush extends Mark {
    constructor(data, { x, y, ...options } = {}) {
        super(data, {
            "x": { value: x, scale: "x", optional: true },
            "y": { value: y, scale: "y", optional: true }
        }, options, defaults);
        this.activeElement = null;
    }
    render(index, scales, channels, dimensions, context) {
        const { x, y } = scales;
        const { x: X, y: Y } = channels;
        const { ariaLabel, ariaDescription, ariaHidden, ...options } = this;
        const { marginLeft, width, marginRight, marginTop, height, marginBottom } = dimensions;
        const brush = this;
        const d3Brush = (X && Y ? brusher : X ? brusherX : brusherY)().extent([
            [marginLeft, marginTop],
            [width - marginRight, height - marginBottom]
        ]);
        const brushG = create("svg:g", context)
            .call(applyIndirectStyles, { ariaLabel, ariaDescription, ariaHidden }, dimensions)
            .call(d3Brush)
            .call((g) => g
            .selectAll(".selection")
            .attr("shape-rendering", null) // reset d3-brush
            .call(applyIndirectStyles, options, dimensions)
            .call(applyDirectStyles, options));
        if (context.initialSelected) {
            if (X && Y) {
                const [x0, x1] = d3Extent(context.initialSelected, (i) => X[i]);
                const [y0, y1] = d3Extent(context.initialSelected, (i) => Y[i]);
                brushG.call(d3Brush.move, [
                    [x0, y0],
                    [x1, y1]
                ]);
            }
            else if (X) {
                const [x0, x1] = d3Extent(context.initialSelected, (i) => X[i]);
                brushG.call(d3Brush.move, [x0, x1]);
            }
            else if (Y) {
                const [y0, y1] = d3Extent(context.initialSelected, (i) => Y[i]);
                brushG.call(d3Brush.move, [y0, y1]);
            }
        }
        d3Brush.on("start end brush", function (event) {
            const { type, selection: extent } = event;
            // For faceting, when starting a brush in a new facet, clear the
            // brush and selection on the old facet. In the future, we might
            // allow independent brushes across facets by disabling this?
            if (type === "start" && brush.activeElement !== this) {
                if (brush.activeElement !== null) {
                    select(brush.activeElement).call(event.target.clear, event);
                    brush.activeElement[selectionKey] = null;
                }
                brush.activeElement = this;
            }
            let S = null;
            if (extent) {
                S = index;
                if (X) {
                    let [x0, x1] = Y ? [extent[0][0], extent[1][0]] : extent;
                    if (x.bandwidth)
                        x0 -= x.bandwidth();
                    S = S.filter((i) => x0 <= X[i] && X[i] <= x1);
                }
                if (Y) {
                    let [y0, y1] = X ? [extent[0][1], extent[1][1]] : extent;
                    if (y.bandwidth)
                        y0 -= y.bandwidth();
                    S = S.filter((i) => y0 <= Y[i] && Y[i] <= y1);
                }
            }
            if (!selectionEquals(this[selectionKey], S) || event.type === "end") {
                this[selectionKey] = S;
                this.dispatchEvent(new CustomEvent("input", {
                    bubbles: true,
                    detail: { type: event.type, selected: S }
                }));
            }
        });
        const g = brushG.node();
        g[selectionKey] = null;
        return g;
    }
}
export function brush(data, { x, y, ...options } = {}) {
    [x, y] = maybeTuple(x, y);
    return new Brush(data, { ...options, x, y });
}
export function brushX(data, { x = identity, y, ...options } = {}) {
    return new Brush(data, { ...options, x });
}
export function brushY(data, { y = identity, x, ...options } = {}) {
    return new Brush(data, { ...options, y });
}
