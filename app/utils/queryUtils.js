export function mapQueryToDailyCallCount ({ cronInterval, refreshInterval }) {
  if (!cronInterval && !refreshInterval) {
    return 0;
  }

  if (cronInterval) {
    if (cronInterval === '* * * * *') {
        return 1440; // number of minutes in a day
    } else if (cronInterval === '*/5 * * * *') {
        return 288; // number of 5 minute blocks per day
    } else if (cronInterval.match(/\S+? \* \* \* \*/)) {
        return 24; // number of hours in a day
    }

    // could be daily or weekly. Deliberately return same amount either way.
    // Provides worst-case estimate for user.
    return 1;
  }

  // otherwise, fallback to refresh interval
  return Math.floor(1440 / refreshInterval); // seconds per day / scheduling interval in seconds
}