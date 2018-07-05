import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

global.document.createRange = function() {
    return {
        setEnd: function() {},
        setStart: function() {},
        getBoundingClientRect: function() {
            return { right: 0 };
        },
        getClientRects: function() {
            return { length: 0 };
        }
    };
};
const CreateModal = require('../../../../../app/components/Settings/scheduler/create-modal.jsx').default;
const CodeMirror = require('react-codemirror2').Controlled;

describe('Create Modal Test', () => {
    beforeAll(() => {
        configure({ adapter: new Adapter() });
    });

    it("should not render the editor if it's closed", () => {
        const component = mount(<CreateModal open={false} />);

        expect(component.find(CodeMirror).get(0)).toBeUndefined();
    });

    it('should render an empty editor if its open', () => {
        const component = mount(<CreateModal open={true} />);

        expect(component.find(CodeMirror).get(0).props.value).toBe('');
    });

    it('should allow you to pass initialCode and initialFilename', () => {
        const component = mount(
            <CreateModal
                open={true}
                initialCode="SELECT * FROM foods"
                initialFilename="filename"
            />
        );
        expect(component.find(CodeMirror).get(0).props.value).toBe(
            'SELECT * FROM foods'
        );
        // TODO: Uncomment onces filename input is suppported
        // expect(component.find('input').get(0).props.value).toBe('filename');
    });

    it('clicking X should call onClickAway', () => {
        const onClickAway = jest.fn();
        const component = mount(
            <CreateModal
                open={true}
                initialCode="SELECT * FROM foods"
                initialFilename="filename"
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
        const onSubmit = jest.fn(() => Promise.resolve());
        const component = mount(
            <CreateModal
                open={true}
                initialCode="SELECT * FROM foods"
                initialFilename="filename"
                onSubmit={onSubmit}
            />
        );
        component
            .find('button')
            .at(1)
            .simulate('click');
        expect(component.state().error).not.toBeNull();
        expect(onSubmit).not.toHaveBeenCalled();

        const intervalType = 60;
        component.setState({ intervalType });
        component
            .find('button')
            .at(1)
            .simulate('click');
        expect(onSubmit).toHaveBeenCalled();
        expect(onSubmit).toHaveBeenCalledWith({
            // Once filename input is supported, this value should be: 'filename',
            filename: expect.any(String),
            query: 'SELECT * FROM foods',
            refreshInterval: intervalType
        });
    });
});
