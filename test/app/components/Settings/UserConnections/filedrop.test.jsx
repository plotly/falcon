jest.unmock('../../../../../app/components/Settings/UserConnections/filedrop.jsx');
import Filedrop from '../../../../../app/components/Settings/UserConnections/filedrop.jsx';
import React from 'react';
import {configure, mount} from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

import {
    DIALECTS,
    SAMPLE_DBS
} from '../../../../../app/constants/constants.js';

describe('Filedrop', () => {

    beforeAll(() => {
        configure({adapter: new Adapter()});
    });

    function newFiledrop(onUpdateConnection) {
        const settings = {
            type: 'filedrop',
            value: 'database',
            inputLabel: 'Type URL to a CSV file',
            dropLabel: '(or drop a CSV file here)',
            placeholder: 'testing placeholder'
        };

        const connection = {
            dialect: DIALECTS.CSV,
            label: ''
        };

        const updateConnection = (update) => {
            Object.assign(connection, update);
            if (onUpdateConnection) onUpdateConnection(update);
        };

        const sampleCredentialsStyle = {display: 'none'};

        const filedrop = mount(
            <Filedrop
                settings={settings}
                connection={connection}
                updateConnection={updateConnection}
                sampleCredentialsStyle={sampleCredentialsStyle}
            />
        );

        return {
            filedrop, settings, connection, updateConnection, sampleCredentialsStyle
        };
    }

    it('honors props', () => {
        const {filedrop, settings, connection, sampleCredentialsStyle} = newFiledrop();

        const sampleCredential = (SAMPLE_DBS[connection.dialect]) ?
            SAMPLE_DBS[connection.dialect][settings.value] :
            null;

        expect(filedrop.find('label.label').length).toBe(1);
        expect(filedrop.find('label.label').first().text()).toBe(settings.inputLabel);
        expect(filedrop.find('small').length).toBe(1);
        expect(filedrop.find('small').first().text()).toBe(settings.dropLabel);
        expect(filedrop.find('input').length).toBe(1);
        expect(filedrop.find('input').first().prop('placeholder')).toBe(settings.placeholder);
        expect(filedrop.find('.wrapInput > div').length).toBe(1);
        expect(filedrop.find('.wrapInput > div').first().prop('style')).toEqual(sampleCredentialsStyle);
        expect(filedrop.find('code').length).toBe(1);
        expect(filedrop.find('code').first().text()).toBe(sampleCredential);

        const label = 'testing label';
        filedrop.prop('updateConnection')({[settings.value]: label});
        expect(connection[settings.value]).toBe(label);
    });

    it('accepts input from keyboard', () => {
        const {filedrop, settings, connection} = newFiledrop();

        function getCurrentInput() {
            return filedrop.find('input').first();
        }

        const change = {target: {value: 'testing input from keyboard'}};
        getCurrentInput().simulate('change', change);

        expect(getCurrentInput().prop('value')).toBe(change.target.value);
        expect(filedrop.state('inputValue')).toBe(change.target.value);
        expect(filedrop.state('dropValue')).toBe('');
        expect(connection[settings.value]).toBe(change.target.value);
        expect(connection.label).toBe(change.target.value);
    });

    it('accepts dropped file as input', (done) => {
        let stage = 0;

        const filename = 'test.csv';
        const csvFile = 'col1,col 2,"col 3",col 4\r\n1,1.1,2018-01-10,UK\r\n2,2.2,2019-02-20,ES\r\n3,3.3,2020-03-30,PL';
        /* eslint-disable max-len */
        const dataURL = 'data:;base64,Y29sMSxjb2wgMiwiY29sIDMiLGNvbCA0DQoxLDEuMSwyMDE4LTAxLTEwLFVLDQoyLDIuMiwyMDE5LTAyLTIwLEVTDQozLDMuMywyMDIwLTAzLTMwLFBM';
        /* eslint-enable max-len */
        const file = new File([csvFile], filename);

        const {filedrop, settings, connection} = newFiledrop(() => {
            if (stage === 2) {
                try {
                    expect(filedrop.state('drag')).toBe(false);
                    expect(getCurrentInput().prop('style')).toEqual({backgroundColor: 'lightcyan'});
                    expect(filedrop.state('inputValue')).toBe(filename);
                    expect(filedrop.state('dropValue')).toBe(dataURL);
                    expect(connection.label).toBe(filename);
                    expect(connection[settings.value]).toBe(dataURL);
                    done();
                } catch (error) {
                    done(error);
                }
            }
        });

        function getCurrentInput() {
            return filedrop.find('input').first();
        }

        expect(getCurrentInput().prop('style')).toEqual({backgroundColor: null});
        getCurrentInput().simulate('dragenter');
        expect(filedrop.state('drag')).toBe(true);
        expect(getCurrentInput().prop('style')).toEqual({backgroundColor: 'lightcyan'});
        getCurrentInput().simulate('dragleave');
        expect(filedrop.state('drag')).toBe(false);
        expect(getCurrentInput().prop('style')).toEqual({backgroundColor: null});

        stage = 1;
        getCurrentInput().simulate('dragenter');
        expect(filedrop.state('drag')).toBe(true);

        stage = 2;
        getCurrentInput().simulate('drop', {dataTransfer: {files: [file]}});
    });
});
