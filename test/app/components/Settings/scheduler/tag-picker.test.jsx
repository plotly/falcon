import React from 'react';
import {mount, configure} from 'enzyme';
import Select from 'react-select';

import Adapter from 'enzyme-adapter-react-16';

const TagPicker = require('../../../../../app/components/Settings/scheduler/tag-picker.jsx').TagPicker;
const Tag = require('../../../../../app/components/Settings/scheduler/tag-picker.jsx').TagValue;

const mockTags = [{id: 'id', name: 'Tag 1', color: 'blue'}];

describe('Tag Picker Tests', () => {
    beforeAll(() => {
        configure({adapter: new Adapter()});
    });

    it('should render valid labels for select dropdown', () => {
        const component = mount(<TagPicker value={mockTags} options={mockTags} />);

        const expected = [{color: 'blue', label: 'Tag 1', value: 'id'}];
        expect(component.find(Select).props().value).toEqual(expected);
        expect(component.find(Select).props().options).toEqual(expected);
    });

    it('tags should call on remove when clicked', () => {
        const onRemove = jest.fn();
        const value = {
            label: 'Tag',
            value: 'tag'
        };

        let component = mount(<Tag value={value} onRemove={onRemove} />);

        component.simulate('click');
        expect(onRemove).toHaveBeenCalledWith(value);
        onRemove.mockReset();

        component = mount(<Tag disabled={true} value={value} onRemove={onRemove} />);

        component.simulate('click');
        expect(onRemove).not.toHaveBeenCalled();
    });

    it('should handle adding a tag', () => {
        const onChange = jest.fn();
        const createTag = jest.fn(v => Promise.resolve(v));
        const component = mount(<TagPicker value={[]} options={mockTags} onChange={onChange} createTag={createTag} />);

        const change = {label: 'Tag', id: 'tag'};
        const exp = {label: 'Tag', name: 'Tag', color: expect.any(String), id: 'tag'};
        return component
            .instance()
            .handleCreate(change)
            .then(() => {
                expect(createTag).toHaveBeenCalledWith(exp);
                expect(onChange).toHaveBeenCalledWith([exp]);
            });
    });

    it('should call `onChange` with error if there is one', () => {
        const error = new Error('Mock error');
        const onChange = jest.fn();
        const createTag = jest.fn(() => Promise.reject(error));
        const component = mount(<TagPicker value={[]} options={mockTags} onChange={onChange} createTag={createTag} />);

        const change = {label: 'Tag', id: 'tag'};
        return component
            .instance()
            .handleCreate(change)
            .then(() => {
                expect(onChange).toHaveBeenCalledWith(error);
            });
    });

    it('should render a create new tag option', async () => {
        const onChange = jest.fn();
        const component = mount(<TagPicker value={[]} options={mockTags} onChange={onChange} />);

        const tagName = 'Test';
        component.find('input').simulate('change', {
            target: {
                value: tagName
            }
        });

        const createOption = component.find('.Select-create-option-placeholder');
        expect(createOption.text()).toBe(`Create new tag "${tagName}"`);
    });

    it('should filter selected values on change', () => {
        const onChange = jest.fn();
        const component = mount(<TagPicker value={[mockTags[0]]} options={mockTags} onChange={onChange} />);

        component.instance().onChange(mockTags);
        expect(onChange).toHaveBeenCalledWith(mockTags.slice(1));
    });
});
