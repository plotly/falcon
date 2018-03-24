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
    let chartEditor, columnNames, rows, plotlyJSON, onUpdate, hidden;

    beforeAll(() => {
        configure({adapter: new Adapter()});

        columnNames = ['x', 'y'];

        rows = [];
        for (let i = 0; i < 1 + ChartEditor.MAX_ROWS; i++) {
            rows.push([i, 10 * i]);
        }

        plotlyJSON = {};

        onUpdate = (nextPlotlyJSON) => {plotlyJSON = nextPlotlyJSON;};

        hidden = true;

        chartEditor = mount(
            <ChartEditor
                columnNames={columnNames}
                rows={rows}

                plotlyJSON={plotlyJSON}
                onUpdate={onUpdate}

                hidden={hidden}
            />
        );
    });

    it('honors props', () => {
        expect(chartEditor.prop('columnNames')).toBe(columnNames);
        expect(chartEditor.prop('rows')).toBe(rows);

        expect(chartEditor.prop('plotlyJSON')).toBe(plotlyJSON);
        expect(chartEditor.prop('onUpdate')).toBe(onUpdate);

        expect(chartEditor.prop('hidden')).toBe(hidden);

        const {dataSources, dataSourceOptions} = chartEditor.state();
        expect(dataSourceOptions.length).toBe(columnNames.length);
        columnNames.forEach((name, i) => {
            const dataSourceOption = dataSourceOptions[i];
            expect(dataSourceOption).toEqual({value: name, label: name});

            // check length has been capped
            const dataSource = dataSources[name];
            expect(dataSource.length).toEqual(ChartEditor.MAX_ROWS);
        });

        // check a few data
        expect(dataSources.x[0]).toBe(0);
        expect(dataSources.x[1]).toBe(1);
        expect(dataSources.x[ChartEditor.MAX_ROWS - 1]).toBe(ChartEditor.MAX_ROWS - 1);

        expect(dataSources.y[0]).toBe(0);
        expect(dataSources.y[1]).toBe(10);
        expect(dataSources.y[ChartEditor.MAX_ROWS - 1]).toBe(10 * (ChartEditor.MAX_ROWS - 1));
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
