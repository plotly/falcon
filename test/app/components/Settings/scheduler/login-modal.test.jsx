import React from 'react';
import {mount, configure} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

const LoginModal = require('../../../../../app/components/Settings/scheduler/login-modal.jsx');

describe('Login Modal Tests', () => {
    beforeAll(() => {
        configure({adapter: new Adapter()});
    });

    it('should only set text if preview is truthy', () => {
        const component = mount(<LoginModal open={true} onSubmit={() => {}} onClickAway={() => {}} />);

        expect(component.find('CopyToClipboard').props().text).toBe('');
    });

    it('should set state on copy', async () => {
        jest.useFakeTimers();
        const component = mount(
            <LoginModal preview={{code: 'Code'}} open={true} onSubmit={() => {}} onClickAway={() => {}} />
        );

        expect(
            component
                .find('button')
                .at(2)
                .text()
        ).toBe('Copy Query');

        component.instance().onCopy();
        expect(component.state('copyCoolingDown')).toBe(true);
        component.instance().onCopy();
        expect(
            component
                .find('button')
                .at(2)
                .text()
        ).toBe('Copied!');

        jest.runAllTimers();

        expect(component.state('copyCoolingDown')).toBe(false);
    });
});
