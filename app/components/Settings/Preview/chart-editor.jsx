import React from 'react';
import PropTypes from 'prop-types';

import plotly from 'plotly.js/dist/plotly';
import PlotlyEditor from 'react-chart-editor';
import 'react-chart-editor/lib/react-chart-editor.css';

export default class ChartEditor extends React.Component {
    static propTypes = {
        columnNames: PropTypes.array,
        rows: PropTypes.array,
        gd: PropTypes.object,
        onUpdate: PropTypes.func
    }

    /**
     * ChartEditor displays a Plotly.js chart using the query results
     *
     * @param {object} props - Component properties
     *
     * @param {Array}         props.columnNames - Array of column names
     * @param {Array.<Array>} props.rows - Array of rows
     *
     * @param {object}        props.gd - Plotly graph div
     * @param {Array}         [props.gd.data] - Plotly graph data
     * @param {Array}         [props.gd.frames] - Plotly graph frames
     * @param {object}        [props.gd.layout] - Plotly graph layout
     * @param {function}      props.onUpdate - Callback invoked to update gd
     */
    constructor(props) {
        super(props);

        /**
         * @member {object} state - Component state
         * @property {object} state.dataSources - A data source per column (used by <PlotlyEditor>)
         *
         * @property {Array.<object>} state.dataSourceOptions - Data source options (used by <PlotlyEditor>)
         * @property {string} state.dataSourceOptions.label - Data source label (used by <PlotlyEditor>)
         * @property {string} state.dataSourceOptions.value - Data source index in dataSources (used by <PlotlyEditor>)
         */
        this.state = ChartEditor.computeDataSources(this.props);
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
        const {gd, onUpdate} = this.props;
        const {dataSources, dataSourceOptions} = this.state;

        const config = {
            editable: true
        };
        const data = gd && gd.data;
        const frames = gd && gd.frames;
        const layout = gd && gd.layout;

        window.dispatchEvent(new Event('resize'));

        return (
            <div style={{height: 400}}>
                <PlotlyEditor
                    plotly={plotly}

                    config={config}
                    data={data}
                    frames={frames}
                    layout={layout}

                    dataSources={dataSources}
                    dataSourceOptions={dataSourceOptions}

                    onUpdate={(nextData, nextLayout, nextFrames) =>
                        onUpdate({
                            data: nextData,
                            layout: nextLayout,
                            frames: nextFrames
                        })
                    }

                    useResizeHandler
                    debug
                    advancedTraceTypeSelector
                />
            </div>
        );
    }
}
