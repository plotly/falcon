import {contains, merge} from 'ramda';

/* ----------MIXPANEL----------*/
var Mixpanel = require('mixpanel');

const isDevEnv = () => {
    return process.env.NODE_ENV === 'development';
};

const isTestRun = () => {
    return (contains('--test-type=webdriver', process.argv.slice(2)));
};

const isTrackingOn = !isTestRun() && !isDevEnv();

const mixpanel = Mixpanel.init('a700ac2c3ec94256f03375835f60a920');

export const trackStartup = () => {
    if (isTrackingOn) {
        mixpanel.track('Connector-Start', {
            platform: process.platform
        });
    }
};

export const trackEvent = (task, parameters = {}) => {
    if (isTrackingOn) {
        mixpanel.track(task, merge(
            {platform: process.platform},
            parameters
        ));
    }
};
/* ----------MIXPANEL----------*/
