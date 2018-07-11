export function mapRefreshToCron (refreshInterval) {
  const now = new Date();

  switch (refreshInterval) {
    case 60:
        // every minute
        return '* * * * *';
    case 300:
        // every 5 minutes
        return '*/5 * * * *';
    case 3600:
        // every hour
        return `${now.getMinutes()} * * * *`;
    case 86400:
        // every day
        return `${now.getMinutes()} ${now.getHours()} * * *`;
    default:
        // every week
        return `${now.getMinutes()} ${now.getHours()} * * ${now.getDay()}`;
  }
}