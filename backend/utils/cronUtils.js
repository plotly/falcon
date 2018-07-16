const ONE_MINUTE = 60;
const FIVE_MINUTES = 300;
const ONE_HOUR = 3600;
const ONE_DAY = 86400;

export function mapRefreshToCron (refreshInterval) {
    const now = new Date();

    // try to intelligently select interval
    if (refreshInterval <= ONE_MINUTE) {
        return '* * * * *';
    } else if (refreshInterval <= FIVE_MINUTES) {
        return `${now.getSeconds()} ${calculateOffset(now)}/5 * * * *`;
    } else if (refreshInterval <= ONE_HOUR) {
        return `${now.getMinutes()} * * * *`;
    } else if (refreshInterval <= ONE_DAY) {
        return `${now.getMinutes()} ${now.getHours()} * * *`;
    }
   
    // otherwise, default to once a week
    return `${now.getMinutes()} ${now.getHours()} * * ${now.getDay()}`;
}

function calculateOffset (now) {
    return now.getMinutes() % 5;
}