import path from 'path';
import chromedriver from 'chromedriver';
import webdriver from 'selenium-webdriver';
import {expect} from 'chai';
import electronPath from 'electron-prebuilt';
import fetch from 'node-fetch';
import {productName, version} from '../package.json';
import fs from 'fs';
import fsExtra from 'fs-extra';
import * as settings from '../backend/settings.js';
import {createStoragePath} from '../backend/utils/homeFiles';

// Utils
const delay = time => new Promise(resolve => setTimeout(resolve, time));

const TEST_USER = 'plotly-database-connector';
function saveCredentials() {
    const usersValue = JSON.stringify([{
        'username': TEST_USER,
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
        console.warn(e);
    }
}

// Start e2e
chromedriver.start(); // on port 9515
process.on('exit', chromedriver.stop);

describe('plotly database connector', function Spec() {
    this.timeout(1000 * 60 * 10);

    const initialize = async () => {
        // Open the app
        await delay(1000); // wait chromedriver start time
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

        // Initialize credentials
        clearConnectorFolder();
        saveCredentials();

        // class helpers
        this.findEls = (args) => this.driver.findElements(args);
        this.findEl = (args) => this.driver.findElement(args);
        this.byClass = (args) => webdriver.By.className(args);
        this.byId = (args) => webdriver.By.id(args);
        this.byCss = (args) => webdriver.By.css(args);
        this.byPath = (args) => webdriver.By.xpath(args);
        this.fillInput = (id, value) => (
            this.findEl(this.byId(id))
        ).sendKeys(value);
    }

    before(initialize);

    it('should work', async () => {
        const title = await this.driver.getTitle();

        // Login (credentials are already saved so skip the oauth flow)

        this.fillInput('test-username', TEST_USER);
        (await this.findEl(this.byId('test-login-button'))).click();
        await delay(3000);

        // Fill out SQL Credentials
        [
            ['test-input-username', 'masteruser'],
            ['test-input-host', 'readonly-test-mysql.cwwxgcilxwxw.us-west-2.rds.amazonaws.com'],
            ['test-input-port', '3306'],
            ['test-input-password', 'connecttoplotly'],
            ['test-input-database', 'plotly_datasets']
        ].forEach(setting => {
            this.fillInput(...setting);
        });

        // Connect
        (await this.findEl(this.byId('test-connect-button'))).click();

        // Wait for certificate to be initialized - could take several minutes
        const isInitialized = () => this.findEl(
            this.byId('test-ssl-initialized'));
        let sslIsInitialized = false;
        while(!sslIsInitialized) {
            try {
                sslIsInitialized = Boolean(await isInitialized());
            } catch(e) {}
            await delay(1000);
        }

    });
});
