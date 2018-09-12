import React from 'react';
import {mount, configure} from 'enzyme';
import Select from 'react-select';

import Adapter from 'enzyme-adapter-react-16';

const TagPicker = require('../../../../../app/components/Settings/scheduler/tag-picker.jsx').TagPicker;
const Tag = require('../../../../../app/components/Settings/scheduler/tag-picker.jsx').TagValue;

const mockTags = [{name: 'Tag 1', color: 'blue'}];

describe('Tag Picker Tests', () => {
    beforeAll(() => {
        configure({adapter: new Adapter()});
    });

    it('should render valid labels for select dropdown', () => {
        const component = mount(<TagPicker value={mockTags} options={mockTags} />);

        expect(component.find(Select).props().value).toEqual(
            mockTags.map(t => ({
                label: t.name,
                ...t
            }))
        );
        expect(component.find(Select).props().options).toEqual(
            mockTags.map(t => ({
                label: t.name,
                ...t
            }))
        );
    });

    it('tags should call on remove when clicked', () => {
        const onRemove = jest.fn();
        const value = {
            label: 'Tag',
            value: 'tag'
        };

        const component = mount(<Tag value={value} onRemove={onRemove} />);

        component.simulate('click');
        expect(onRemove).toHaveBeenCalledWith(value);
    });

    it('should handle clears', () => {
        const onChange = jest.fn();
        const component = mount(<TagPicker value={mockTags} options={mockTags} onChange={onChange} />);

        component.instance().handleChange(null);
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('should handle adding a tag', () => {
        const onChange = jest.fn();
        const createTag = jest.fn();
        const component = mount(<TagPicker value={[]} options={mockTags} onChange={onChange} createTag={createTag} />);

        const changes = [{label: 'Tag', name: 'Tag', id: 'tag'}];
        component.instance().handleChange(changes);
        expect(onChange).toHaveBeenCalledWith(changes);
        expect(createTag).not.toHaveBeenCalled();
    });

    it("should create a new tag if tag doesn't have a name", () => {
        const onChange = jest.fn();
        const createTag = jest.fn(i => Promise.resolve(i));
        const component = mount(<TagPicker value={[]} options={mockTags} onChange={onChange} createTag={createTag} />);

        const changes = [{label: 'Tag'}];
        return component
            .instance()
            .handleChange(changes)
            .then(() => {
                const newTag = {color: expect.any(String), label: 'Tag', name: 'Tag'};
                expect(createTag).toHaveBeenCalledWith(newTag);
                expect(onChange).toHaveBeenCalledWith([newTag]);
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
});
