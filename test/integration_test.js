import chromedriver from 'chromedriver';
import webdriver from 'selenium-webdriver';
import electronPath from 'electron';

import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';

import * as settings from '../backend/settings.js';
import {createStoragePath} from '../backend/utils/homeFiles';

const delay = time => new Promise(resolve => setTimeout(resolve, time));

// initialize credentials
clearConnectorFolder();
saveCredentials();

// start chromedriver
chromedriver.start();
process.on('exit', chromedriver.stop);

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('plotly database connector', function() {
    this.timeout(10 * 60 * 1000);

    before(() =>
        // wait for chromedriver to start up
        delay(1 * 1000)
            .then(() => {
                // start electron app
                this.driver = new webdriver.Builder()
                    .usingServer('http://localhost:9515')
                    .withCapabilities({
                        chromeOptions: {
                            binary: electronPath,
                            args: [`app=${path.resolve()}`]
                        }
                    })
                    .forBrowser('electron')
                    .build();

                // wait for electron app to start up
                return delay(3 * 1000);
            })
            // ensure the electron app has loaded
            .then(() => this.driver.wait(webdriver.until.titleContains('Falcon')))
    );

    after(() =>
        Promise.resolve()
            .then(() => this.driver && this.driver.quit())
            .then(() => chromedriver.stop())
    );

    it('should create an SSL certificate', () => {
        let chain = Promise.resolve();

        // Fill out SQL Credentials
        [
            ['test-input-username', 'masteruser'],
            ['test-input-host', 'readonly-test-mysql.cwwxgcilxwxw.us-west-2.rds.amazonaws.com'],
            ['test-input-port', '3306'],
            ['test-input-password', 'connecttoplotly'],
            ['test-input-database', 'plotly_datasets']
        ].forEach(([id, keys]) => {
            chain = chain
                .then(() => this.driver.findElement(webdriver.By.id(id)).sendKeys(keys));
        });

        return chain
            // Connect
            .then(() => this.driver.findElement(webdriver.By.id('test-connect-button')).click())

            // Wait for certificate to be initialized - could take several minutes
            .then(() => this.driver.findElement(webdriver.By.className('test-ssl-tab')).click())
            .then(() => this.driver.wait(webdriver.until.elementLocated(webdriver.By.id('test-ssl-initialized'))));
    });
});

function saveCredentials() {
    const usersValue = JSON.stringify([{
        'username': 'plotly-database-connector',
        'accessToken': '2MiYq1Oive6RRjC6y9D4u7DjlXSs7k'
    }]);
    if (!fs.existsSync(settings.getSetting('STORAGE_PATH'))) {
        createStoragePath();
    }
    fs.writeFileSync(
        settings.getSetting('SETTINGS_PATH'),
        `USERS: ${usersValue}`
    );
}

function clearConnectorFolder() {
    try {
        fsExtra.removeSync(settings.getSetting('STORAGE_PATH'));
    } catch (e) {
        console.warn(e); // eslint-disable-line no-console
    }
}
/* eslint-enable no-invalid-this */
