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
