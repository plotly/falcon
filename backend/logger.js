import bunyan from 'bunyan';
import {createStoragePath} from './utils/homeFiles';
import {getSetting} from './settings';

// TODO - Set max size of the log file
export class Logger {
    constructor() {
        createStoragePath();
        let streams;
        if (getSetting('LOG_TO_STDOUT')) {
            streams = [{
                level: 'info',
                stream: process.stdout
            }];
        } else {
            streams = [{
                level: 'info',
                path: getSetting('LOG_PATH')
            }];
        }

        this.logToFile = bunyan.createLogger({
            name: 'plotly-database-connector-logger',
            streams
        });

        this.log = (logEntry, code = 2) => {
            switch (code) {
                case 0:
                    this.logToFile.error(logEntry);
                    break;
                case 1:
                    this.logToFile.warn(logEntry);
                    break;
                case 2:
                    this.logToFile.info(logEntry);
                    break;
                default:
                    this.logToFile.info(logEntry);
            }
        };

    }
}

export default new Logger();
