import React from "react";
import Plot from "react-plotly.js";

const ACTIVE_COLOR = "rgb(31, 119, 180)";
const CONVERSION_COLOR = "#60e24f";
const BOUNCED_COLOR = "silver";
const ERRORED_COLOR = "red";
const POPULATION_COLOR = "black";

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
  totalPopulation,
  erroredDistribution,
  bouncedDistribution,
  convertedDistribution,
  nonConvertedDistribution,
  errorRateDistribution,
  bounceRateDistribution,
  effectiveBounceRateDistribution,
  conversionRateDistribution,
  effectiveConversionRateDistribution,
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
          color: CONVERSION_COLOR
        },
        x,
        y: convertedDistribution
      },
      {
        type: "bar",
        name: "non-converted",
        marker: {
          color: ACTIVE_COLOR
        },
        x,
        y: nonConvertedDistribution
      },
      {
        type: "bar",
        name: "bounced",
        marker: {
          color: BOUNCED_COLOR
        },
        x,
        y: bouncedDistribution
      },
      {
        type: "bar",
        name: "failed",
        marker: {
          color: ERRORED_COLOR
        },
        x,
        y: erroredDistribution
      },
      {
        type: "line",
        name: "total population",
        marker: {
          color: POPULATION_COLOR
        },
        x,
        y: totalPopulation,
        yaxis: "y"
      },

      {
        type: "line",
        name: "theoretical conv. rate",
        marker: {
          color: CONVERSION_COLOR
        },
        x,
        y: conversionRateDistribution,
        yaxis: "y2"
      },
      {
        type: "line",
        name: "effective conv. rate",
        marker: {
          color: CONVERSION_COLOR
        },
        x,
        y: effectiveConversionRateDistribution,
        yaxis: "y2"
      },
      {
        type: "line",
        name: "failure rate",
        marker: {
          color: ERRORED_COLOR
        },
        x,
        y: errorRateDistribution,
        yaxis: "y2"
      },
      {
        type: "line",
        name: "theoretical bounce rate",
        marker: {
          color: BOUNCED_COLOR
        },
        x,
        y: bounceRateDistribution,
        yaxis: "y2"
      },
      {
        type: "line",
        name: "effective bounce rate",
        marker: {
          color: BOUNCED_COLOR
        },
        x,
        y: effectiveBounceRateDistribution,
        yaxis: "y2"
      }
    ]}
    layout={{
      barmode: "stack",
      annotations,
      yaxis: {
        title: "Number of users",
        side: "right",
        rangemode: "nonnegative"
      },
      yaxis2: {
        title: "Conversion rate, Bounce rate, Error rate",
        side: "left",
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
