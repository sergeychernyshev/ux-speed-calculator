import React from "react";
import Plot from "react-plotly.js";

export const annotationStyles = {
  font: {
    size: 14,
    weight: "bold",
    color: "black"
  },
  arrowcolor: "black",
  ax: 30,
  ay: -30,
  bordercolor: "black",
  borderwidth: 1,
  borderpad: 4,
  opacity: 0.8
};

export const Chart = ({
  x,
  convertedDistribution,
  nonConvertedDistribution,
  conversionRateDistribution,
  displayMax,
  annotations
}) => (
  <Plot
    className="chart"
    useResizeHandler
    data={[
      {
        type: "bar",
        name: "converted",
        marker: {
          color: "rgb(255, 127, 14)"
        },
        x,
        y: convertedDistribution
      },
      {
        type: "bar",
        name: "non-converted",
        marker: {
          color: "rgb(31, 119, 180)"
        },
        x,
        y: nonConvertedDistribution
      },
      {
        type: "line",
        name: "conv. rate",
        marker: {
          color: "rgb(255, 127, 14)"
        },
        x,
        y: conversionRateDistribution,
        yaxis: "y2"
      }
    ]}
    layout={{
      barmode: "stack",
      annotations,
      yaxis: {
        title: "Number of users",
        side: "left",
        rangemode: "nonnegative"
      },
      yaxis2: {
        title: "Conversion rate",
        side: "right",
        overlaying: "y",
        showgrid: false,
        rangemode: "nonnegative",
        min: 0
      },
      xaxis: {
        rangemode: "nonnegative",
        range: [0, displayMax]
      },
      margin: {
        b: 40,
        t: 20
      }
    }}
  />
);
