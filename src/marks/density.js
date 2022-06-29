import {contourDensity, create, geoPath} from "d3";
import {
  identity,
  isTypedArray,
  maybeTuple,
  maybeZ,
  valueof
} from "../options.js";
import {Mark} from "../plot.js";
import {coerceNumbers} from "../scales.js";
import {
  applyFrameAnchor,
  applyDirectStyles,
  applyIndirectStyles,
  applyChannelStyles,
  applyTransform,
  groupZ
} from "../style.js";
import {initializer} from "../transforms/basic.js";

const defaults = {
  ariaLabel: "density",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};

export class Density extends Mark {
  constructor(data, {x, y, z, weight, fill, stroke, ...options} = {}) {
    // If fill or stroke is specified as “density”, then temporarily treat these
    // as a literal color when computing defaults and maybeZ; below, we’ll unset
    // these constant colors back to undefined since they will instead be
    // populated by a channel generated by the initializer.
    const fillDensity = isDensity(fill) && ((fill = "currentColor"), true);
    const strokeDensity =
      isDensity(stroke) && ((stroke = "currentColor"), true);
    super(
      data,
      [
        {name: "x", value: x, scale: "x", optional: true},
        {name: "y", value: y, scale: "y", optional: true},
        {name: "z", value: maybeZ({z, fill, stroke}), optional: true},
        {name: "weight", value: weight, optional: true}
      ],
      densityInitializer(
        {...options, fill, stroke},
        fillDensity,
        strokeDensity
      ),
      defaults
    );
    if (fillDensity) this.fill = undefined;
    if (strokeDensity) this.stroke = undefined;
    this.z = z;
  }
  filter(index) {
    return index; // don’t filter contours constructed by initializer
  }
  render(index, scales, channels, dimensions) {
    const {contours} = channels;
    const path = geoPath();
    return create("svg:g")
      .call(applyIndirectStyles, this, scales, dimensions)
      .call(applyTransform, this, scales)
      .call((g) =>
        g
          .selectAll()
          .data(index)
          .enter()
          .append("path")
          .call(applyDirectStyles, this)
          .call(applyChannelStyles, this, channels)
          .attr("d", (i) => path(contours[i]))
      )
      .node();
  }
}

export function density(data, {x, y, ...options} = {}) {
  [x, y] = maybeTuple(x, y);
  return new Density(data, {...options, x, y});
}

const dropChannels = new Set(["x", "y", "z", "weight"]);

function densityInitializer(options, fillDensity, strokeDensity) {
  const k = 100; // arbitrary scale factor for readability
  let {bandwidth, thresholds} = options;
  bandwidth = bandwidth === undefined ? 20 : +bandwidth;
  thresholds =
    thresholds === undefined
      ? 20
      : typeof thresholds?.[Symbol.iterator] === "function"
      ? coerceNumbers(thresholds)
      : +thresholds;
  return initializer(
    options,
    function (data, facets, channels, scales, dimensions) {
      const X = channels.x
        ? coerceNumbers(
            valueof(channels.x.value, scales[channels.x.scale] || identity)
          )
        : null;
      const Y = channels.y
        ? coerceNumbers(
            valueof(channels.y.value, scales[channels.y.scale] || identity)
          )
        : null;
      const W = channels.weight ? coerceNumbers(channels.weight.value) : null;
      const Z = channels.z?.value;
      const {z} = this;
      const [cx, cy] = applyFrameAnchor(this, dimensions);
      const {width, height} = dimensions;

      // Group any of the input channels according to the first index associated
      // with each z-series or facet. Drop any channels not be needed for
      // rendering after the contours are computed.
      const newChannels = Object.fromEntries(
        Object.entries(channels)
          .filter(([key]) => !dropChannels.has(key))
          .map(([key, channel]) => [key, {...channel, value: []}])
      );

      // If the fill or stroke encodes density, construct new output channels.
      const FD = fillDensity && [];
      const SD = strokeDensity && [];

      const density = contourDensity()
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
            if (max > maxValue) maxValue = max;
          }
        }
        T = Float64Array.from(
          {length: thresholds - 1},
          (_, i) => (maxValue * k * (i + 1)) / thresholds
        );
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
            if (FD) FD.push(t);
            if (SD) SD.push(t);
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
      if (FD) FD.push(0);
      if (SD) SD.push(0);

      return {
        data,
        facets: newFacets,
        channels: {
          ...newChannels,
          ...(FD && {fill: {value: FD, scale: "color"}}),
          ...(SD && {stroke: {value: SD, scale: "color"}}),
          contours: {value: contours}
        }
      };
    }
  );
}

function isDensity(value) {
  return /^density$/i.test(value);
}
