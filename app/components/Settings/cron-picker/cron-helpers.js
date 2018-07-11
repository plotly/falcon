export function mapHourToCronFormat(hour, amPm) {
    if (hour === 12) {
        if (amPm === 'AM') {
            return 0;
        }
    } else if (amPm === 'PM') {
        return hour + 12;
    }

    return hour;
}

export function getInitialCronMode(query) {
  const { cronInterval, refreshInterval } = query;

  if (cronInterval) {
    if (cronInterval === '* * * * *') {
      return 'MINUTE';
    } else if (cronInterval === '*/5 * * * *') {
      return 'FREQUENTLY';
    } else if (cronInterval.match(/\S+? \* \* \* \*/)) {
      return 'HOURLY';
    } else if (cronInterval.match(/\S+? \S+? \* \* \*/)) {
      return 'DAILY';
    } else if (cronInterval.match(/\S+? \S+? \* \* \S+?/)) {
      return 'WEEKLY';
    } else if (cronInterval.match(/\S+? \S+? \S+? \* \*/)) {
      return 'MONTHLY';
    }
  } else if (refreshInterval) {
    if (refreshInterval <= 60) {
      return 'MINUTE';
    } else if (refreshInterval <= 5 * 60) {
      return 'FREQUENTLY';
    } else if (refreshInterval <= 60 * 60) {
      return 'HOURLY';
    } else if (refreshInterval <= 24 * 60 * 60) {
      return 'DAILY';
    } else if (refreshInterval <= 7 * 24 * 60 * 60) {
      return 'WEEKLY';
    } else if (refreshInterval <= 30 * 24 * 60 * 60) {
      return 'MONTHLY';
    }
  } else {
    return 'FREQUENTLY';
  }
}
