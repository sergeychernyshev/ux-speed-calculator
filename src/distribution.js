import lognormal from "distributions-lognormal-pdf";

import { annotationStyles } from "./Chart";

const percentile50color = "#fc8d8d";
const percentile90color = "#8dfc8f";
const percentile95color = "#8da3fc";

// calculate y coordinates based on x values and distribution
const distribution = params => {
  // calculate x coordinates points
  const x = [];
  for (let i = 0; i < params.maxTime.value; i += params.bucketSize.value) {
    x.push(i);
  }

  const dist = lognormal(x, {
    mu: params.mu.value,
    sigma: params.sigma.value
  });

  const distTotal = dist.reduce((total, value) => total + value);

  const totalPopulation = dist.map(value =>
    Math.floor((value / distTotal) * params.volume.value)
  );

  const conversionRateDistribution = x.map(
    time =>
      (params.maxConversionRate.value - params.conversionPovertyLine.value) *
        Math.exp(-time * params.conversionDecay.value) +
      params.conversionPovertyLine.value
  );

  let i = 0;
  const convertedDistribution = totalPopulation.map(value =>
    Math.floor((value * conversionRateDistribution[i++]) / 100)
  );

  const bounceRateDistribution = x.map(time => {
    let bounceRate =
      Math.log10(time * params.bounceTimeCompression.value + 1) *
        params.bounceRateScale.value +
      params.bounceRateShift.value;

    if (bounceRate > 100) {
      bounceRate = 100;
    }

    if (bounceRate < 0) {
      bounceRate = 0;
    }

    return bounceRate;
  });

  i = 0;
  const averageSpeed =
    totalPopulation.reduce(
      (total, amountOfUsers) => total + amountOfUsers * x[i++]
    ) / params.volume.value;

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
    if (!found50 && users > params.volume.value * 0.5) {
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
    if (!found90 && users > params.volume.value * 0.9) {
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
    if (!found95 && users > params.volume.value * 0.95) {
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
    conversionRateDistribution,
    convertedDistribution,
    nonConvertedDistribution,
    bounceRateDistribution,
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

export default distribution;
