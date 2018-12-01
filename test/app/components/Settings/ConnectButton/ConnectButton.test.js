jest.unmock('../../../../../app/components/Settings/ConnectButton/ConnectButton.react.js');
import ConnectButton from '../../../../../app/components/Settings/ConnectButton/ConnectButton.react.js';
import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

describe('Connect Button Test', () => {

    beforeAll(() => {
        configure({ adapter: new Adapter() });
    });

    it('should handle malformatted Connection Request Error', () => {
        const connect = function() {};
        const connectRequest = {
            status: 500,
            content: {error: {message: {}}}
        };
        const saveConnectionsRequest = {
        };
        const editMode = true;

        const button = mount(<ConnectButton
            connect={connect}
            connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button.find('.errorMessage').length).toBe(1);
    });

    it('should handle malformatted Save Connections Request Error', () => {
        const connect = function() {};
        const connectRequest = {
            status: 200
        };
        const saveConnectionsRequest = {
            status: 500,
            content: {error: {message: {}}}
        };
        const editMode = true;

        const button = mount(<ConnectButton
            connect={connect}
            connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button.find('.errorMessage').length).toBe(1);
    });

    it('should handle Connection Request Error Status 500', () => {
        const connect = function() {};
        const connectRequest = {
            status: 500
        };
        const saveConnectionsRequest = {
        };
        const editMode = true;

        const button = mount(<ConnectButton
            connect={connect}
            connectRequest={connectRequest}
            saveConnectionsRequest={saveConnectionsRequest}
            editMode={editMode}
        />);

        expect(button.instance().connectionFailed()).toBe(true);
    });

    it('should verify Connection Request Error', () => {
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

        expect(button.instance().connectionFailed()).toBe(true);
    });

    it('should verify Save Connections Request Error', () => {
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

        expect(button.instance().saveFailed()).toBe(true);
    });

    it('should verify is connected', () => {
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

        expect(button.instance().isConnected()).toBe(true);
    });

    it('should verify connection request is connecting', () => {
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

        expect(button.instance().isConnecting()).toBe(true);
    });

    it('should verify save connection request', () => {
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

        expect(button.instance().isSaving()).toBe(true);
    });

    it('should verify is saved', () => {
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

        expect(button.instance().isSaved()).toBe(true);
    });

    it('should verify connection failed', () => {
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

        expect(button.instance().connectionFailed()).toBe(true);
    });

    it('should verify save failed', () => {
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

        expect(buttonWrapper.instance().saveFailed()).toBe(true);
    });

    it('should create valid save changes button', () => {
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

        // Length is 1
        expect(button.find('.connectButtonContainer').length).toBe(1);

        // Length is 0
        expect(button.find('.not-defined').length).toBe(0);

        // Verify that the error message div is not defined
        expect(button.find('.errorMessage').length).toBe(0);

        expect(button.find('#test-connect-button').text()).toBe('Save changes');
    });

    it('should create valid connected button', () => {
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

        // Length is 1
        expect(button.find('.connectButtonContainer').length).toBe(1);

        // Length is 0
        expect(button.find('.not-defined').length).toBe(0);

        // Verify that the error message div is not defined
        expect(button.find('.errorMessage').length).toBe(0);

        expect(button.find('#test-connect-button').text()).toBe('Connected');
    });

    it('should connected button with error due to connect request error', () => {
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

        // Length is 1
        expect(button.find('.connectButtonContainer').length).toBe(1);

        // Verify that the error message div is defined
        expect(button.find('.errorMessage').length).toBe(1);

        expect(button.find('#test-connect-button').text()).toBe('Connect');
    });

    it('should connected button with error due to connect request error', () => {
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

        // Length is 1
        expect(button.find('.connectButtonContainer').length).toBe(1);

        // Verify that the error message div is defined
        expect(button.find('.errorMessage').length).toBe(1);

        expect(button.find('#test-connect-button').text()).toBe('Connect');
    });
});
