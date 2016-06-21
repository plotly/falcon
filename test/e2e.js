import path from 'path';
import chromedriver from 'chromedriver';
import webdriver from 'selenium-webdriver';
import {expect} from 'chai';
import electronPath from 'electron-prebuilt';

import {APP_STATUS_CONSTANTS, ENGINES, USER_INPUT_FIELDS} from '../app/constants/constants';
import {CREDENTIALS} from './credentials.js';

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

    // TODO: simplify the code for these grabbing functions

    // grab group of elements
    const getLogos = () => this.driver.findElements(
        webdriver.By.className(logoStyles.logo)
    );
    const getInputs = () => this.driver.findElements(
        webdriver.By.xpath('//input')
    );

    // grab specific element
    const getLogo = (dialect) => this.driver.findElement(
        webdriver.By.id(`test-logo-${dialect}`)
    );
    const getInputField = (credential) => this.driver.findElement(
        webdriver.By.id(`test-input-${credential}`)
    );
    const getConnectBtn = () => this.driver.findElement(
        webdriver.By.id('test-connect-button')
    );
    const getDatabaseDropdown = () => this.driver.findElement(
        webdriver.By.id('test-database-dropdown')
    );
    const getDatabaseOptions = () => this.driver.findElement(
        webdriver.By.css('.Select-option')
    );
    const getTables = () => this.driver.findElement(
        webdriver.By.id('test-tables')
    );
    const getLogs = () => this.driver.findElement(
        webdriver.By.id('test-logs')
    );
    const getErrorMessage = () => this.driver.findElement(
        webdriver.By.id('test-error-message')
    );


    // grab property of element
    const getIdOf = (element) => element.getAttribute('id');
    const getClassOf = (element) => element.getAttribute('class');


    // user inputs
    async function fillInputs(testedDialect) {
        // enter credentials into the fields
        USER_INPUT_FIELDS[testedDialect].forEach(credential => {
            getInputField(credential)
            .then(input => input.sendKeys(CREDENTIALS['local'][credential]));
        });
    }
    async function wrongInputs(testedDialect) {
        // enter credentials into the fields
        USER_INPUT_FIELDS[testedDialect].forEach(credential => {
            getInputField(credential)
            .then(input => input.sendKeys('blah'));
        });
    }



    // TODO: replace delay times with a functions that waits for a change


    it('should open window',
    async () => {

        const title = await this.driver.getTitle();

        expect(title).to.equal('Plotly Desktop Connector');

    });

    it('should display five available dialect logos',
    async () => {

        const logos = await getLogos();

        expect(logos.length).to.equal(5);

    });

    it('should enter text into the text box',
    async () => {

        const inputs = await getInputs();
        const textinput = 'this is an input';

        inputs[0].sendKeys(textinput);
        expect(await inputs[0].getAttribute('value')).to.equal(textinput);

    });

    it('should clear input values if a new database dialect is selected',
    async () => {

        const inputs = await getInputs();
        const logos = await getLogos();

        logos[1].click();
        expect(await inputs[0].getAttribute('value')).to.equal('');

    });

    it('should have an initial state of disconnected',
    async () => {

        const expectedClass = `test-${APP_STATUS_CONSTANTS.DISCONNECTED}`;
        const btn = await getConnectBtn();

        const testClass = await getClassOf(btn);
        expect(testClass).to.contain(expectedClass);

    });

    it('should have updated the config with new dialect value',
    async () => {

        const expectedClass = 'test-consistent-state';
        const testedDialect = ENGINES.MYSQL;
        const logo = await getLogo(testedDialect);

        await logo.click()
        .then(await delay(500));
        const testClass = await getClassOf(logo);
        expect(testClass).to.contain(expectedClass);

    });

    it('should connect to the database using the inputs and selected dialect',
    async () => {

        const expectedClass = `test-${APP_STATUS_CONSTANTS.CONNECTED}`;
        const testedDialect = ENGINES.MYSQL;
        const btn = await getConnectBtn();

        // click on the evaluated dialect logo
        fillInputs(testedDialect)
        .then(await delay(500))
        // click to connect
        .then(await btn.click())
        .then(await delay(1000));
        const testClass = await getClassOf(btn);
        expect(testClass).to.contain(expectedClass);

    });

    it('should show the database selector after connection',
    async () => {

        const expectedClass = 'test-connected';
        const databaseDropdown = getDatabaseDropdown();

        const testClass = await getClassOf(databaseDropdown);
        expect(testClass).to.contain(expectedClass);

    });

    it('should show a log with one logged item in the log',
    async () => {

        const expectedClass = 'test-1-entries';
        const logs = await getLogs();

        const testClass = await getClassOf(logs);
        expect(testClass).to.contain(expectedClass);

    });

    it('should not show a table preview',
    async () => {

        expect(await getTables()).to.throw(/NoSuchElementError/);

    });

    it('should show table previews when database is selected from dropdown',
    async () => {

        // TODO: debug how to get options from react-select
        // TODO: debug how to set a value into the react-select item
        const databaseDropdown = await getDatabaseDropdown();
        await databaseDropdown.click()
        .then(await getDatabaseOptions());
        expect(await getDatabaseOptions().getAttribute('value')).to.equal('[]');

    });

    it('should disconnect when the disconnect button is pressed',
    async () => {

        const expectedClass = `test-${APP_STATUS_CONSTANTS.DISCONNECTED}`;
        const btn = await getConnectBtn();

        await btn.click()
        .then(await delay(1000));
        const testClass = await getClassOf(btn);
        expect(testClass).to.contain(expectedClass);

    });

    it('should display an error when wrong credentials are enetered and the ' +
    'button state should be disconnected and the log should not update',
    async () => {

        const expectedClass = `test-${APP_STATUS_CONSTANTS.ERROR}`;
        const testedDialect = ENGINES.MYSQL;
        const btn = await getConnectBtn();

        wrongInputs(testedDialect)
        .then(await delay(500))
        // click to connect
        .then(await btn.click())
        .then(await delay(1000));

        const errorMessage = await getErrorMessage();
        const testClass = await getClassOf(btn);
        expect(testClass.includes(expectedClass)).to.equal(true);
        expect(await errorMessage.getText()).to.have.length.above(0);

    });

    after(async () => {
        await this.driver.quit();
    });

});
