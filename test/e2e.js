import path from 'path';
import chromedriver from 'chromedriver';
import webdriver from 'selenium-webdriver';
import { expect } from 'chai';
import electronPath from 'electron-prebuilt';
import homeStyles from '../app/components/Home/Home.css';

chromedriver.start(); // on port 9515
process.on('exit', chromedriver.stop);

const delay = time => new Promise(resolve => setTimeout(resolve, time));
console.log(`app=${path.resolve()}`);
console.log(electronPath);

describe('main window', function spec() {
    this.timeout(5000);
    console.log('aftertimeout');
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

    console.log('afterdescribe');

    it('should open window', async () => {
        console.log('first test');

        const title = await this.driver.getTitle();
        expect(title).to.equal('Plotly Desktop Connector');
    });


    after(async () => {
        await this.driver.quit();
    });

});
