jest.dontMock('../../../../../app/components/Settings/ConnectButton/ConnectButton.react.js');
import ConnectButton from '../../../../../app/components/Settings/ConnectButton/ConnectButton.react.js';
import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

describe('Connect Button Tests', () => {

    beforeAll(() => {
        // Setup the test
        configure({ adapter: new Adapter() });
    });

    it('Should verify Connection Request Error', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 400
        };
        const saveConnectionsRequest = {
            status: 200
        };
        const editMode = true;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();
        expect(button.instance().isConnectionError()).toBeTruthy();
    });

    it('Should verify Save Connections Request Error', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 200
        };
        const saveConnectionsRequest = {
            status: 400
        };
        const editMode = true;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();
        expect(button.instance().isConnectionError()).toBeTruthy();
    });

    it('Should verify Save Connections Request without Error', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 200
        };
        const saveConnectionsRequest = {
            status: 200
        };
        const editMode = true;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();
        expect(button.instance().isConnectionError()).toBeFalsy();
    });

    it('Should verify loading connection request loading status', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 'loading'
        };
        const saveConnectionsRequest = {
            status: 200
        };
        const editMode = true;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();
        expect(button.instance().loadingStatus()).toBeTruthy();
    });

    it('Should verify loading save connections request loading status', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 200
        };
        const saveConnectionsRequest = {
            status: 'loading'
        };
        const editMode = true;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();
        expect(button.instance().loadingStatus()).toBeTruthy();
    });

    it('Should verify not loading status', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 200
        };
        const saveConnectionsRequest = {
            status: 200
        };
        const editMode = true;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();
        expect(button.instance().loadingStatus()).toBeFalsy();
    });

    it('Should verify valid connection', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 200
        };
        const saveConnectionsRequest = {
            status: 200
        };
        const editMode = true;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();

        expect(button.instance().isValidConnection()).toBeTruthy();
    });

    it('Should verify valid connection', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 400
        };
        const saveConnectionsRequest = {
            status: 400
        };
        const editMode = true;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();
        expect(button.instance().isValidConnection()).toBeFalsy();
    });

    it('Should verify connection status', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
        };
        const saveConnectionsRequest = {
            status: 400
        };
        const editMode = true;

        const buttonWrapper = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(buttonWrapper).toBeDefined();
        expect(buttonWrapper.instance().isValidConnection()).toBeFalsy();
    });

    it('Should create valid connected button', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 200
        };
        const saveConnectionsRequest = {
            status: 200
        };
        const editMode = false;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();

        // Length is 1
        expect(button.find('.connectButtonContainer').length).toBe(1);

        // Length is 0
        expect(button.find('.not-defined').length).toBe(0);

        // Verify that the error message div is not defined
        expect(button.find('.errorMessage').length).toBe(0);

        expect(button.find('#test-connect-button').text()).toBe('Connected');
    });

    it('Should connected button with error due to connect request error', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 400
        };
        const saveConnectionsRequest = {
            status: 200
        };
        const editMode = false;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();

        // Length is 1
        expect(button.find('.connectButtonContainer').length).toBe(1);

        // Verify that the error message div is defined
        expect(button.find('.errorMessage').length).toBe(1);

        expect(button.find('#test-connect-button').text()).toBe('Connect');
    });

    it('Should connected button with error due to connect request error', () => {
        expect(ConnectButton).toBeDefined();

        const connect = function() {};
        const connectRequest = {
            status: 200
        };
        const saveConnectionsRequest = {
            status: 400
        };
        const editMode = false;

        const button = mount(<ConnectButton connect={connect} connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button).toBeDefined();

        // Length is 1
        expect(button.find('.connectButtonContainer').length).toBe(1);

        // Verify that the error message div is defined
        expect(button.find('.errorMessage').length).toBe(1);

        expect(button.find('#test-connect-button').text()).toBe('Connect');
    });
});