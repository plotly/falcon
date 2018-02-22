jest.unmock('../../../../../app/components/Settings/DialogSelector/DialogSelector.react.js');
import ConnectButton from '../../../../../app/components/Settings/DialogSelector/DialogSelector.react.js';
import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

describe('Dialog Selector Test', () => {

    beforeAll(() => {
        configure({ adapter: new Adapter() });
    });

   //1. Test that the output picks up and matches existing
   //2. Test that the output does not match output
   //3. Test that update connection is being called
});