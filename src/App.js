import React, { Component } from "react";
import Plot from "react-plotly.js";

import lognormal from "distributions-lognormal-pdf";

import logo from "./logo.svg";
import "./App.css";

const INITIAL_VOLUME = 1000000;
const MAX_TIME = 100; // seconds
const INITIAL_DISPLAY_MAX = 10; // seconds

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
      sigma: 1
    };

    const y = this.calculateDistribution(distParams);

    this.state = {
      step,
      displayMax,
      ...distParams,
      y
    };
  }

  // calculate y coordinates based on x values and distribution
  calculateDistribution = ({ x, mu, sigma, volume }) => {
    const dist = lognormal(x, {
      mu: mu,
      sigma: sigma
    });

    const distTotal = dist.reduce((total, value) => total + value);

    return dist.map(value => Math.floor((value / distTotal) * volume));
  };

  changeMu = e => {
    const mu = parseFloat(e.target.value);
    const y = this.calculateDistribution({
      x: this.state.x,
      mu,
      sigma: this.state.sigma,
      volume: this.state.volume
    });

    this.setState({
      mu,
      y
    });
  };

  changeSigma = e => {
    const sigma = parseFloat(e.target.value);
    const y = this.calculateDistribution({
      x: this.state.x,
      mu: this.state.mu,
      sigma,
      volume: this.state.volume
    });

    this.setState({
      sigma,
      y
    });
  };

  changeDisplayMax = e => {
    this.setState({ displayMax: parseFloat(e.target.value) || MAX_TIME });
  };

  changeVolume = e => {
    const volume = parseFloat(e.target.value) || INITIAL_VOLUME;

    const y = this.calculateDistribution({
      x: this.state.x,
      mu: this.state.mu,
      sigma: this.state.sigma,
      volume
    });

    this.setState({
      volume,
      y
    });
  };

  render() {
    const { x, y, mu, sigma, volume, displayMax, step } = this.state;

    // calculating displayed values
    const items = displayMax / step;

    // reduce the number of items to plot
    const xToPlot = x.slice(0, items);

    // reduce the number of items to plot
    const yToPlot = y.slice(0, items);

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <section>
          <Plot
            data={[{ type: "bar", x: xToPlot, y: yToPlot }]}
            layout={{
              width: 1000,
              height: 500,
              title: "UX Speed Distribution"
            }}
            useResizeHandler
          />

          <p>
            <label for="volume">
              <div>Base Speed (μ)</div>
              <input
                type="range"
                name="mu"
                min="-3"
                max="3"
                step="0.1"
                value={mu}
                onChange={this.changeMu}
              />
            </label>
          </p>
          <p>
            <label for="volume">
              <div>Variability (σ)</div>
              <input
                type="range"
                name="sigma"
                min="0.05"
                max="3"
                step="0.01"
                value={sigma}
                onChange={this.changeSigma}
              />
            </label>
          </p>
          <p>
            <label for="volume">
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
          <p>
            Volume:{" "}
            <input
              type="number"
              name="volume"
              min={1}
              step={1}
              value={volume}
              onChange={this.changeVolume}
            />
          </p>
        </section>
      </div>
    );
  }
}

export default App;
