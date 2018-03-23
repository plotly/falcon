import React from 'react';
import {configure, mount} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// workaround `TypeError: window.URL.createObjectURL is not a function`
window.URL.createObjectURL = function() {};
// workaround `Error: Not implemented: HTMLCanvasElement.prototype.getContext`
HTMLCanvasElement.prototype.getContext = function () {return null;};

jest.unmock('../../../../../app/components/Settings/Preview/chart-editor.jsx');
const ChartEditor = require('../../../../../app/components/Settings/Preview/chart-editor.jsx');

describe('ChartEditor', () => {
    const MAX_LENGTH = 100000;
    let chartEditor, columnNames, rows, gd, onUpdate, hidden;

    beforeAll(() => {
        configure({adapter: new Adapter()});

        columnNames = ['x', 'y'];

        rows = [];
        for (let i = 0; i < 100001; i++) {
            rows.push([i, 10 * i]);
        }

        gd = {};

        onUpdate = (nextGD) => {gd = nextGD;};

        hidden = true;

        chartEditor = mount(
            <ChartEditor
                columnNames={columnNames}
                rows={rows}

                gd={gd}
                onUpdate={onUpdate}

                hidden={hidden}
            />
        );
    });

    it('honors props', () => {
        expect(chartEditor.prop('columnNames')).toBe(columnNames);
        expect(chartEditor.prop('rows')).toBe(rows);

        expect(chartEditor.prop('gd')).toBe(gd);
        expect(chartEditor.prop('onUpdate')).toBe(onUpdate);

        expect(chartEditor.prop('hidden')).toBe(hidden);

        const {dataSources, dataSourceOptions} = chartEditor.state();
        expect(dataSourceOptions.length).toBe(columnNames.length);
        columnNames.forEach((name, i) => {
            const dataSourceOption = dataSourceOptions[i];
            expect(dataSourceOption).toEqual({value: name, label: name});

            // check length has been capped to 100000
            const dataSource = dataSources[name];
            expect(dataSource.length).toEqual(MAX_LENGTH);
        });

        // check a few data
        expect(dataSources.x[0]).toBe(0);
        expect(dataSources.x[1]).toBe(1);
        expect(dataSources.x[MAX_LENGTH - 1]).toBe(MAX_LENGTH - 1);

        expect(dataSources.y[0]).toBe(0);
        expect(dataSources.y[1]).toBe(10);
        expect(dataSources.y[MAX_LENGTH - 1]).toBe(10 * (MAX_LENGTH - 1));
    });

    // requires node-canvas
    xit('honors props.hidden', () => {
        function getPlotlyEditor() {
            return chartEditor.find('.plotly-editor');
        }

        expect(chartEditor.prop('hidden')).toBe(true);
        expect(getPlotlyEditor().length).toBe(0);
        chartEditor.setProps({hidden: false});
        expect(getPlotlyEditor().length).toBe(1);
    });
});
