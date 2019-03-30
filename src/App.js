import React, { Component } from "react";

import ConfigPanel from "./ConfigPanel";
import Field from "./Field";
import { Chart } from "./Chart";

import logo from "./logo.svg";

import { getInitialParams, updateParam } from "./params";
import distribution from "./distribution";

class App extends Component {
  constructor(props) {
    super(props);

    const params = getInitialParams();

    this.state = { params, ...distribution(params), adjusted: false };
  }

  reset = () => {
    const params = getInitialParams();

    this.setState({
      params,
      ...distribution(params),
      adjusted: false
    });
  };

  /**
   * Returns current values of the parameter
   *
   * @param string name
   * @return Object
   */
  get(name) {
    const param = { ...this.state.params[name] };

    return param;
  }

  /**
   * Sets current value of the parameter
   *
   * @param string name
   * @param {*} value
   */
  set(name, value) {
    const currentParams = { ...this.state.params };

    const params = updateParam(currentParams, name, value);

    const newState = params[name].displayOnly
      ? { params, adjusted: true }
      : {
          params,
          ...distribution(params),
          adjusted: true
        };

    this.setState(newState);
  }

  render() {
    const {
      x,
      convertedDistribution,
      nonConvertedDistribution,
      annotations,
      conversionRateDistribution,
      totalConverted,
      averageConversionRate,
      params,
      adjusted
    } = this.state;

    const chartProps = {
      x,
      convertedDistribution,
      nonConvertedDistribution,
      conversionRateDistribution,
      displayMax: params.displayMax.value,
      annotations
    };

    const panels = [
      {
        label: "Chart Parameters",
        params: ["volume", "displayMax", "bucketSize"]
      },
      {
        label: "Speed Distribution",
        params: ["mu", "sigma"]
      },
      {
        label: "Conversion Rate",
        params: [
          "averageValue",
          "conversionDecay",
          "maxConversionRate",
          "conversionPovertyLine"
        ]
      }
    ];

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
          <div className="output">
            <div>
              Average Conversion Rate:{" "}
              <b>{parseInt(averageConversionRate * 10000) / 100}%</b>
            </div>
            <div>
              Converted Users: <b>{totalConverted}</b>
            </div>
            <div>
              Total Value:{" "}
              <b>
                {parseInt(
                  params.volume.value *
                    averageConversionRate *
                    params.averageValue.value
                ).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0
                })}
              </b>
            </div>

            <div>
              <button onClick={this.reset} disabled={!adjusted}>
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="configuration">
          {panels.map(panel => (
            <ConfigPanel key={panel.label} label={panel.label}>
              {panel.params.map(paramName => (
                <Field
                  key={paramName}
                  onChange={e => this.set(paramName, e.target.value)}
                  {...params[paramName]}
                />
              ))}
            </ConfigPanel>
          ))}
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
