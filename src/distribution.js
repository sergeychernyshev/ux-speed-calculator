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

  // lognormal distribution
  const dist = lognormal(x, {
    mu: params.mu.value,
    sigma: params.sigma.value
  });

  const distTotal = dist.reduce((total, value) => total + value);

  // total population distribution (over page speed)
  const totalPopulation = dist.map(value =>
    Math.floor((value / distTotal) * params.volume.value)
  );

  // error rate distribution (exponential)
  const errorRateDistribution = x.map(
    time =>
      params.maxErrorRate.value * Math.exp(-time * params.errorRateDecay.value)
  );

  // distribution of users who experienced failure (over page speed)
  const erroredDistribution = totalPopulation.map((value, index) =>
    Math.ceil((value * errorRateDistribution[index]) / 100)
  );

  // bounce rate distribution (logarythmic)
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

  // distribution of bounced users (over page speed)
  const bouncedDistribution = totalPopulation.map((value, index) =>
    Math.ceil(
      ((value - erroredDistribution[index]) * bounceRateDistribution[index]) /
        100
    )
  );

  // distribution of percentage of users who effectively bounced (including errored users)
  const effectiveBounceRateDistribution = totalPopulation.map((value, index) =>
    value
      ? ((erroredDistribution[index] + bouncedDistribution[index]) / value) *
        100
      : 100
  );

  // conversion rate distribution (exponential)
  const conversionRateDistribution = x.map(
    time =>
      (params.maxConversionRate.value - params.conversionPovertyLine.value) *
        Math.exp(-time * params.conversionDecay.value) +
      params.conversionPovertyLine.value
  );

  // distribution of converted users (over page speed)
  const convertedDistribution = totalPopulation.map((value, index) =>
    Math.floor(
      ((value - erroredDistribution[index] - bouncedDistribution[index]) *
        conversionRateDistribution[index]) /
        100
    )
  );

  // distribution of percentage of users who effectively converted (including  errored users)
  const effectiveConversionRateDistribution = totalPopulation.map(
    (value, index) => (value ? (convertedDistribution[index] / value) * 100 : 0)
  );

  // distribution of users who didn't bounce but still didn't convert (over page speed)
  const nonConvertedDistribution = totalPopulation.map(
    (population, index) =>
      population -
      erroredDistribution[index] -
      bouncedDistribution[index] -
      convertedDistribution[index]
  );

  const totalBounced = bouncedDistribution.reduce(
    (value, total) => total + value,
    0
  );

  const totalConverted = convertedDistribution.reduce(
    (value, total) => total + value,
    0
  );

  const totalNonConverted = nonConvertedDistribution.reduce(
    (value, total) => total + value,
    0
  );

  // average speed
  const averageSpeed =
    totalPopulation.reduce(
      (total, amountOfUsers, index) => total + amountOfUsers * x[index]
    ) / params.volume.value;

  const averageConversionRate = totalConverted
    ? totalConverted / (totalConverted + totalNonConverted + totalBounced)
    : 0;

  const averageNonBouncedConversionRate = totalConverted
    ? totalConverted / (totalConverted + totalNonConverted)
    : 0;

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

  return {
    x,
    errorRateDistribution,
    effectiveBounceRateDistribution,
    bounceRateDistribution,
    conversionRateDistribution,
    effectiveConversionRateDistribution,
    convertedDistribution,
    erroredDistribution,
    bouncedDistribution,
    nonConvertedDistribution,
    totalBounced,
    totalConverted,
    totalNonConverted,
    averageConversionRate,
    averageNonBouncedConversionRate,
    averageSpeed,
    annotations,
    percentile50,
    percentile90,
    percentile95
  };
};

export default distribution;
