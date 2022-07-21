import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

export default async function() {
  const athletes = await d3.csv("data/athletes.csv", d3.autoType);
  return Plot.plot({
    grid: true,
    facet: {
      data: athletes,
      y: "sex"
    },
    marks: [
      Plot.rectY(athletes, Plot.binX({y: "count"}, {x: "weight", fill: "sex"})),
      Plot.ruleY([0]),
      Plot.brushX(athletes, {x: "weight"})
    ]
  });
}
