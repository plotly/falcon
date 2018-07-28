const MAX_CRON_MINUTE = 59;

export function mapRefreshToCron (refreshInterval) {
    const now = new Date();

    // try to intelligently select interval
    if (refreshInterval <= (60 * (1 + 5)) / 2) {
        // case: refreshInterval is closer to 1 minute than to 5 minutes
        return '* * * * *';
    } else if (refreshInterval <= (60 * (5 + 60)) / 2) {
        // case: refreshInterval is closer to 5 minutes than to 1 hour
        return `${now.getSeconds()} ${computeMinutes(now)} * * * *`;
    } else if (refreshInterval <= (60 * 60 * (1 + 24)) / 2) {
        // case: refreshInterval is closer to 1 hour than to 1 day
        return `${now.getMinutes()} * * * *`;
    } else if (refreshInterval <= (24 * 60 * 60 * (1 + 7)) / 2) {
        // case: refreshInterval is closer to 1 day than to 1 week
        return `${now.getMinutes()} ${now.getHours()} * * *`;
    }

    // otherwise, default to once a week
    return `${now.getMinutes()} ${now.getHours()} * * ${now.getDay()}`;
}

function computeMinutes (now) {
    let currMinute = now.getMinutes() % 5; // start at 5 min offset
    const minutes = [];

    while (currMinute < MAX_CRON_MINUTE) {
        minutes.push(currMinute);
        currMinute += 5;
    }

    return minutes.join(',');
}