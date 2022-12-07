import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import {html} from "htl";

export default async function () {
  const data = await d3.csv("data/aapl.csv", d3.autoType);
  const plot = Plot.plot({
    initialSelected: data.slice(300, 800),

    x: {
      round: true,
      label: "Trade volume (log₁₀) →"
    },
    y: {
      grid: true,
      percent: true
    },
    marks: [
      Plot.rectY(data, Plot.binX({y: "proportion"}, {x: (d) => Math.log10(d.Volume)})),
      Plot.ruleY([0]),
      Plot.brushX(data, {x: (d) => Math.log10(d.Volume), initialX: [7.4, 8.0]})
    ]
  });
  const output = html`<output></output>`;
  plot.oninput = () => (output.value = plot.value.length);
  return html`${plot}${output}`;
}
