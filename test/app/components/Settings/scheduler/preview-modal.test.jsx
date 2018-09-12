import React from 'react';
import {mount, configure} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

global.document.createRange = function() {
    return {
        setEnd: function() {},
        setStart: function() {},
        getBoundingClientRect: function() {
            return {right: 0};
        },
        getClientRects: function() {
            return {length: 0};
        }
    };
};

const PreviewModal = require('../../../../../app/components/Settings/scheduler/preview-modal.jsx').default;
const TagPicker = require('../../../../../app/components/Settings/scheduler/tag-picker.jsx').default;

describe('Preview Modal Tests', () => {
    beforeAll(() => {
        configure({adapter: new Adapter()});
    });

    beforeEach(() => {
      TagPicker.defaultProps = {
          store: {
              getState: () => {},
              subscribe: () => {},
              dispatch: () => {}
          }
      };
    });

    afterEach(() => {
      TagPicker.defaultProps = null;
    });

    it('should not render the preview if query is falsey', () => {
        const component = mount(<PreviewModal query={null} />);

        expect(component.children().instance()).toBeNull();
    });
    it('should render login button if not logged in, or the user is not the same', () => {
        const component = mount(
            <PreviewModal
                query={{
                    query: 'SELECT * FROM table',
                    fid: 'fid:1',
                    refreshInterval: 60,
                    requestor: 'user1'
                }}
            />
        );

        expect(
            component
                .find('button')
                .at(1)
                .text()
        ).toEqual(expect.stringContaining('Log in'));

        const component2 = mount(
            <PreviewModal
                query={{
                    query: 'SELECT * FROM table',
                    fid: 'fid:1',
                    refreshInterval: 60,
                    requestor: 'user1'
                }}
                currentRequestor="user2"
            />
        );

        expect(
            component2
                .find('button')
                .at(1)
                .text()
        ).toEqual(expect.stringContaining('Switch users'));
    });

    it('should render edit and delete buttons if logged in', () => {
        const onDelete = jest.fn();
        const component = mount(
            <PreviewModal
                query={{
                    query: 'SELECT * FROM table',
                    fid: 'fid:1',
                    refreshInterval: 60,
                    requestor: 'user'
                }}
                currentRequestor="user"
                onDelete={onDelete}
            />
        );

        const editButton = component.find('button').at(1);
        const deleteButton = component.find('button').at(2);

        expect(editButton.text()).toBe('Edit');
        expect(deleteButton.text()).toBe('Delete');

        editButton.simulate('click');
        expect(component.state('editing')).toBe(true);

        deleteButton.simulate('click');
        expect(component.state('confirmedDelete')).toBe(true);
        expect(onDelete).not.toHaveBeenCalled();

        deleteButton.simulate('click');
        expect(onDelete).toHaveBeenCalled();
        expect(component.state('confirmedDelete')).toBe(false);
    });

    it('should reset state on close', () => {
        const component = mount(
            <PreviewModal
                query={{
                    query: 'SELECT * FROM table',
                    fid: 'fid:1',
                    requestor: 'user',
                    cronInterval: '* * * * *'
                }}
                currentRequestor="user"
            />
        );

        const editButton = component.find('button').at(1);
        const deleteButton = component.find('button').at(2);

        editButton.simulate('click');
        expect(component.state('editing')).toBe(true);

        deleteButton.simulate('click');
        expect(component.state('confirmedDelete')).toBe(true);

        component.instance().close();
        expect(component.state('editing')).toBe(false);
        expect(component.state('confirmedDelete')).toBe(false);
    });

    it('should edit button should send correct params', () => {
        const onSave = jest.fn(() => Promise.resolve());
        const component = mount(
            <PreviewModal
                query={{
                    query: 'SELECT * FROM table',
                    fid: 'fid:1',
                    requestor: 'user',
                    cronInterval: '* * * * *'
                }}
                currentRequestor="user"
                onSave={onSave}
            />
        );

        const editButton = component.find('button').at(1);

        // start editing
        editButton.simulate('click');
        // submit
        editButton.simulate('click');

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                fid: 'fid:1',
                requestor: 'user',
                query: 'SELECT * FROM table',
                cronInterval: '* * * * *'
            })
        );
    });
});
