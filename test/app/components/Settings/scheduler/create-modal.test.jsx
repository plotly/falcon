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

const wait = () => new Promise(resolve => setTimeout(resolve, 0));

const CodeMirror = require('react-codemirror2').Controlled;
const CreateModal = require('../../../../../app/components/Settings/scheduler/create-modal.jsx');
const ErrorComponent = require('../../../../../app/components/error.jsx');
const CronPicker = require('../../../../../app/components/Settings/cron-picker/cron-picker.jsx');
const TagPicker = require('../../../../../app/components/Settings/scheduler/tag-picker.jsx').default;

describe('Create Modal Test', () => {
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

    it("should not render the editor if it's closed", () => {
        const component = mount(<CreateModal open={false} />);

        expect(component.find(CodeMirror).get(0)).toBeUndefined();
    });

    it('should render an empty editor if its open', () => {
        const component = mount(<CreateModal open={true} />);

        expect(component.find(CodeMirror).get(0).props.value).toBe('');
    });

    it('should allow you to pass initialCode, dialect and initialName', () => {
        const component = mount(
            <CreateModal open={true} initialCode="SELECT * FROM foods" initialName="queryname" dialect="postgres" />
        );
        expect(component.find(CodeMirror).get(0).props.value).toBe('SELECT * FROM foods');
        expect(component.find(CodeMirror).get(0).props.options.mode).toBe('text/x-pgsql');
        expect(component.find('input').get(0).props.value).toBe('queryname');

        const component2 = mount(<CreateModal open={true} dialect="athena" />);
        expect(component2.find(CodeMirror).get(0).props.options.mode).toBe('text/x-sql');
    });

    it('clicking X should call onClickAway', () => {
        const onClickAway = jest.fn();
        const component = mount(
            <CreateModal
                open={true}
                initialCode="SELECT * FROM foods"
                initialName="query name"
                onClickAway={onClickAway}
            />
        );
        component
            .find('button')
            .first()
            .simulate('click');
        expect(onClickAway).toHaveBeenCalled();
    });

    it('clicking set error state if not all criteria, otherwise call onSubmit', () => {
        const name = 'queryname';
        const onSubmit = jest.fn(() => Promise.resolve());
        const component = mount(<CreateModal open={true} initialCode="" initialName={name} onSubmit={onSubmit} />);
        component
            .find('button')
            .at(1)
            .simulate('click');
        expect(component.state().error).not.toBeNull();
        expect(onSubmit).not.toHaveBeenCalled();

        const cronInterval = '15 * * * *';
        component.setState({code: 'SELECT * FROM foods', interval: cronInterval});
        component
            .find('button')
            .at(1)
            .simulate('click');
        expect(onSubmit).toHaveBeenCalled();
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                // Once filename input is supported, this value should be: 'filename',
                filename: expect.any(String),
                query: 'SELECT * FROM foods',
                cronInterval
            })
        );
        expect(onSubmit).toHaveBeenCalledWith({
            // Once filename input is supported, this value should be: 'filename',
            filename: expect.any(String),
            query: 'SELECT * FROM foods',
            cronInterval,
            name,
            tags: []
        });
    });

    it('should display backend error to user on failures', async () => {
        const onSubmit = jest.fn(() => Promise.reject(new Error('Oops')));
        const component = mount(
            <CreateModal open={true} initialCode="SELECT * FROM foods" initialName="queryname" onSubmit={onSubmit} />
        );

        component
            .find('button')
            .at(1)
            .simulate('click');

        // onSubmit is asynchronous
        await wait();
        expect(component.state('error')).toBe('Oops');
        component.update();
        expect(component.find(ErrorComponent).length).toBe(1);
    });

    it('changing Cron picker should update create modal state', () => {
        const onSubmit = jest.fn(() => Promise.reject(new Error('Oops')));
        const component = mount(
            <CreateModal open={true} initialCode="SELECT * FROM foods" initialName="queryname" onSubmit={onSubmit} />
        );

        expect(component.state('interval')).toBe('*/5 * * * *');

        component
            .find(CronPicker)
            .instance()
            .onModeChange({value: 'MONTHLY'});

        expect(component.state('interval')).toBe('0 0 1 * *');
    });
});
