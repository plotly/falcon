import path from 'path';
import chromedriver from 'chromedriver';
import webdriver from 'selenium-webdriver';
import {expect} from 'chai';
import electronPath from 'electron-prebuilt';
import fetch from 'node-fetch';
import {split} from 'ramda';
import {productName, version} from '../package.json';

import {
    APP_STATUS,
    DIALECTS,
    USER_INPUT_FIELDS
} from '../app/constants/constants';

// import styles to use for tests
import * as logoStyles
    from '../app/components/Settings/DialectSelector/DialectSelector.css';

const BASE_URL = 'localhost:5000/';

const testedDialects = [
    // DIALECTS.REDSHIFT,
    DIALECTS.POSTGRES,
    DIALECTS.MYSQL,
    DIALECTS.MARIADB,
    DIALECTS.MSSQL
];

const CREDENTIALS = {
	'mariadb': {
		'host': process.env.AWS_RDS_MARIADB,
		'port': '3306',
		'username': 'masteruser',
		'password': process.env.PASSWORD_MARIADB
	},
	'mssql': {
		'host': process.env.AWS_RDS_MSSQL,
		'port': '1433',
		'username': 'masteruser',
		'password': process.env.PASSWORD_MSSQL
	},
	'mysql': {
		'host': process.env.AWS_RDS_MYSQL,
		'port': '3306',
		'username': 'masteruser',
		'password': process.env.PASSWORD_MYSQL
	},
	'postgres': {
		'host': process.env.AWS_RDS_POSTGRES,
		'port': '5432',
		'username': 'masteruser',
		'password': process.env.PASSWORD_POSTGRES,
		'database': 'plotly_datasets'
    },
	'redshift': {
		'host': process.env.AWS_RDS_REDSHIFT,
		'port': '5439',
		'username': 'plotly',
		'password': process.env.PASSWORD_REDSHIFT,
		'database': 'plotly_datasets'
	}
};

chromedriver.start(); // on port 9515
process.on('exit', chromedriver.stop);

const delay = time => new Promise(resolve => setTimeout(resolve, time));

describe('plotly database connector', function Spec() {
    this.timeout(20000);

    const openApp = async () => {
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

        // find element(s) helper functions
        const findEls = (args) => this.driver.findElements(args);
        const findEl = (args) => this.driver.findElement(args);

        // find by helper functions
        const byClass = (args) => webdriver.By.className(args);
        const byId = (args) => webdriver.By.id(args);
        const byCss = (args) => webdriver.By.css(args);
        const byPath = (args) => webdriver.By.xpath(args);

        // grab group of elements
        this.getLogos = () => findEls(
            byClass(logoStyles.logo)
        );

        this.getHighlightedLogo = () => findEls(
            byClass(logoStyles.logoSelected)
        );

        this.getInputs = () => findEls(
            byPath('//input')
        );

        this.findDropdowns = () => findEls(
            byCss('.Select-control input'));

        // grab specific element
        this.getLogo = (dialect) => findEl(
            byId(`test-logo-${dialect}`)
        );

        this.getInputField = (credential) => findEl(
            byId(`test-input-${credential}`)
        );

        this.getConnectBtn = () => findEl(
            byId('test-connect-button')
        );

        this.getDatabaseDropdown = () => findEl(
            byId('test-database-dropdown')
        );

        this.getTableDropdown = () => findEl(
            byId('test-table-dropdown')
        );

        this.reactSelectInputValue = (element, value) => element.sendKeys(
                value + webdriver.Key.ENTER
        );

        this.getDatabaseSelect = () => findEl(
            byCss('.Select-control')
        );

        this.getTables = () => findEl(
            byId('test-tables')
        );

        this.getLogs = () => findEl(
            byId('test-logs')
        );

        this.getErrorMessage = () => findEl(
            byId('test-error-message')
        );

        this.addSession = () => findEl(
            byId('test-session-add')
        );

        this.deleteSession = (sessionId) => findEl(
            byId(`test-session-delete-${sessionId}`)
        );

        this.selectSession = (sessionId) => findEl(
            byId(`test-session-id-${sessionId}`)
        );

        this.openSessionManager = () => findEl(
            byId('test-session-open')
        );

        // user inputs
        this.fillInputs = async (testedDialect) => {
            USER_INPUT_FIELDS[testedDialect].forEach(credential => {
                this.getInputField(credential)
                .then(input => {
                    input.sendKeys(CREDENTIALS[testedDialect][credential]);
                });
            });
        };

        this.wrongInputs = async (testedDialect) => {
            USER_INPUT_FIELDS[testedDialect].forEach(credential => {
                this.getInputField(credential)
                .then(input => input.sendKeys('blah'));
            });
        };

        // grab property of element
        this.getClassOf = (element) => element.getAttribute('class');

        this.waitFor = async (expectedClass, element) => {
            let currentClass = await this.getClassOf(element);
            console.log(split('test-', currentClass)[1]);
            while (!currentClass.includes(expectedClass)) {
                currentClass = await this.getClassOf(element);
                console.log(split('test-', currentClass)[1]);
                await delay(500);
            }
        };

        this.connectDialect = async (dialect) => {
            const logo = await this.getLogo(dialect);
            const btn = await this.getConnectBtn();
            await logo.click();

            // click on the evaluated dialect logo
            this.fillInputs(dialect)
            .then(await delay(1500))
            .then(await btn.click())
            .then(await this.waitFor(`test-${APP_STATUS.CONNECTED}`, btn));
        };

        this.checkConnection = async () => {
            const disconnected = `test-${APP_STATUS.DISCONNECTED}`;
            const conerror = `test-${APP_STATUS.CON_ERROR}`;
            const btn = await this.getConnectBtn();
            const testClass = await this.getClassOf(btn);
            console.log(split('test-', testClass)[1]);
            return !(testClass.includes(disconnected) ||
                    testClass.includes(conerror));
        };
        await this.openSessionManager().click();
        await this.addSession().click();
    };

    const close = async () => {
        await this.driver.quit();
    };

    const newSession = async () => {
        await this.addSession().click();
    };

    describe('-> local application ', () => {

        before(openApp);

        describe('upon starting', () => {

            it('should have the correct app title Name and Version',
            async () => {
                const title = await this.driver.getTitle();

                expect(title).to.equal(`${productName} v${version}`);
            });

            it('application has a connection status of INITIALIZED',
            async () => {
                const expectedClass = `test-${APP_STATUS.INITIALIZED}`;
                const btn = await this.getConnectBtn();

                const testClass = await this.getClassOf(btn);
                expect(testClass).to.contain(expectedClass);
            });

            it('should display six SQL database logos',
            async () => {
                const logos = await this.getLogos();

                expect(logos.length).to.equal(6);
            });

            it('should not show an error message',
            async() => {
                const errorMessage = await this.getErrorMessage();

                expect(await errorMessage.getText()).to.equal('');
            });

            it('should not show a database dropdown menu',
            async() => {
                let error;

                try {
                    error = await this.getDatabaseDropdown();
                }
                catch (err) {
                    error = err;
                }

                expect(error.toString()).to.contain('NoSuchElementError');
            });

            it('should not show a preview table',
            async () => {
                let error;

                try {
                    error = await this.getTables();
                }
                catch (err) {
                    error = err;
                }

                expect(error.toString()).to.contain('NoSuchElementError');
            });
        });

        describe('dialect logos', () => {
            const testedDialect = DIALECTS.MARIADB;

            it('should have a single logo highlighted and selected at a time',
            async () => {
                const logo = await this.getLogo(testedDialect);

                logo.click()
                .then(await delay(100));
                const highlightedLogo = await this.getHighlightedLogo();

                expect(await highlightedLogo.length).to.equal(1);
                expect(await logo.getAttribute('id')).to.contain(testedDialect);
                expect(await highlightedLogo[0].getAttribute('id'))
                    .to.contain(testedDialect);
            });

            it('clicking other logo updates that\' dialect\' state to selected',
            async () => {
                const expectedClass = 'test-consistent-state';
                const otherDialect = DIALECTS.POSTGRES;
                const logo = await this.getLogo(otherDialect);

                await logo.click()
                .then(await delay(100));

                const testClass = await this.getClassOf(logo);
                expect(testClass).to.contain(expectedClass);
            });
        });

        describe('user input fields', () => {
            it('should enter text into the input fields and update its value',
            async () => {
                const inputs = await this.getInputs();
                const faketxt = 'this is an input';

                inputs[0].sendKeys(faketxt);

                expect(await inputs[0].getAttribute('value')).to.equal(faketxt);
            });

            it('values should clear if another database dialect is selected',
            async () => {
                const inputs = await this.getInputs();
                const testedDialect = DIALECTS.SQLITE;
                const logo = await this.getLogo(testedDialect);

                logo.click();

                expect(await inputs[0].getAttribute('value')).to.equal('');
            });
        });

        after(close);

    });

/*
    Loop through all dialects starting here, except for SQLITE, which
    requires a very different `connecting` flow. Tests, done manually for now.
    TODO: automate tests for SQLITE
*/

    testedDialects.forEach(dialectUnderTest => {
    describe(`----- ${dialectUnderTest} is being tested now -----`, () => {

    describe('-> normal connection User Exp ', () => {

        before(openApp);

        const testedDialect = dialectUnderTest;

        describe('connecting', () => {

            it('set state to "connect" when coonecting using correct inputs',
            async () => {
                const expectedClass = `test-${APP_STATUS.CONNECTED}`;
                const logo = await this.getLogo(testedDialect);
                const btn = await this.getConnectBtn();
                await logo.click();

                // click on the evaluated dialect logo
                await this.connectDialect(testedDialect);
                expect(await this.getClassOf(btn)).to.contain(expectedClass);
            });

            it('should not show an error message',
            async() => {
                const errorMessage = await this.getErrorMessage();

                expect(await errorMessage.getText()).to.equal('');
            });

            it('should show the database selector after connection',
            async () => {
                const expectedClass = 'test-connected';
                const databaseDropdown = this.getDatabaseDropdown();

                const testClass = await this.getClassOf(databaseDropdown);
                expect(testClass).to.contain(expectedClass);
            });

            it('should not show a table preview',
            async () => {
                let error;

                try {
                    error = await this.getTables();
                }
                catch (err) {
                    error = err;
                }

                expect(error.toString()).to.contain('NoSuchElementError');
            });

        });

        describe('selecting a database and table', () => {
            it('should show a table preview when database is selected',
            async () => {
                const dropDowns = await this.findDropdowns();
                expect(dropDowns.length).to.equal(2);
                const expectedClass = 'test-connected';
                await this.reactSelectInputValue(dropDowns[0], 'plotly_datasets');
                await delay(4000);
                await this.reactSelectInputValue(dropDowns[1], 'ebola_2014');
                await delay(4000);
                const tables = await this.getTables();
                const testClass = await this.getClassOf(tables);
                expect(testClass).to.contain(expectedClass);
            });

            it('should not show an error',
            async () => {
                const errorMessage = await this.getErrorMessage();

                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('disconnecting', () => {
            it('set state to "disconnect" when the disconnect button is pressed',
            async () => {
                const expectedClass = `test-${APP_STATUS.DISCONNECTED}`;
                const btn = await this.getConnectBtn();

                await btn.click()
                .then(await this.waitFor(expectedClass, btn));
                expect(await this.getClassOf(btn)).to.contain(expectedClass);
            });

            it('should not show an error message',
            async() => {
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });

            it('should not show the database selector after disconnection',
            async () => {
                let error;
                try {
                    error = await this.getDatabaseDropdown();
                }
                catch (err) {
                    error = err;
                }
                expect(error.toString()).to.contain('NoSuchElementError');
            });

            it('should not show a table preview',
            async () => {
                let error;
                try {
                    error = await this.getTables();
                }
                catch (err) {
                    error = err;
                }
                expect(error.toString()).to.contain('NoSuchElementError');
            });

        });

        after(close);

    });

    describe('-> connection error User Exp ', () => {

        before(openApp);

        const testedDialect = dialectUnderTest;

        it('set state to "con_error" when connecting using wrong credentials',
        async () => {
            const logo = await this.getLogo(testedDialect);
            const btn = await this.getConnectBtn();
            await logo.click();
            // connect with wrong credentials
            this.wrongInputs(testedDialect)
            .then(await delay(1000))
            // click to connect
            .then(await btn.click());

            const expectedClass = `test-${APP_STATUS.CON_ERROR}`;

            await this.waitFor(expectedClass, btn);

            const testClass = await this.getClassOf(btn);
            expect(testClass).to.contain(expectedClass);
        });

        it('should have a connection error displayed',
        async() => {
            const errorMessage = await this.getErrorMessage();
            expect(await errorMessage.getText()).to.contain('error');
        });

        it('should not show the database selector after connection',
        async () => {
            let error;

            try {
                error = await this.getDatabaseDropdown();
            }
            catch (err) {
                error = err;
            }
            expect(error.toString()).to.contain('NoSuchElementError');
        });

        it('should not show a table preview',
        async () => {
            let error;

            try {
                error = await this.getTables();
            }
            catch (err) {
                error = err;
            }

            expect(error.toString()).to.contain('NoSuchElementError');
        });

        after(close);

    });

    describe.only('-> the API ', () => {

        before(openApp);

        const testedDialect = dialectUnderTest;

        describe('/v1/authenticate', () => {
            it('if app is "initialized", returns an error and no databases',
            async() => {
                const expectedClass = `test-${APP_STATUS.INITIALIZED}`;
                const btn = await this.getConnectBtn();
                const testClass = await this.getClassOf(btn);
                expect(testClass).to.contain(expectedClass);

                await fetch(`http://${BASE_URL}/v1/authenticate`)
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.not.equal(null);
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.not.equal('');
            });

            it('if app is "connected", returns a null error',
            async() => {
                // connect the app
                await this.connectDialect(testedDialect);
                expect(await this.checkConnection()).to.equal(true);

                await fetch(`http://${BASE_URL}/v1/authenticate`)
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                });
                // check app is still connected and no error appeared
                expect(await this.checkConnection()).to.equal(true);
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('/v1/databases', () => {
            it('if app is "connected",' +
                ' returns no error and a list of databases',
            async() => {
                const expectedClass = `test-${APP_STATUS.CONNECTED}`;
                const btn = await this.getConnectBtn();
                const testClass = await this.getClassOf(btn);
                expect(testClass).to.contain(expectedClass);

                await fetch(`http://${BASE_URL}/v1/databases`)
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('databases');
                    expect(json.databases).to.not.equal(null);
                });
                // check app has no error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('/v1/selectdatabase', () => {
            it('if app is "connected", and wrong database entered, returns error',
            async() => {
                await fetch(`http://${BASE_URL}` +
                    '/v1/selectdatabase?database=non-existant')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.have.property('message');
                    expect(json.error).to.not.equal(null);
                    expect(json.error.message).to.not.equal(null);
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.not.equal('');
            });

            it('if correct database is entered, returns no error',
            async() => {
                await fetch(`http://${BASE_URL}` +
                    '/v1/selectdatabase?database=plotly_datasets')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('/v1/tables', () => {
            it('if app is "connected",' +
                ' returns no error and a list of tables',
            async() => {
                const expectedClass = `test-${APP_STATUS.CONNECTED}`;
                const btn = await this.getConnectBtn();
                const testClass = await this.getClassOf(btn);
                expect(testClass).to.contain(expectedClass);

                await fetch(`http://${BASE_URL}/v1/databases`)
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('tables');
                    expect(json.databases).to.not.equal(null);
                });
                // check app has no error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });


        describe('/v1/preview', () => {
            it('if app is "connected", and wrong table entered, returns error',
            async() => {
                await fetch(`http://${BASE_URL}` +
                    '/v1/preview?non-param=non-existant')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.have.property('message');
                    expect(json.error).to.not.equal(null);
                    expect(json.error.message).to.not.equal(null);
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.not.equal('');
            });

            it('if correct table is entered, returns no error',
            async() => {
                await fetch(`http://${BASE_URL}` +
                    '/v1/preview?tables=ebola_2014')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('previews');
                    expect(json.previews).to.not.equal(null);
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('/v1/query', () => {
            it('if app is "connected", and no statement entered, returns error',
            async() => {
                await fetch(`http://${BASE_URL}` +
                    '/v1/query?no-statement=not-a-statement')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.have.property('message');
                    expect(json.error).to.not.equal(null);
                    expect(json.error.message).to.not.equal(null);
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.not.equal('');
            });

            it('if app is "connected", and incrorrect query entered, returns error',
            async() => {
                await fetch(`http://${BASE_URL}` +
                    '/v1/query?statement=not-a-statement')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.have.property('message');
                    expect(json.error).to.not.equal(null);
                    expect(json.error.message).to.not.equal(null);
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.not.equal('');
            });

            it('if correct database is entered, returns no error',
            async() => {
                await fetch(`http://${BASE_URL}` +
                    '/v1/query?statement=SELECT * FROM ebola_2014')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('columnnames');
                    expect(json).to.have.property('ncols');
                    expect(json).to.have.property('nrows');
                    expect(json.columnnames).to.not.equal(null);
                    expect(json.nrows).to.not.equal(null);
                    expect(json.ncols).to.not.equal(null);
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('/v1/sessions', () => {
            it('returns no error, list of sessions',
            async() => {
                await fetch(`http://${BASE_URL}/v1/sessions`)
                .then(res => res.json())
                .then(json => {
                    console.log();
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('sessions');
                    expect(json.sessions).to.not.equal(null);
                });
            });
        });

        describe('/v1/addsession', () => {
            it('returns no error, list of sessions that contains two entries',
            async() => {
                await fetch(`http://${BASE_URL}/v1/addsession`)
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('sessions');
                    expect(json.sessions).to.not.equal(null);
                    expect(json.sessions).to.have.lengthOf(2);
                });
            });
        });

        describe('/v1/deletesession', () => {
            it('returns no error, list of sessions that contains one entry',
            async() => {
                let sessions;
                await fetch(`http://${BASE_URL}/v1/sessions`)
                .then(res => res.json())
                .then(json => {
                    sessions = json.sessions.map((session) => {
                        return parseInt(Object.keys(session)[0], 10);
                    });
                });

                await fetch(
                    `http://${BASE_URL}/v1/deletesession?session=${sessions[1]}`
                )
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('sessions');
                    expect(json.sessions).to.not.equal(null);
                    expect(json.sessions).to.have.lengthOf(1);
                });
            });
        });

        describe('/v1/disconnect', () => {
            it('returns no error, a null list of databases, previews and tables',
            async () => {
                await fetch(`http://${BASE_URL}/v1/disconnect`)
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('databases');
                    expect(json.databases).to.equal(null);
                    expect(json).to.have.property('tables');
                    expect(json.tables).to.equal(null);
                    expect(json).to.have.property('previews');
                    expect(json.tables).to.equal(null);
                });
            });

            it('set the state to "disconnected"',
            async () => {
                const expectedClass = `test-${APP_STATUS.DISCONNECTED}`;
                const btn = await this.getConnectBtn();

                await this.waitFor(expectedClass, btn);

                expect(await this.getClassOf(btn)).to.contain(expectedClass);
            });

            it('should not show an error message',
            async() => {
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });

            it('should not show the database selector after disconnection',
            async () => {
                let error;
                try {
                    error = await this.getDatabaseDropdown();
                }
                catch (err) {
                    error = err;
                }
                expect(error.toString()).to.contain('NoSuchElementError');
            });

            it('should not show a table preview',
            async () => {
                let error;
                try {
                    error = await this.getTables();
                }
                catch (err) {
                    error = err;
                }
                expect(error.toString()).to.contain('NoSuchElementError');
            });
        });

        after(close);

        });
    });
    });

    describe('-> multiple connections ', () => {
        before(openApp);

        let id = 0;
        describe('setting up several connections', () => {
        testedDialects.forEach(dialectUnderTest => {

            describe(`setting up session ${id}`, () => {

                it('should show the database selector after connection',
                async () => {
                    await newSession();

                    await this.connectDialect(dialectUnderTest);

                    const expectedClass = 'test-connected';
                    const databaseDropdown = this.getDatabaseDropdown();

                    const testClass = await this.getClassOf(databaseDropdown);
                    expect(testClass).to.contain(expectedClass);
                });

                it('should show a table preview when database is selected',
                async () => {
                    const dropDowns = await this.findDropdowns();
                    expect(dropDowns.length).to.equal(2);
                    const expectedClass = 'test-connected';
                    await this.reactSelectInputValue(dropDowns[0], 'plotly_datasets');
                    await delay(5000);
                    await this.reactSelectInputValue(dropDowns[1], 'ebola_2014');
                    await delay(4000);
                    const tables = await this.getTables();
                    const testClass = await this.getClassOf(tables);
                    expect(testClass).to.contain(expectedClass);
                });

                it('should not show an error',
                async () => {
                    const errorMessage = await this.getErrorMessage();

                    expect(await errorMessage.getText()).to.equal('');

                });

            });

            id += 1;

        });
        });

        describe('switching between connections', () => {

            describe('switch to the first connection and change the table', () => {
                it('should show the right dialect selected',
                async() => {
                    const testedDialect = testedDialects[0];
                    const otherSession = await this.selectSession(0);
                    await otherSession.click();
                    await delay(500);
                    const highlightedLogo = await this.getHighlightedLogo();

                    expect(await highlightedLogo.length).to.equal(1);
                    expect(await highlightedLogo[0].getAttribute('id'))
                        .to.contain(testedDialect);
                });

                it('change table after switching connection successfully',
                async() => {
                    const dropDowns = await this.findDropdowns();
                    expect(dropDowns.length).to.equal(2);
                    const expectedClass = 'test-connected';
                    await this.reactSelectInputValue(dropDowns[1], 'apple_stock_2014');
                    await delay(4000);
                    const tables = await this.getTables();
                    const testClass = await this.getClassOf(tables);
                    expect(testClass).to.contain(expectedClass);
                });

                it('shows no error',
                async() => {
                    const errorMessage = await this.getErrorMessage();

                    expect(await errorMessage.getText()).to.equal('');
                });
            });
        });


        describe('deleting connections', () => {

            describe(`deleting session 3 for ${testedDialects[id]}`, () => {

                it('should not show session 3 anymore',
                async () => {
                    const deleteButton = await this.deleteSession(3);
                    await deleteButton.click();
                    await delay(500);

                    let error;
                    try {
                        error = await this.selectSession(3);
                    }
                    catch (err) {
                        error = err;
                    }
                    expect(error.toString()).to.contain('NoSuchElementError');

                });

            });

            describe(`deleting session 2 for ${testedDialects[2]}`, () => {

                it('should not show session 2 anymore',
                async () => {
                    const deleteButton = await this.deleteSession(2);
                    await deleteButton.click();
                    await delay(500);

                    let error;
                    try {
                        error = await this.selectSession(2);
                    }
                    catch (err) {
                        error = err;
                    }
                    expect(error.toString()).to.contain('NoSuchElementError');

                });

            });

            describe(`deleting session 1 for ${testedDialects[1]}`, () => {

                it('should not show session 1 anymore',
                async () => {
                    const deleteButton = await this.deleteSession(1);
                    await deleteButton.click();
                    await delay(500);

                    let error;
                    try {
                        error = await this.selectSession(1);
                    }
                    catch (err) {
                        error = err;
                    }
                    expect(error.toString()).to.contain('NoSuchElementError');

                });

            });

            describe(`deleting session 0 for ${testedDialects[0]}`, () => {

                it('should not show session 0 anymore',
                async () => {
                    const deleteButton = await this.deleteSession(0);
                    await deleteButton.click();
                    await delay(500);

                    let error;
                    try {
                        error = await this.selectSession(0);
                    }
                    catch (err) {
                        error = err;
                    }
                    expect(error.toString()).to.contain('NoSuchElementError');

                });

            });

        });

        after(close);

    });

});
