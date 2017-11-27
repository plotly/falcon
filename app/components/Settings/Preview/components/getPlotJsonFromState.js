
import {transpose, contains} from 'ramda';
import {DEFAULT_DATA, DEFAULT_LAYOUT, DEFAULT_COLORS} from './editorConstants';

export default function getPlotJsonFromState(state) {
    let data = DEFAULT_DATA;
    const layout = DEFAULT_LAYOUT;

    // Get chart data
    const allColumnNames = state.columnNames;
    const rowData = state.rows;

    // Get chart configuration
    const {xAxisColumnName, yAxisColumnNames, columnTraceTypes} = state;

    const colsWithTraceTypes = Object.keys(columnTraceTypes);

    if (allColumnNames && rowData) {
        data = [];
        const columnData = transpose(rowData);
        let xColumnData;
        let yColumnData;
        let traceColor;
        let traceType;
        let dataObj;

        yAxisColumnNames.map((yColName, i) => {

            const numColors = DEFAULT_COLORS.length;
            const colorWheelIndex = parseInt(numColors * (i / numColors), 10);
            traceColor = DEFAULT_COLORS[colorWheelIndex];
            dataObj = {};
            xColumnData = columnData[allColumnNames.indexOf(xAxisColumnName)];
            yColumnData = columnData[allColumnNames.indexOf(yColName)];

            // Get trace type
            if (colsWithTraceTypes.includes(yColName)) {
                traceType = columnTraceTypes[yColName];
            }

            const dataTemplate = {
                name: yColName,
                mode: traceType === 'line' || traceType === 'area' ? 'lines' : 'markers',
                fill: traceType === 'area' ? 'tozeroy' : null
            };

            dataObj = {
                x: xColumnData,
                y: yColumnData,
                type: traceType,
                marker: {
                    color: traceColor,
                    size: 6,
                    line: {
                        width: 1
                    }
                }
            };

            if (traceType === 'scattergeo-usa' || traceType === 'scattergeo-world') {
                dataObj = {
                    lat: xColumnData,
                    lon: yColumnData,
                    type: 'scattergeo',
                    marker: {
                        color: traceColor,
                        size: 4,
                        line: {
                            width: 1
                        }
                    }
                };
            }
            else if (traceType === 'choropleth-usa') {
                dataObj = {
                    locations: xColumnData,
                    z: yColumnData,
                    type: 'choropleth',
                    locationmode: 'USA-states',
                    colorscale: [[0, 'rgb(242,240,247)'], [0.2, 'rgb(218,218,235)'],
                        [0.4, 'rgb(188,189,220)'], [0.6, 'rgb(158,154,200)'],
                        [0.8, 'rgb(117,107,177)'], [1, 'rgb(84,39,143)']]
                };
            }
            else if (traceType === 'choropleth-world') {
                dataObj = {
                    locations: xColumnData,
                    z: yColumnData,
                    type: 'choropleth',
                    locationmode: 'country names',
                    colorscale: [[0, 'rgb(5, 10, 172)'], [0.35, 'rgb(40, 60, 190)'],
                        [0.5, 'rgb(70, 100, 245)'], [0.6, 'rgb(90, 120, 245)'],
                        [0.7, 'rgb(106, 137, 247)'], [1, 'rgb(220, 220, 220)']]
                };
            }
            else if (traceType === 'pie') {
                delete dataObj.x;
                delete dataObj.y;
                delete dataObj.marker.color;
                let pieColors = [];

                // TODO A bug or works as intended? If as intended, transform to forEach
                Array(100).fill().forEach(() => {
                    pieColors = pieColors.concat(DEFAULT_COLORS);
                });
                dataObj = {
                    values: xColumnData,
                    labels: yColumnData,
                    marker: {colors: pieColors},
                    hole: 0.2,
                    pull: 0.05
                };
            }

            if ((traceType === 'scatter' || traceType === 'line') && xColumnData.length > 20000) {
                dataObj.type = 'scattergl';
            }

            data.push(Object.assign(dataObj, dataTemplate));
        });

        layout.xaxis = {};
        layout.yaxis = {};
        layout.title = ' ';
        layout.xaxis.title = xAxisColumnName;
        layout.xaxis.zeroline = false;
        layout.yaxis.zeroline = false;
        layout.xaxis.showgrid = false;
        layout.barmode = 'stack';
        layout.yaxis.title = ' ';
        layout.yaxis.gridcolor = '#dfe8f3';
        layout.font = {color: '#506784', size: '12px'};
        if (allColumnNames.length === 2) {
            layout.yaxis = {};
            layout.yaxis.title = '';
        }

        if (data.length) {
            if (data[0].type === 'pie') {
                layout.yaxis.showgrid = false;
                layout.yaxis.showticklabels = false;
                layout.xaxis.showticklabels = false;
                layout.xaxis.title = ' ';
            }
        }

        if (contains(traceType, ['scattergeo-world', 'choropleth-world', 'scattergeo-usa', 'choropleth-usa'])) {
            layout.geo = {
                showland: true,
                landcolor: 'rgb(212,212,212)',
                subunitcolor: 'rgb(255,255,255)',
                countrycolor: 'rgb(255,255,255)',
                showlakes: true,
                lakecolor: 'rgb(255,255,255)',
                showsubunits: true,
                showcountries: true
            };
        }

        if (traceType === 'choropleth-usa') {
            layout.geo.scope = 'usa';
        }

        if (traceType === 'scattergeo-usa') {
            layout.geo.scope = 'north america';
            layout.geo.lonaxis = {
                showgrid: true,
                gridwidth: 0.5,
                range: [ -140.0, -55.0 ],
                dtick: 5
            };
            layout.geo.lataxis = {
                showgrid: true,
                gridwidth: 0.5,
                range: [ 20.0, 60.0 ],
                dtick: 5
            };
        }
    }

    return {data: data, layout: layout};
}
