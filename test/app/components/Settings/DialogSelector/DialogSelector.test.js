jest.unmock('../../../../../app/components/Settings/DialogSelector/DialogSelector.react.js');
import ConnectButton from '../../../../../app/components/Settings/DialogSelector/DialogSelector.react.js';
import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

describe('Dialog Selector Test', () => {

    beforeAll(() => {
        configure({ adapter: new Adapter() });
    });

   
});