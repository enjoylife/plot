import {brush as brusher, brushX as brusherX, brushY as brusherY, create, select} from "d3";
import {identity, maybeTuple, take} from "../options.js";
import {Mark} from "../plot.js";
import {selection, selectionEquals} from "../selection.js";
import {applyIndirectStyles, applyTransform} from "../style.js";

const defaults = {
  ariaLabel: "brush",
  fill: "#777",
  fillOpacity: 0.3,
  stroke: "#fff"
};

export class Brush extends Mark {
  constructor(data, {x, y, ...options} = {}) {
    super(
      data,
      {
        x: {value: x, scale: "x", optional: true},
        y: {value: y, scale: "y", optional: true}
      },
      options,
      defaults
    );
    // TODO make into a channel?
    // TODO validate is tuple of points
    this.initialX = options.initialX;
    this.initialY = options.initialY;
    this.activeElement = null;
  }
  render(index, scales, channels, dimensions, context) {
    const {x: X, y: Y} = channels;
    const {x, y} = scales;
    const {ariaLabel, ariaDescription, ariaHidden, ...options} = this;
    const {marginLeft, width, marginRight, marginTop, height, marginBottom} = dimensions;
    const brush = this;

    const d3Brush = (X && Y ? brusher : X ? brusherX : brusherY)().extent([
      [marginLeft, marginTop],
      [width - marginRight, height - marginBottom]
    ]);

    const brushG = create("svg:g", context)
      .call(applyIndirectStyles, {ariaLabel, ariaDescription, ariaHidden}, scales, dimensions, context)
      .call(d3Brush)
      .call((g) =>
        g
          .selectAll(".selection")
          .attr("shape-rendering", null) // reset d3-brush
          .call(applyIndirectStyles, options, dimensions, context)
          .call(applyTransform, this, scales)
      );

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
    } else if (this.initialY && Y) {
      const [y0, y1] = this.initialY.map(y);
      brushG.call(d3Brush.move, [y0, y1]);
    }

    d3Brush.on("start end brush", function (event) {
      const {type, selection: extent} = event;
      // For faceting, when starting a brush in a new facet, clear the
      // brush and selection on the old facet. In the future, we might
      // allow independent brushes across facets by disabling this?
      if (type === "start" && brush.activeElement !== this) {
        if (brush.activeElement !== null) {
          select(brush.activeElement).call(event.target.clear, event);
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
          if (x.bandwidth) x0 -= x.bandwidth();
          S = S.filter((i) => x0 <= X[i] && X[i] <= x1);
        }
        if (Y) {
          let [y0, y1] = X ? [extent[0][1], extent[1][1]] : extent;
          extentY = [y.invert(y0), y.invert(y1)];

          if (y.bandwidth) y0 -= y.bandwidth();
          S = S.filter((i) => y0 <= Y[i] && Y[i] <= y1);
        }
      }
      if (!selectionEquals(this[selection], S) || event.type === "end") {
        this[selection] = S;
        const selected = S === null ? brush.data : take(brush.data, S);
        this.dispatchEvent(
          new CustomEvent("input", {
            bubbles: true,
            detail: {type: event.type, selected, extentX, extentY}
          })
        );
      }
    });

    const g = brushG.node();
    g[selection] = null;
    return g;
  }
}

export function brush(data, {x, y, ...options} = {}) {
  [x, y] = maybeTuple(x, y);
  return new Brush(data, {...options, x, y});
}

export function brushX(data, {x = identity, ...options} = {}) {
  return new Brush(data, {...options, x});
}

export function brushY(data, {y = identity, ...options} = {}) {
  return new Brush(data, {...options, y});
}
