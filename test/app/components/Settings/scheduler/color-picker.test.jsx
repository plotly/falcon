import React from 'react';
import {mount, configure} from 'enzyme';
import {ChromePicker} from 'react-color';

import Adapter from 'enzyme-adapter-react-16';

const ColorPicker = require('../../../../../app/components/Settings/scheduler/color-picker.jsx');

jest.mock('react-click-outside', () => i => i);
describe('Color Picker Tests', () => {
    beforeAll(() => {
        configure({adapter: new Adapter()});
        // workaround `Error: Not implemented: HTMLCanvasElement.prototype.getContext`
        HTMLCanvasElement.prototype.getContext = function() {
            return null;
        };
    });

    it('should only call onClickAway if open', () => {
        const onClickAway = jest.fn();
        const component = mount(<ColorPicker onClickAway={onClickAway} />);

        component.instance().handleClickOutside();
        expect(component.find(ChromePicker).length).toBe(0);
        expect(onClickAway).not.toHaveBeenCalled();

        component.find('.color-box').simulate('click');
        component.update();

        expect(component.find(ChromePicker).length).toBe(1);
        component.instance().handleClickOutside();
        expect(onClickAway).toHaveBeenCalled();
    });
});
