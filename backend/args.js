import {contains, isEmpty, merge, mergeAll, range, split} from 'ramda';

const optionsBook = {
    headless: {
        defaultValue: false,
        acceptedValues: [false, true]
    },
    large: {
        defaultValue: true,
        acceptedValues: [false, true]
    },
    port: {
        defaultValue: 5000,
        acceptedValues: range(1, 10000)
    },
    clearLog: {
        defaultValue: false,
        acceptedValues: [true, false]
    },
    logpath: {
        defaultValue: `${__dirname}/activity.log`,
        acceptedValues: 'path to logpath w/o quotes (ex: path/to/file.log)'
    },
    configpath: {
        defaultValue: `${__dirname}/config.json`,
        acceptedValues: 'path to config w/o quotes (ex: path/to/config.json)'
    },
    // 0 for errors only, 1 adds warnings, 2 adds info
    logdetail: {
        defaultValue: 1,
        acceptedValues: range(0, 2)
    }
};

const optionsToCheck = ['headless', 'large', 'port', 'clearLog'];

// returns all the default values from options as a dict {key: default, ...}
const defaultOptions = () => {
    return mergeAll(Object.keys(optionsBook).map( (key) => {
        return {[key]: optionsBook[key].defaultValue };
    }));
};

// args are expected to be in ['key=value', 'key1=value2' ...] format
function mergeArgs (args) {

    const userOptions = {};

    const parseArgValue = (arg) => {
        switch (arg[0]) {
            case 'headless':
            case 'large':
                return [arg[0], ((arg[1] === 'true') ? true : false)];
            case 'port':
            case 'logdetail':
                return [arg[0], parseInt(arg[1], 10)];
            default:
                return arg;
        }
    };

    const wrongFormat = (arg) => arg.length !== 2;

    const wrongArg = (arg) => !contains(arg[0], Object.keys(optionsBook));

    const wrongValue = (arg) => {
        const acceptedValues = optionsBook[arg[0]].acceptedValues;
        if (contains(arg[0], optionsToCheck)) {
            return !contains(arg[1], acceptedValues);
        }
        return false;
    };

    const wrongFormatError = (arg) => {
        return `Command Line argument \'${arg}]'' was not of key=value format`;
    };

    const wrongArgError = (arg) => {
        return `Can\'t find \'${arg[0]}\' in the possible options...` +
        `Here are the options: ${Object.keys(optionsBook)}`;
    };

    const wrongValueError = (arg) => {
        if (arg[0] === 'port') {
            return 'Port number must be an integer between 1 and 9999';
        }

        return `Can\'t find \'${arg[1]}\' in the possible values for` +
        `\'${arg[0]}\'...` +
        `Valid values for this key are: ${optionsBook[arg[0]].acceptedValues}`;
    };

    try {
        if (!isEmpty(args) && !contains('--test-type=webdriver', args)) {
            args.forEach( expression => {
                const arg = split('=', expression);
                const parsedArg = parseArgValue(arg);
                if (wrongFormat(parsedArg)) {
                    throw new Error(wrongFormatError(parsedArg));
                } else if (wrongArg(parsedArg)) {
                    throw new Error(wrongArgError(parsedArg));
                } else if (wrongValue(parsedArg)) {
                    throw new Error(wrongValueError(parsedArg));
                } else {
                    userOptions[parsedArg[0]] = parsedArg[1];
                }
            });
        }
    } catch (error) {

        // keep this console log for the user running it from the CL
        /* eslint-disable */
        console.error(error);
        /* eslint-disable */
        process.exit(-1);
    }

    return merge(defaultOptions(), userOptions);
}

// if in development mode, just pass in an empty args object => defaults all
const acceptedArgs = () => {

    let argsToMerge = [];

    // throw new Error(JSON.stringify(process.argv));

    if (process.env.NODE_ENV === 'development') {
        argsToMerge = ['logdetail=2'];
    } else if (!contains('./test/e2e.js', process.argv.slice(2))) {
        /*
         * first arg is the path don't need it,
         * second arg is './' but only when packaged
         */
        argsToMerge = process.argv.filter(arg => {
            return arg !== './'
        }).slice(1);
    }

    return argsToMerge;

};

export const ARGS = mergeArgs(acceptedArgs());
