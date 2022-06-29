import * as Plot from "@observablehq/plot";

export default async function () {
  const numbers = [
    170.16, 172.53, 172.54, 173.44, 174.35, 174.55, 173.16, 174.59, 176.18,
    177.9, 176.15, 179.37, 178.61, 177.3, 177.3, 177.25, 174.51, 172.0, 170.16,
    165.53, 166.87, 167.17, 166.0, 159.1, 154.83, 163.09, 160.29, 157.07, 158.5,
    161.95, 163.04, 169.79, 172.36, 172.05, 172.83, 171.8, 173.67, 176.35,
    179.1, 179.26
  ];
  return Plot.rectY(numbers, Plot.binX()).plot();
}
