import React from 'react';
import sinon from 'sinon';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Scheduler, {
    MetaPreviewModal,
    SQL
} from '../../../../../app/components/Settings/scheduler.jsx';
import Modal from '../../../../../app/components/modal.jsx';

const mockQueries = [
    {
        query: 'SELECT * FROM foods;',
        refreshInterval: 5000,
        fid: 'test:1'
    },
    {
        query: 'SELECT color, price FROM foods;',
        refreshInterval: 10000,
        fid: 'test:2'
    }
];

describe('Scheduler Test', () => {
    beforeAll(() => {
        configure({ adapter: new Adapter() });
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
        component.setState({ search: 'color' });

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
        const component = mount(<Scheduler queries={mockQueries} />);

        expect(component.find(Modal).prop('open')).toBe(false);

        // set selected query
        component.setState({ selectedQuery: mockQueries[0] });

        expect(component.find(Modal).prop('open')).toBe(true);
        expect(
            component
                .find(MetaPreviewModal)
                .find(SQL)
                .text()
        ).toBe('SELECT * FROM foods;');

        // clear selected query
        component.setState({ selectedQuery: null });

        expect(component.find(Modal).prop('open')).toBe(false);
    });
});
