jest.unmock('../../../../../app/components/Settings/DialectSelector/DialectSelector.react.js');
jest.unmock('../../../../../app/constants/constants.js');

import DialectSelector from '../../../../../app/components/Settings/DialectSelector/DialectSelector.react.js';
import {DIALECTS} from '../../../../../app/constants/constants.js';
import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

describe('Dialog Selector Test', () => {

    beforeAll(() => {
        configure({ adapter: new Adapter() });
    });

   it('should verify Dialect Selector created without dialect', () => {
        const updateConnection = function() {};
        const connectionObject = {
        };

        const selector = mount(<DialectSelector
            connectionObject={connectionObject}
            updateConnection={updateConnection}
        />);

        // Number of Logos should match number of images
        expect(selector.find('.logo').length).toEqual(Object.keys(DIALECTS).length);

        // Dialect not selected so should not be found
        expect(selector.find('.logoSelected').length).toBe(0);
    });

    it('should verify Dialect Selector created with dialect', () => {
        const updateConnection = function() {};
        const connectionObject = {
            dialect: 'mysql'
        };

        const selector = mount(<DialectSelector
            connectionObject={connectionObject}
            updateConnection={updateConnection}
        />);

        // Dialect not selected so should not be found
        expect(selector.find('.logoSelected').first().key()).toBe(connectionObject.dialect);
    });
});
