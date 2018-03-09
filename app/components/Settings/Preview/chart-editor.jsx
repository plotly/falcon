import React from 'react';
import PropTypes from 'prop-types';

import plotly from 'plotly.js/dist/plotly';
import createPlotComponent from 'react-plotly.js/factory';
import PlotlyEditor from 'react-chart-editor';
import 'react-chart-editor/lib/react-chart-editor.css';

const Plot = createPlotComponent(plotly);

export default class ChartEditor extends React.Component {
    static propTypes = {
        columnNames: PropTypes.array,
        rows: PropTypes.array
    }

    /**
     * ChartEditor displays a Plotly.js chart using the query results
     *
     * @param {object} props - Component properties
     *
     * @param {Array}         props.columnNames - Array of column names
     * @param {Array.<Array>} props.rows - Array of rows
     */
    constructor(props) {
        super(props);

        /**
         * @member {object} state - Component state
         * @property {object} state.dataSources - A data source per column (used by <PlotlyEditor>)
         * @property {Array.<object>} state.dataSourceOptions - Data source options (used by <PlotlyEditor>)
         * @property {string} state.dataSourceOptions.label - Data source label (used by <PlotlyEditor>)
         * @property {string} state.dataSourceOptions.value - Data source index in dataSources (used by <PlotlyEditor>)
         * @property {object} [state.gd] - Graph div
         * @property {number} state.revision - Revision number > 0
         */
        this.state = {...ChartEditor.computeDataSources(this.props), revision: 1};

        /**
         * Increment revision counter
         * @returns {undefined}
         */
        this.onEditorUpdate = () => {
            this.setState(({revision: prevRevision}) => ({revision: prevRevision + 1}));
        };

        /**
         * Updates graph div
         * @param {object} gd - Graph div
         * @returns {undefined}
         */
        this.onPlotUpdate = (gd) => {
            this.setState({gd});
        };
    }

    static computeDataSources(props) {
        const {columnNames, rows} = props;

        const dataSources = {};
        columnNames.forEach(name => {
            dataSources[name] = [];
        });
        rows.forEach(row => {
            row.forEach((v, i) => {
                const columnName = columnNames[i];
                dataSources[columnName].push(v);
            });
        });

        const dataSourceOptions = columnNames.map(name => ({value: name, label: name}));

        return {dataSources, dataSourceOptions};
    }

    componentWillReceiveProps(nextProps) {
        // Did props change?
        const {columnNames, rows} = this.props;
        const {columnNames: nextColumnNames, rows: nextRows} = nextProps;

        let isEqual = (columnNames.length === nextColumnNames.length);
        for (let i = 0; isEqual && (i < columnNames.length); i++) {
            isEqual = isEqual && (columnNames[i] === nextColumnNames[i]);
            isEqual = isEqual && (rows[i] === nextRows[i]);
        }

        // If it did, update the data sources
        if (!isEqual) {
            this.setState(ChartEditor.computeDataSources(nextProps));
        }
    }

    render() {
        const {dataSources, dataSourceOptions, gd, revision} = this.state;

        const data = gd && gd.data;
        const layout = gd && gd.layout;
        const config = {editable: true};

        const HEIGHT = 400;
        const WIDTH = 466;

        return (
            <div>
                 <div
                    style={{
                        float: 'left',
                        width: WIDTH
                    }}
                 >
                    <PlotlyEditor
                        graphDiv={gd}
                        onUpdate={this.onEditorUpdate}
                        dataSources={dataSources}
                        dataSourceOptions={dataSourceOptions}
                        plotly={plotly}
                    />
                </div>
                <div
                    style={{
                        height: HEIGHT,
                        marginLeft: WIDTH
                    }}
                >
                    <Plot
                        debug
                        useResizeHandler
                        config={config}
                        data={data}
                        layout={layout}
                        onUpdate={this.onPlotUpdate}
                        onInitialized={this.onPlotUpdate}
                        revision={revision}
                        style={{width: '100%', height: '100%'}}
                    />
                </div>
                <div style={{clear: 'both'}}></div>
            </div>
        );
    }
}
