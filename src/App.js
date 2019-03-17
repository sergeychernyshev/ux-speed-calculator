import React, { Component } from "react";

import lognormal from "distributions-lognormal-pdf";

import ConfigPanel from "./ConfigPanel";
import Field from "./Field";
import Chart from "./Chart";

import logo from "./logo.svg";

// bucket size on the histogram
const INITIAL_BUCKET_SIZE = 0.5; // 0.5s

// total number of users
const INITIAL_VOLUME = 100000;

// total time range to calculate distribution for
const MAX_TIME = 100; // seconds

// maximum range of the chart (show all values by default)
const INITIAL_DISPLAY_MAX = 15; // seconds

const INITIAL_MU = 1.5;
const INITIAL_SIGMA = 0.6;

// theoretical max conversion at a fastest point of 0 seconds
const INITIAL_MAX_CONVERSION_RATE = 50;

const MIN_CONVERSION_DECAY = 0.3;
const INITIAL_CONVERSION_DECAY = 0.85;

const INITIAL_CONVERSION_POVERTY_LINE = 1.2; // doesn't degrade after this
const INITIAL_AVERAGE_VALUE = 10;

// initial parameters for the distribution
const INITIAL_PARAMS = {
  bucketSize: INITIAL_BUCKET_SIZE,
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
    bucketSize,
    mu,
    sigma,
    volume,
    conversionDecay,
    maxConversionRate,
    conversionPovertyLine
  }) => {
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

        annotations.push({
          x: x[index - 1],
          y: amountOfUsers,
          text: `95%ile:  ${Math.round(percentile95 * 1000)}ms`,
          bgcolor: percentile95color,
          ...annotationStyles
        });
      }
    });

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
      displayMax,
      bucketSize
    } = this.state;

    const chartProps = {
      x,
      convertedDistribution,
      nonConvertedDistribution,
      conversionRateDistribution,
      displayMax,
      annotations
    };

    return (
      <div>
        <header>
          <h1>
            <img src={logo} className="app-logo" alt="logo" /> UX Speed
            Calculator
          </h1>
        </header>
        <section>
          <Chart {...chartProps} />
          <div>
            <span className="output">
              Average Conversion Rate:{" "}
              <b>{parseInt(averageConversionRate * 10000) / 100}%</b>
            </span>
            <span className="output">
              Converted Users: <b>{totalConverted}</b>
            </span>
            <span className="output">
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

            <button onClick={this.resetConfigurations}>Reset</button>
          </div>
        </section>

        <section>
          <ConfigPanel label="Conversion Rate">
            <Field
              label="Average Value of a Converted User"
              units="$"
              value={averageValue}
              onChange={this.changeAverageValue}
              min={0.01}
              max={1000}
              step={0.01}
            />

            <Field
              label="Conversion Decay"
              value={conversionDecay}
              onChange={e =>
                this.updateDistribution({
                  conversionDecay: parseFloat(e.target.value)
                })
              }
              min={MIN_CONVERSION_DECAY}
              max={5}
              step={0.01}
            />

            <Field
              label="Max Conversion"
              value={maxConversionRate}
              onChange={e => {
                const maxConversionRate = parseFloat(e.target.value);

                this.updateDistribution({
                  maxConversionRate,
                  conversionPovertyLine:
                    conversionPovertyLine > maxConversionRate
                      ? maxConversionRate
                      : conversionPovertyLine
                });
              }}
              units="%"
              min={0}
              max={100}
              step={0.01}
            />

            <Field
              label="Conversion Poverty Line"
              value={conversionPovertyLine}
              onChange={e =>
                this.updateDistribution({
                  conversionPovertyLine: parseFloat(e.target.value)
                })
              }
              units="%"
              min={0}
              max={maxConversionRate}
              step={0.01}
            />
          </ConfigPanel>
          <ConfigPanel label="Speed Distribution">
            <Field
              label="Base Speed (μ)"
              value={mu}
              onChange={e =>
                this.updateDistribution({
                  mu: parseFloat(e.target.value)
                })
              }
              min={-3}
              max={3}
              step={0.01}
            />

            <Field
              label="Variability (σ)"
              value={sigma}
              onChange={e =>
                this.updateDistribution({
                  sigma: parseFloat(e.target.value)
                })
              }
              min={0.05}
              max={3}
              step={0.01}
            />
          </ConfigPanel>
          <ConfigPanel label="Chart Parameters">
            <Field
              label="Number of Users"
              value={volume}
              onChange={e =>
                this.updateDistribution({
                  volume: parseFloat(e.target.value)
                })
              }
              min={10000}
              max={1000000}
              step={1}
            />

            <Field
              label="Display Max"
              value={displayMax}
              onChange={this.changeDisplayMax}
              units="seconds"
              min={2}
              max={MAX_TIME}
              step={1}
            />

            <Field
              label="Bucket size"
              value={bucketSize}
              onChange={e =>
                this.updateDistribution({
                  bucketSize: parseFloat(e.target.value)
                })
              }
              units="seconds"
              min={0.05}
              max={1}
              step={0.05}
            />
          </ConfigPanel>

          <div style={{ clear: "both" }} />
        </section>

        <footer>
          <span>
            2019 &copy;{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.sergeychernyshev.com"
            >
              Sergey Chernyshev
            </a>
          </span>
          <span>
            Logo{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://commons.wikimedia.org/wiki/File:Antu_accessories-calculator.svg"
            >
              image
            </a>{" "}
            by Fabián Alexis
          </span>
        </footer>
      </div>
    );
  }
}

export default App;
