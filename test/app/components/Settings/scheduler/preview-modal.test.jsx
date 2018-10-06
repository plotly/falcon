import React from 'react';
import {mount, configure} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import {wait} from '../../../utils';

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

const PreviewModal = require('../../../../../app/components/Settings/scheduler/modals/preview-modal.jsx').default;
const TagPicker = require('../../../../../app/components/Settings/scheduler/pickers/tag-picker').default;
const ExecutionDetails = require(
  '../../../../../app/components/Settings/scheduler/presentational/execution-details.jsx'
);
const IndividualCallCount = require(
  '../../../../../app/components/Settings/scheduler/presentational/api-call-counts.jsx'
).IndividualCallCount;

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

    it('should save query when refresh button is clicked', async () => {
        const onSave = jest.fn(() => Promise.resolve());
        const query = {
            query: 'SELECT * FROM table',
            fid: 'fid:1',
            requestor: 'user',
            cronInterval: '* * * * *'
        };

        const component = mount(<PreviewModal query={query} currentRequestor="user" onSave={onSave} />);

        const refreshButton = component.find('.refresh-button').at(0);

        // start editing
        refreshButton.simulate('click');
        component.update();
        expect(refreshButton.text()).toBe('are you sure?');
        // submit
        refreshButton.simulate('click');

        expect(refreshButton.text()).toBe('saving...');
        await wait();
        expect(refreshButton.text()).toBe('run now');
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining(query));
    });

    it('should set error when saving fails', async () => {
        const onSave = jest.fn(() => Promise.reject(new Error('Mock error')));
        const query = {
            query: 'SELECT * FROM table',
            fid: 'fid:1',
            requestor: 'user',
            cronInterval: '* * * * *'
        };

        const component = mount(<PreviewModal query={query} currentRequestor="user" onSave={onSave} />);

        const refreshButton = component.find('.refresh-button').at(0);

        refreshButton.simulate('click');
        refreshButton.simulate('click');

        await wait();
        expect(component.state('error')).toBe('Mock error');

        component.setState({error: null});

        const editButton = component.find('button').at(1);

        editButton.simulate('click');
        editButton.simulate('click');

        await wait();
        expect(component.state('error')).toBe('Mock error');
    });

    it('should render lastExectution correctly', () => {
        const tags = [{id: 'tag:0', name: 'Tag 0', color: '#000000'}];
        const query = {
            query: 'SELECT * FROM table',
            fid: 'fid:1',
            refreshInterval: 60,
            requestor: 'user1',
            lastExecution: {
                status: 'ok',
                rowCount: 100,
                duration: 3000,
                startedAt: 1536941543470,
                completedAt: 1536941547470
            },
            tags
        };

        let component = mount(<PreviewModal tags={tags} query={query} currentRequestor="user" />);

        expect(() => mount(<PreviewModal query={query} currentRequestor="user" />)).not.toThrow();
        expect(component.find(ExecutionDetails).text()).toBe('100 rows in 50 minutes');
        expect(
            component
                .find(ExecutionDetails)
                .find('span')
                .last()
                .prop('data-tip')
        ).toMatch(/completed execution(.*):12/);

        query.lastExecution.duration = 1;
        component = mount(<PreviewModal tags={tags} query={query} currentRequestor="user" />);
        expect(
            component
                .find(ExecutionDetails)
                .find('span')
                .last()
                .prop('data-tip')
        ).toBe('');
    });

    it('should correctly render individual call counts', () => {
      const query = {
          query: 'SELECT * FROM table',
          fid: 'fid:1',
          cronInterval: '* * * * *',
          requestor: 'user1'
      };

      let component = mount(<PreviewModal query={query} currentRequestor="user" />);
      expect(component.find(IndividualCallCount).text()).toBe('1,440 API calls per day');

      query.cronInterval = '0 0 * * *';
      component = mount(<PreviewModal query={query} currentRequestor="user" />);
      expect(component.find(IndividualCallCount).text()).toBe('1 API call per day');
    });
});
