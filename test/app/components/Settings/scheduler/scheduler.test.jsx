import React from 'react';
import sinon from 'sinon';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Scheduler from '../../../../../app/components/Settings/scheduler/scheduler.jsx';
import SQL from '../../../../../app/components/Settings/scheduler/sql.jsx';
import SchedulerPreview from '../../../../../app/components/Settings/scheduler/preview-modal.jsx';
import Modal from '../../../../../app/components/modal.jsx';

const mockQueries = [
    {
        query: 'SELECT * FROM foods;',
        refreshInterval: 5000,
        fid: 'test:1',
        tags: []
    },
    {
        query: 'SELECT color, price FROM foods;',
        refreshInterval: 10000,
        fid: 'test:2',
        tags: ['id:0']
    }
];

describe('Scheduler Test', () => {
    beforeAll(() => {
        configure({adapter: new Adapter()});
    });

    it('should have no rows if not passed any queries', () => {
        const component = mount(<Scheduler queries={[]} />);
        expect(component.instance().getRows().length).toBe(0);
    });

    it('should have correct number of rows when passed queries', () => {
        const component = mount(<Scheduler queries={mockQueries} />);
        expect(component.instance().getRows().length).toBe(2);
    });

    it('should filter rows based on search', () => {
        const component = mount(<Scheduler queries={mockQueries} />);

        // set search to only match one mock query
        component.setState({search: 'color'});

        expect(component.instance().getRows().length).toBe(1);
    });

    it('clicking refresh button calls refreshQueries prop', () => {
        const spy = sinon.spy();
        const component = mount(<Scheduler refreshQueries={spy} />);

        expect(spy.called).toBe(false);

        // click refresh button
        component.find('.refresh-button').simulate('click');

        expect(spy.callCount).toBe(1);
    });

    it('should open and close modal with correct query', () => {
        const component = mount(
            <Scheduler requestor="fake_login" queries={mockQueries} />
        );

        // Preview modal is now only rendered if a `selectedQuery` has been set
        // This simplifies the rerender logic
        expect(component.find(Modal).get(2)).toBeUndefined();

        // set selected query
        component.setState({selectedQuery: mockQueries[0]});

        expect(component.find(Modal).get(2).props.open).toBe(true);

        const modalSqlElements = component.find(SchedulerPreview).find(SQL);

        modalSqlElements.forEach(element => {
            expect(element.text()).toBe('SELECT * FROM foods;');
        });

        // clear selected query
        component.setState({selectedQuery: null});

        expect(component.find(Modal).get(2)).toBeUndefined();
    });

    it('should not create if not logged in', () => {
        const create = jest.fn();
        const update = jest.fn();
        const del = jest.fn();

        // eslint-disable-next-line
        const loggedIn = undefined;
        const component = mount(
            <Scheduler
                requestor={loggedIn}
                queries={mockQueries}
                createScheduledQuery={create}
                updateScheduledQuery={update}
                deleteScheduledQuery={del}
            />
        );
        component.setState({selectedQuery: mockQueries[0]});
        component.instance().createQuery();
        component.instance().handleUpdate();
        component.instance().handleDelete();
        expect(create).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(del).not.toHaveBeenCalled();
    });

    it('should render a create button for dialect not in `SQL_DIALECTS_USING_EDITOR`', () => {
        const refreshQueries = jest.fn();
        const component = mount(
            <Scheduler
                queries={mockQueries}
                dialect="new_dialect"
                refreshQueries={refreshQueries}
            />
        );
        const createButton = component.find('button').at(0);
        expect(createButton.at(0).text()).toEqual(expect.stringContaining('Create'));

        createButton.simulate('click');
        expect(component.state('createModalOpen')).toBe(true);
    });

    it('should render a refresh button to reload queries', () => {
        const refreshQueries = jest.fn();
        const component = mount(
            <Scheduler
                queries={mockQueries}
                dialect="athena"
                refreshQueries={refreshQueries}
            />
        );
        const refreshButton = component.find('button').at(0);
        refreshButton.simulate('click');

        expect(refreshQueries).toHaveBeenCalled();
    });

    it('should open set preview select query to open when row is clicked', () => {
        const component = mount(<Scheduler queries={mockQueries} />);
        const cell = component.find('.react-grid-Cell').first();
        cell.simulate('click');
        expect(component.state('selectedQuery')).toEqual(mockQueries[0]);
        expect(component.find(SchedulerPreview).prop('query')).toEqual(mockQueries[0]);
    });

    describe('Creating Queries', () => {
      it('should schedule a query only if logged in', () => {
        const mockResult = {};
        const createScheduledQuery = jest.fn(() => Promise.resolve(mockResult));
        let component = mount(
          <Scheduler
            queries={mockQueries}
            createScheduledQuery={createScheduledQuery}
          />
        );
        component.instance().createQuery({});
        // since there was no requestor
        expect(createScheduledQuery).not.toHaveBeenCalled();

        component = mount(
          <Scheduler
            queries={mockQueries}
            createScheduledQuery={createScheduledQuery}
            requestor="user"
          />
        );

        return component.instance().createQuery({})
          .then(res => {
            expect(createScheduledQuery).toHaveBeenCalled();
            expect(component.state('createModalOpen')).toBe(false);
            expect(res).toEqual(mockResult);
          });
      });

      it('should throw errors from backend on failure', () => {
        const mockResult = { error: 'Error' };
        const createScheduledQuery = jest.fn(() => Promise.resolve(mockResult));
        const component = mount(
          <Scheduler
            queries={mockQueries}
            createScheduledQuery={createScheduledQuery}
            requestor="user"
          />
        );

        return component.instance().createQuery({})
          .catch(error => expect(error).toBe('Error'));
      });
    });

    describe('Updating Queries', () => {
      it('should update a scheduled query only if logged in', () => {
        const mockResult = {};
        const updateScheduledQuery = jest.fn(() => Promise.resolve(mockResult));
        let component = mount(
          <Scheduler
            queries={mockQueries}
            updateScheduledQuery={updateScheduledQuery}
          />
        );
        component.instance().createQuery({});
        // since there was no requestor
        expect(updateScheduledQuery).not.toHaveBeenCalled();

        component = mount(
          <Scheduler
            queries={mockQueries}
            updateScheduledQuery={updateScheduledQuery}
            requestor="user"
          />
        );

        return component.instance().handleUpdate({})
          .then(res => {
            expect(updateScheduledQuery).toHaveBeenCalled();
            expect(component.state('createModalOpen')).toBe(false);
            expect(res).toEqual(mockResult);
          });
      });

      it('should throw errors from backend on failure', () => {
        const mockResult = { error: 'Error' };
        const updateScheduledQuery = jest.fn(() => Promise.resolve(mockResult));
        const component = mount(
          <Scheduler
            queries={mockQueries}
            updateScheduledQuery={updateScheduledQuery}
            requestor="user"
          />
        );

        return component.instance().handleUpdate({})
          .catch(error => expect(error).toBe('Error'));
      });
    });

    it('Delete Queries', () => {
      const deleteScheduledQuery = jest.fn();
      let component = mount(
        <Scheduler
          queries={mockQueries}
          deleteScheduledQuery={deleteScheduledQuery}
        />
      );

      component = mount(
        <Scheduler
          queries={mockQueries}
          deleteScheduledQuery={deleteScheduledQuery}
          requestor="user"
        />
      );
      component.setState({ selectedQuery: mockQueries[0] });
      component.instance().handleDelete();
      expect(deleteScheduledQuery).toHaveBeenCalled();
      expect(component.state('selectedQuery')).toBeNull();
    });
});
