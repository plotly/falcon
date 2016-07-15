import path from 'path';
import chromedriver from 'chromedriver';
import webdriver from 'selenium-webdriver';
import {expect} from 'chai';
import electronPath from 'electron-prebuilt';
import fetch from 'node-fetch';
import {productName, version} from '../package.json';

import {APP_STATUS,
    DIALECTS, USER_INPUT_FIELDS} from '../app/constants/constants';

// import styles to use for tests
import * as logoStyles
    from '../app/components/Settings/DialectSelector/DialectSelector.css';

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
        const findels = (args) => this.driver.findElements(args);
        const findel = (args) => this.driver.findElement(args);

        // find by helper functions
        const byClass = (args) => webdriver.By.className(args);
        const byId = (args) => webdriver.By.id(args);
        const byCss = (args) => webdriver.By.css(args);
        const byPath = (args) => webdriver.By.xpath(args);

        // grab group of elements
        this.getLogos = () => findels(
            byClass(logoStyles.logo)
        );

        this.getHighlightedLogo = () => findels(
            byClass(logoStyles.logoSelected)
        );

        this.getInputs = () => findels(
            byPath('//input')
        );

        // grab specific element
        this.getLogo = (dialect) => findel(
            byId(`test-logo-${dialect}`)
        );

        this.getInputField = (credential) => findel(
            byId(`test-input-${credential}`)
        );

        this.getConnectBtn = () => findel(
            byId('test-connect-button')
        );

        this.getDatabaseDropdown = () => findel(
            byId('test-database-dropdown')
        );

        this.selectDatabase = (database) => this.driver.findElement(
            webdriver.By.css('.Select-control input')).sendKeys(
                'plotly_datasets' + webdriver.Key.ENTER
            );

        this.getDatabaseSelect = () => findel(
            byCss('.Select-control')
        );

        this.getTables = () => findel(
            byId('test-tables')
        );

        this.getLogs = () => findel(
            byId('test-logs')
        );

        this.getErrorMessage = () => findel(
            byId('test-error-message')
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
            console.log(currentClass);
            while (!currentClass.includes(expectedClass)) {
                currentClass = await this.getClassOf(element);
                console.log(currentClass);
                await delay(500);
            }
        };

        this.connectDialect = async (dialect) => {
            const logo = await this.getLogo(dialect);
            const btn = await this.getConnectBtn();
            await logo.click();

            // click on the evaluated dialect logo
            this.fillInputs(dialect)
            .then(await delay(500))
            .then(await btn.click())
            .then(await this.waitFor(`test-${APP_STATUS.CONNECTED}`, btn));
        };

        this.checkConnection = async () => {
            const disconnected = `test-${APP_STATUS.DISCONNECTED}`;
            const conerror = `test-${APP_STATUS.CON_ERROR}`;
            const btn = await this.getConnectBtn();
            const testClass = await this.getClassOf(btn);
            console.log(testClass);
            return !(testClass.includes(disconnected) ||
                    testClass.includes(conerror));
        };
    };

    const close = async () => {
        await this.driver.quit();
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

            it('should display five SQL database logos',
            async () => {
                const logos = await this.getLogos();

                expect(logos.length).to.equal(5);
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


    describe('-> normal connection UE ', () => {

        before(openApp);

        describe('connecting', () => {
            const testedDialect = DIALECTS.MYSQL;

            it('set state to "connect" when coonecting using correct inputs',
            async () => {
                const expectedClass = `test-${APP_STATUS.CONNECTED}`;
                const logo = await this.getLogo(testedDialect);
                const btn = await this.getConnectBtn();
                await logo.click();

                // click on the evaluated dialect logo
                this.fillInputs(testedDialect)
                .then(await delay(500))
                .then(await btn.click())
                .then(await this.waitFor(expectedClass, btn));

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

            it('should show a log with a new logged item',
            async () => {
                const expectedClass = 'test-4-entries';
                const logs = await this.getLogs();

                const testClass = await this.getClassOf(logs);
                expect(testClass).to.contain(expectedClass);
            });
        });

        describe('selecting a database', () => {
            it('should show a table preview when database is selected',
            async () => {
                const expectedClass = 'test-connected';
                await this.selectDatabase();
                await delay(5000);
                const tables = await this.getTables();
                const testClass = await this.getClassOf(tables);
                expect(testClass).to.contain(expectedClass);
            });

            it('should not show an error',
            async () => {
                const errorMessage = await this.getErrorMessage();

                expect(await errorMessage.getText()).to.equal('');
            });

            it('should show a log with a new logged item',
            async () => {
                const expectedClass = 'test-20-entries';
                const logs = await this.getLogs();

                const testClass = await this.getClassOf(logs);
                expect(testClass).to.contain(expectedClass);
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

            it('should show a log with a new logged item',
            async () => {
                const expectedClass = 'test-22-entries';
                const logs = await this.getLogs();

                const testClass = await this.getClassOf(logs);
                expect(testClass).to.contain(expectedClass);
            });
        });

        after(close);

    });

    describe('-> connection error UE ', () => {

        before(openApp);

        const testedDialect = DIALECTS.MYSQL;

        before(async () => {
            // connect with wrong credentials
            const btn = await this.getConnectBtn();

            this.wrongInputs(testedDialect)
            .then(await delay(1000))
            // click to connect
            .then(await btn.click());
        });

        it('set state to "con_error" when connecting using wrong credentials',
        async () => {
            const expectedClass = `test-${APP_STATUS.CON_ERROR}`;
            const btn = await this.getConnectBtn();

            await this.waitFor(expectedClass, btn);

            const testClass = await this.getClassOf(btn);
            expect(testClass).to.contain(expectedClass);
        });

        it('should have a connection error displayed',
        async() => {
            const errorMessage = await this.getErrorMessage();
            expect(await errorMessage.getText()).to.contain('connect');
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

        it('should show a log with a new logged item',
        async () => {
            const expectedClass = 'test-5-entries';
            const logs = await this.getLogs();

            const testClass = await this.getClassOf(logs);
            expect(testClass).to.contain(expectedClass);
        });

        after(close);

    });

    describe('-> the API ', () => {
        const testedDialect = DIALECTS.MYSQL;

        before(openApp);

        describe('/connect', () => {
            it('if app is "initialized", returns an error and no databases',
            async() => {
                const expectedClass = `test-${APP_STATUS.INITIALIZED}`;
                const btn = await this.getConnectBtn();
                const testClass = await this.getClassOf(btn);
                expect(testClass).to.contain(expectedClass);

                await fetch('http://localhost:5000/connect')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.not.equal(null);
                    expect(json).to.not.have.property('databases');
                    expect(json).to.not.have.property('tables');
                });
                // check app has error message
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.not.equal('');
            });

            it('if app is "connected", returns a databases array and a null ' +
                'error',
            async() => {
                // connect the app
                await this.connectDialect(testedDialect);
                expect(await this.checkConnection()).to.equal(true);

                await fetch('http://localhost:5000/connect')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('databases');
                    expect(json.databases).to.not.equal(null);
                });
                // check app is still connected and no error appeared
                expect(await this.checkConnection()).to.equal(true);
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('/tables', () => {
            it('returns an error and no list of tables if ' +
                'non-existant database was passed; app stays connected',
            async() => {
                await fetch('http://localhost:5000/tables?' +
                    'database=nonexistant')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.not.equal(null);
                    expect(json).to.not.have.property('tables');
                });
                // check app is still connected but an error appeared
                expect(await this.checkConnection()).to.equal(true);
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.not.equal('');
            });

            it('returns no error and a list of tables; app stays connected',
            async() => {
                await fetch('http://localhost:5000/tables?' +
                    'database=plotly_datasets')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('tables');
                    expect(json.tables).to.not.equal(null);
                });
                // check app is still connected but an error appeared
                expect(await this.checkConnection()).to.equal(true);
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('/query', () => {
            it('returns a query error when an invalid query is sent',
            async () => {
                await fetch('http://localhost:5000/query?' +
                    'statement=SELEC * FROM apple_stock_2014')
                .then(res => res.json())
                .then(json => {

                    expect(json).to.have.property('error');
                    expect(json.error).to.not.equal(null);
                    expect(json).to.not.have.property('rows');
                });
                // check app is still connected but an error appeared
                expect(await this.checkConnection()).to.equal(true);
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.not.equal('');
            });

            it('returns no error if a valid query is sent; app stays connected',
            async () => {
                await fetch('http://localhost:5000/query?' +
                    'statement=SELECT * FROM apple_stock_2014')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('rows');
                    expect(json.rows).to.not.equal(null);
                });
                // check app is still connected but an error appeared
                expect(await this.checkConnection()).to.equal(true);
                const errorMessage = await this.getErrorMessage();
                expect(await errorMessage.getText()).to.equal('');
            });
        });

        describe('/disconnect', () => {
            it('returns no error, a null list of databases and tables',
            async () => {
                await fetch('http://localhost:5000/disconnect')
                .then(res => res.json())
                .then(json => {
                    expect(json).to.have.property('error');
                    expect(json.error).to.equal(null);
                    expect(json).to.have.property('databases');
                    expect(json.databases).to.equal(null);
                    expect(json).to.have.property('tables');
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
