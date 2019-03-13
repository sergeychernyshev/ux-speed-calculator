import React, { Component } from "react";
import Plot from "react-plotly.js";

import lognormal from "distributions-lognormal-pdf";

import logo from "./logo.svg";
import "./App.css";

const INITIAL_VOLUME = 100000;
const MAX_TIME = 100; // seconds
const INITIAL_DISPLAY_MAX = 10; // seconds

const INITIAL_MAX_CONVERSION_RATE = 20; // at a theoretical fastest point
const INITIAL_CONVERSION_POVERTY_LINE = 0.3; // doesn't degrade after this

class App extends Component {
  constructor(props) {
    super(props);

    // bucket size on the histogram
    const step = 0.1; // 100ms

    // maximum range of the chart (show all values by default)
    const displayMax = INITIAL_DISPLAY_MAX;

    // calculate x coordinates points
    const x = [];
    for (let i = 0; i < MAX_TIME; i += step) {
      x.push(i);
    }

    // total number of users observed
    const volume = INITIAL_VOLUME;

    // initial parameters for the distribution
    const distParams = {
      x,
      volume,
      mu: 0,
      sigma: 1,
      conversionDecay: 1,
      maxConversionRate: INITIAL_MAX_CONVERSION_RATE,
      conversionPovertyLine: INITIAL_CONVERSION_POVERTY_LINE
    };

    this.state = {
      step,
      displayMax,
      ...distParams,
      ...this.calculateDistribution(distParams)
    };
  }

  // calculate y coordinates based on x values and distribution
  calculateDistribution = ({
    x,
    mu,
    sigma,
    volume,
    conversionDecay,
    maxConversionRate,
    conversionPovertyLine
  }) => {
    const dist = lognormal(x, {
      mu: mu,
      sigma: sigma
    });

    const distTotal = dist.reduce((total, value) => total + value);

    const totalPopulation = dist.map(value =>
      Math.floor((value / distTotal) * volume)
    );

    const conversionRateDistribution = x.map(
      time =>
        (maxConversionRate - conversionPovertyLine) *
          Math.exp(-time * conversionDecay) +
        conversionPovertyLine
    );

    let i = 0;
    const convertedDistribution = totalPopulation.map(value =>
      Math.floor((value * conversionRateDistribution[i++]) / 100)
    );

    i = 0;
    const averageSpeed =
      totalPopulation.reduce((value, total) => total + value * x[i++]) / volume;

    const totalConverted = convertedDistribution.reduce(
      (value, total) => total + value
    );

    i = 0;
    const nonConvertedDistribution = totalPopulation.map(
      value => value - convertedDistribution[i++]
    );

    const totalNonConverted = nonConvertedDistribution.reduce(
      (value, total) => total + value
    );

    const averageConversionRate =
      totalConverted / (totalConverted + totalNonConverted);

    return {
      conversionRateDistribution,
      convertedDistribution,
      nonConvertedDistribution,
      totalConverted,
      totalNonConverted,
      averageConversionRate,
      averageSpeed
    };
  };

  updateDistribution = props => {
    this.setState({
      ...props,
      ...this.calculateDistribution({ ...this.state, ...props })
    });
  };

  changeDisplayMax = e => {
    this.setState({ displayMax: parseFloat(e.target.value) || MAX_TIME });
  };

  render() {
    const {
      x,
      convertedDistribution,
      nonConvertedDistribution,
      conversionRateDistribution,
      maxConversionRate,
      conversionDecay,
      conversionPovertyLine,
      totalConverted,
      averageConversionRate,
      mu,
      sigma,
      volume,
      displayMax
    } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <section>
          <Plot
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
              width: 1000,
              height: 500,
              title: "UX Speed Distribution",
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
              }
            }}
            useResizeHandler
          />
          <div style={{ width: "50%", float: "right" }}>
            <fieldset>
              <legend>Conversion Rate</legend>

              <p>
                Converted Users:{" "}
                <input type="number" value={totalConverted} readOnly />
              </p>
              <p>
                Average Conversion Rate:{" "}
                {parseInt(averageConversionRate * 10000) / 100}%
              </p>

              <p>
                <label>
                  Conversion Decay:{" "}
                  <input
                    type="range"
                    min={0.5}
                    max={5}
                    step={0.01}
                    value={conversionDecay}
                    onChange={e =>
                      this.updateDistribution({
                        conversionDecay: parseFloat(e.target.value)
                      })
                    }
                  />
                </label>
              </p>

              <p>
                <label>
                  Max Conversion:{" "}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.01}
                    value={maxConversionRate}
                    onChange={e =>
                      this.updateDistribution({
                        maxConversionRate: parseFloat(e.target.value)
                      })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    size={6}
                    step={0.01}
                    value={maxConversionRate}
                    onChange={e =>
                      this.updateDistribution({
                        maxConversionRate: parseFloat(e.target.value)
                      })
                    }
                  />
                  %
                </label>
              </p>

              <p>
                <label>
                  Conversion Poverty Line:{" "}
                  <input
                    type="range"
                    min={0}
                    max={maxConversionRate}
                    step={0.01}
                    value={conversionPovertyLine}
                    onChange={e =>
                      this.updateDistribution({
                        conversionPovertyLine: parseFloat(e.target.value)
                      })
                    }
                  />
                  <input
                    type="number"
                    name="conversionPovertyLine"
                    readOnly
                    min={0}
                    size={6}
                    max={maxConversionRate}
                    step={0.01}
                    value={conversionPovertyLine}
                    onChange={e =>
                      this.updateDistribution({
                        conversionPovertyLine: parseFloat(e.target.value)
                      })
                    }
                  />
                  %
                </label>
              </p>
            </fieldset>
          </div>

          <div style={{ width: "50%" }}>
            <fieldset>
              <legend>Speed Distribution</legend>
              <p>
                <label>
                  Number of Users:{" "}
                  <input
                    type="range"
                    name="volume"
                    min={1}
                    max={1000000}
                    step={1}
                    value={volume}
                    onChange={e =>
                      this.updateDistribution({
                        volume: parseFloat(e.target.value)
                      })
                    }
                  />
                  <input
                    type="number"
                    name="volume"
                    min={1}
                    max={1000000}
                    step={1}
                    value={volume}
                    onChange={e =>
                      this.updateDistribution({
                        volume: parseFloat(e.target.value)
                      })
                    }
                  />
                </label>
              </p>
              <p>
                <label>
                  <div>Base Speed (μ)</div>
                  <input
                    type="range"
                    name="mu"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={mu}
                    onChange={e =>
                      this.updateDistribution({
                        mu: parseFloat(e.target.value)
                      })
                    }
                  />
                </label>
              </p>
              <p>
                <label>
                  <div>Variability (σ)</div>
                  <input
                    type="range"
                    name="sigma"
                    min="0.05"
                    max="3"
                    step="0.01"
                    value={sigma}
                    onChange={e =>
                      this.updateDistribution({
                        sigma: parseFloat(e.target.value)
                      })
                    }
                  />
                </label>
              </p>
              <p>
                <label>
                  Display Max:{" "}
                  <input
                    type="number"
                    name="display"
                    min={1}
                    max={MAX_TIME}
                    step={1}
                    value={displayMax}
                    onChange={this.changeDisplayMax}
                  />{" "}
                  seconds
                </label>
              </p>
            </fieldset>
          </div>
        </section>
      </div>
    );
  }
}

export default App;
