jest.unmock('../../../../../app/components/Settings/DialectSelector/DialectSelector.react.js');
jest.unmock('../../../../../app/constants/constants.js');

import DialectSelector from '../../../../../app/components/Settings/DialectSelector/DialectSelector.react.js';
import {DIALECTS} from '../../../../../app/constants/constants.js';
import React from 'react';
import Select from 'react-select';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

describe('Dialog Selector Test', () => {
    beforeAll(() => {
        configure({adapter: new Adapter()});
    });

    it('should verify Dialect Selector created without dialect', () => {
        const updateConnection = function() {};
        const connectionObject = {};

        const selector = mount(
            <DialectSelector connectionObject={connectionObject} updateConnection={updateConnection} />
        );

        // Number of Logos should match number of images
        expect(selector.find(Select).prop('options').length).toEqual(Object.keys(DIALECTS).length);

        // Dialect not selected so should not be found
        expect(selector.find('.Select-option .is-selected').length).toBe(0);
    });

    it('should verify Dialect Selector created with dialect', () => {
        const updateConnection = function() {};
        const connectionObject = {
            dialect: 'mysql'
        };

        const selector = mount(
            <DialectSelector connectionObject={connectionObject} updateConnection={updateConnection} />
        );

        // open selector
        selector.find('.Select-control').simulate('keyDown', {keyCode: 40});

        expect(
            selector
                .find('.Select-option .is-selected')
                .first()
                .text()
        ).toBe(connectionObject.dialect);
    });
});
