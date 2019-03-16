import React, { Component } from "react";
import Plot from "react-plotly.js";

import lognormal from "distributions-lognormal-pdf";

import logo from "./logo.svg";
import "./App.css";

const INITIAL_VOLUME = 100000;
const MAX_TIME = 100; // seconds

// maximum range of the chart (show all values by default)
const INITIAL_DISPLAY_MAX = 10; // seconds

const INITIAL_MU = 0.95;
const INITIAL_SIGMA = 0.8;

const INITIAL_MAX_CONVERSION_RATE = 20; // at a theoretical fastest point

const MIN_CONVERSION_DECAY = 0.3;
const INITIAL_CONVERSION_DECAY = 1;

const INITIAL_CONVERSION_POVERTY_LINE = 0.3; // doesn't degrade after this
const INITIAL_AVERAGE_VALUE = 10;

// initial parameters for the distribution
const INITIAL_PARAMS = {
  volume: INITIAL_VOLUME,
  mu: INITIAL_MU,
  sigma: INITIAL_SIGMA,
  conversionDecay: INITIAL_CONVERSION_DECAY,
  averageValue: INITIAL_AVERAGE_VALUE,
  maxConversionRate: INITIAL_MAX_CONVERSION_RATE,
  conversionPovertyLine: INITIAL_CONVERSION_POVERTY_LINE
};

const percentile50color = "#fc8d8d";
const percentile90color = "#8dfc8f";
const percentile95color = "#8da3fc";

const annotationStyles = {
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

const rangeProps = {
  type: "range",
  style: { width: "90%" }
};

const numberProps = {
  type: "number",
  style: { width: "100px" }
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayMax: INITIAL_DISPLAY_MAX,
      ...INITIAL_PARAMS,
      ...this.calculateDistribution(INITIAL_PARAMS)
    };
  }

  resetConfigurations = () => {
    this.setState({
      displayMax: INITIAL_DISPLAY_MAX,
      ...INITIAL_PARAMS,
      ...this.calculateDistribution({ ...this.state, ...INITIAL_PARAMS })
    });
  };

  // calculate y coordinates based on x values and distribution
  calculateDistribution = ({
    mu,
    sigma,
    volume,
    conversionDecay,
    maxConversionRate,
    conversionPovertyLine
  }) => {
    // bucket size on the histogram
    const bucketSize = 0.1; // 100ms

    // calculate x coordinates points
    const x = [];
    for (let i = 0; i < MAX_TIME; i += bucketSize) {
      x.push(i);
    }

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
      totalPopulation.reduce(
        (total, amountOfUsers) => total + amountOfUsers * x[i++]
      ) / volume;

    let percentile50;
    let percentile90;
    let percentile95;

    let found50 = false;
    let found90 = false;
    let found95 = false;

    let users = 0;
    const annotations = [];
    totalPopulation.forEach((amountOfUsers, index) => {
      users += amountOfUsers;
      if (!found50 && users > volume * 0.5) {
        found50 = true;
        percentile50 = x[index - 1];

        console.log(`users @ 50%ile: ${users}`);

        annotations.push({
          x: x[index - 1],
          y: amountOfUsers,
          text: `50%ile: ${Math.round(percentile50 * 1000)}ms`,
          bgcolor: percentile50color,
          ...annotationStyles
        });
      }
      if (!found90 && users > volume * 0.9) {
        found90 = true;
        percentile90 = x[index - 1];

        console.log(`users @ 90%ile: ${users}`);

        annotations.push({
          x: x[index - 1],
          y: amountOfUsers,
          text: `90%ile:  ${Math.round(percentile90 * 1000)}ms`,
          bgcolor: percentile90color,
          ...annotationStyles
        });
      }
      if (!found95 && users > volume * 0.95) {
        found95 = true;
        percentile95 = x[index - 1];

        console.log(`users @ 95%ile: ${users}`);

        annotations.push({
          x: x[index - 1],
          y: amountOfUsers,
          text: `95%ile:  ${Math.round(percentile95 * 1000)}ms`,
          bgcolor: percentile95color,
          ...annotationStyles
        });
      }
    });

    console.log(percentile50, percentile90, percentile95);

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
      x,
      bucketSize,
      conversionRateDistribution,
      convertedDistribution,
      nonConvertedDistribution,
      totalConverted,
      totalNonConverted,
      averageConversionRate,
      averageSpeed,
      annotations,
      percentile50,
      percentile90,
      percentile95
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

  changeAverageValue = e => {
    this.setState({
      averageValue: parseFloat(e.target.value) || INITIAL_AVERAGE_VALUE
    });
  };

  render() {
    const {
      x,
      convertedDistribution,
      nonConvertedDistribution,
      annotations,
      conversionRateDistribution,
      maxConversionRate,
      conversionDecay,
      conversionPovertyLine,
      totalConverted,
      averageConversionRate,
      averageValue,
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
              title: "UX Speed Calculator",
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
              }
            }}
            useResizeHandler
          />

          <div>
            <span style={{ marginRight: "2em" }}>
              Average Conversion Rate:{" "}
              <b>{parseInt(averageConversionRate * 10000) / 100}%</b>
            </span>
            <span style={{ marginRight: "2em" }}>
              Converted Users: <b>{totalConverted}</b>
            </span>
            <span style={{ marginRight: "2em" }}>
              Total Value:{" "}
              <b>
                {parseInt(
                  volume * averageConversionRate * averageValue
                ).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0
                })}
              </b>
            </span>

            <button
              style={{ height: "3em" }}
              onClick={this.resetConfigurations}
            >
              Reset
            </button>
          </div>

          <div style={{ width: "50%", float: "right" }}>
            <fieldset>
              <legend>Conversion Rate</legend>

              <p>
                <div>
                  Average Value of a User: $
                  <input
                    {...numberProps}
                    value={averageValue}
                    onChange={this.changeAverageValue}
                  />
                </div>
                <input
                  {...rangeProps}
                  min={0.01}
                  max={1000}
                  step={0.01}
                  value={averageValue}
                  onChange={this.changeAverageValue}
                />
              </p>

              <p>
                <label>
                  <div>
                    Conversion Decay:{" "}
                    <input
                      {...numberProps}
                      min={MIN_CONVERSION_DECAY}
                      max={5}
                      step={0.01}
                      value={conversionDecay}
                      onChange={e =>
                        this.updateDistribution({
                          conversionDecay: parseFloat(e.target.value)
                        })
                      }
                    />
                  </div>
                  <input
                    style={{ width: "90%" }}
                    type="range"
                    min={MIN_CONVERSION_DECAY}
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
                  <div>
                    Max Conversion:{" "}
                    <input
                      {...numberProps}
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
                  </div>
                  <input
                    {...rangeProps}
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
                </label>
              </p>

              <p>
                <label>
                  <div>
                    Conversion Poverty Line:{" "}
                    <input
                      {...numberProps}
                      name="conversionPovertyLine"
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
                  </div>
                  <input
                    {...rangeProps}
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
                </label>
              </p>
            </fieldset>
          </div>

          <div style={{ width: "50%" }}>
            <fieldset>
              <legend>Speed Distribution</legend>
              <p>
                <label>
                  <div>
                    Number of Users:{" "}
                    <input
                      {...numberProps}
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
                  </div>
                  <input
                    {...rangeProps}
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
                  <div>
                    Base Speed (μ):{" "}
                    <input
                      {...numberProps}
                      name="mu"
                      min="-3"
                      max="3"
                      step="0.01"
                      value={mu}
                      onChange={e =>
                        this.updateDistribution({
                          mu: parseFloat(e.target.value)
                        })
                      }
                    />
                  </div>
                  <input
                    {...rangeProps}
                    name="mu"
                    min="-3"
                    max="3"
                    step="0.01"
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
                  <div>
                    Variability (σ):{" "}
                    <input
                      {...numberProps}
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
                  </div>
                  <input
                    {...rangeProps}
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
                  <div>
                    Display Max:{" "}
                    <input
                      {...numberProps}
                      min={2}
                      max={MAX_TIME}
                      step={1}
                      value={displayMax}
                      onChange={this.changeDisplayMax}
                    />{" "}
                    seconds
                  </div>
                  <input
                    {...rangeProps}
                    name="display"
                    min={2}
                    max={MAX_TIME}
                    step={1}
                    value={displayMax}
                    onChange={this.changeDisplayMax}
                  />
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
