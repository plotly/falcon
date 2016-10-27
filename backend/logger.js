import bunyan from 'bunyan';
import * as fs from 'fs';
import {merge} from 'ramda';

const timestamp = () => (new Date()).toTimeString();

export class Logger {
    constructor(OPTIONS, mainWindow, CHANNEL) {

        this.logdetail = OPTIONS.logdetail;
        this.headless = OPTIONS.headless;
        this.CHANNEL = CHANNEL;
        this.mainWindow = mainWindow;
        this.logToFile = bunyan.createLogger({
            name: 'plotly-database-connector-logger',
            streams: [
                {
                    level: 'info',
                    path: OPTIONS.logpath
                }
            ]
        });

        if (OPTIONS.clearLog) {
            fs.writeFile(OPTIONS.logpath, '');
        }

        this.log = (logEntry, code = 2) => {
            // default log detail set to 1 (warn level) in ./args.js
            if (code <= this.logdetail) {
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

                if (!this.headless && this.mainWindow) {

                    this.mainWindow.webContents.send(this.CHANNEL, {
                        log: {
                            logEntry,
                            timestamp: timestamp()
                        }
                    });
                }
            }
        };

        this.raiseError = (errorMessage, responseSender) => {
            const errorLog = merge(errorMessage, {timestamp: timestamp()});
            this.log(errorMessage, 0);
            responseSender({error: errorLog}, 400);
        };
    }
}
