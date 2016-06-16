import path from 'path';
import chromedriver from 'chromedriver';
import webdriver from 'selenium-webdriver';
import { expect } from 'chai';
import electronPath from 'electron-prebuilt';

import {APP_STATUS_CONSTANTS} from '../app/reducers/connection';
import {ENGINES} from '../app/components/Settings/Constants/SupportedEngines.react';
var credentials = require('./credentials.json');

// import styles to use for tests
import logoStyles from '../app/components/Settings/EngineSelector/EngineSelector.css';
import btnStyles from '../app/components/Settings/ConnectButton/ConnectButton.css';

chromedriver.start(); // on port 9515
process.on('exit', chromedriver.stop);

const delay = time => new Promise(resolve => setTimeout(resolve, time));

describe('main window', function spec() {
    this.timeout(5000);

    before(async () => {
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
    });

    // element grabbing functions
    const getLogos = () => this.driver.findElements(webdriver.By.className(logoStyles.logo));
    const getInputs = () => this.driver.findElements(webdriver.By.xpath('//input'));
    const getBtn = () => this.driver.findElement(webdriver.By.className(btnStyles.buttonPrimary));


    it('should open window', async () => {
        const title = await this.driver.getTitle();
        expect(title).to.equal('Plotly Desktop Connector');
    });

    it('should display five available databases logos', async () => {
        const logos = await getLogos();
        expect(logos.length).to.equal(5);
    });

    it('should display four available user text inputs', async () => {
        const inputs = await getInputs();
        expect(inputs.length).to.equal(4);
    });

    it('should enter text into the first text box', async () => {
        const inputs = await getInputs();
        const textinput = credentials.mysql.username;
        inputs[0].sendKeys(textinput);
        expect(await inputs[0].getAttribute('value')).to.equal(textinput);
    });

    it('should clear input values if a new database dialect is selected', async () => {
        const logos = await getLogos();
        const inputs = await getInputs();
        logos[1].click();
        expect(await inputs[0].getAttribute('value')).to.equal('');
    });

    it('should connect to mysql remote database', async () => {
        const testedDialect = ENGINES.MYSQL;

        const logos = await getLogos();
        const inputs = await getInputs();
        const btn = await getBtn();

        logos.forEach( (logo) => {
            if (testedDialect === logo.getAttribute('value')) {
                logo.click();
                inputs.forEach(input => {
                    const placeholder = input.getAttribute('placeholder');
                    input.sendKeys(credentials.testedDialect[placeholder]);
                });
            }
        });
        
        btn.click();
        expect(await btn.getAttribute('value')).to.equal('');
    });

    after(async () => {
        await this.driver.quit();
    });

});
