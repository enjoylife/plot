import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import {html} from "htl";

export default async function() {
  const athletes = await d3.csv("data/athletes.csv", d3.autoType);

  const makePlot = (selected) =>{
    const plot =  Plot.plot({
      grid: true,
      facet: {
        data: athletes,
        y: "sex"
      },
      marks: [
        Plot.rectY(athletes, Plot.binX({y: "count"}, {x: "weight", fill: (d, i) => {
            return selected.size === 0  ||  selected.has(d) ? d.sex : '#333';
          }})),
        Plot.ruleY([0]),
        Plot.brushX(athletes, {x: "weight"})
      ]
    });
    plot.addEventListener("input", (ev) => {
      console.log('event', ev.detail);
      plot.replaceWith(makePlot(new Set(ev.detail.selected)));
    });
    return plot;
  };

  let plot =  makePlot(new Set([]));
  window.plot = plot;
  return plot;
}
