import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import createPlotlyComponent from 'react-plotlyjs';
import Plotly from 'plotly.js/dist/plotly.min.js';
import R from 'ramda';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import AxisDropZone from './components/AxisDropZone.react.js';
import Box from './components/Box.react.js';

import {PLOT_TYPES, controlPanelStyle, columnSelectLabelStyle,
        dropdownContainerStyle, selectDropdownStyle} from './components/editorConstants';


@DragDropContext(HTML5Backend)
export default class ChartEditor extends PureComponent {

    constructor(props) {
        super(props);

        this.handleRemove = this.handleRemove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    static propTypes = {
        boxes: PropTypes.arrayOf(PropTypes.object),
        plotJSON: PropTypes.object,
        selectedChartType: PropTypes.string,
        selectedColumn: PropTypes.string,
        xAxisColumnName: PropTypes.string,
        yAxisColumnNames: PropTypes.string,
        droppedBoxNames: PropTypes.array,
        updateProps: PropTypes.func,
        columnTraceTypes: PropTypes.array,
        columnNames: PropTypes.array
    }

    shouldComponentUpdate(nextProps) {
        return (JSON.stringify(nextProps) !== this.props);
    }

    isDropped(boxName) {
        return this.props.droppedBoxNames.indexOf(boxName) > -1;
    }

    render() {
        const PlotlyComponent = createPlotlyComponent(Plotly);

        const {
            boxes,
            plotJSON,
            selectedChartType,
            selectedColumn,
            xAxisColumnName,
            yAxisColumnNames
        } = this.props;

        const columnLabel = selectedColumn ?
            'Select a chart type for ' + selectedColumn :
            'Select a chart type';

        return (
            <div style={{fontFamily: 'Open Sans, Sans-Serif'}}>
                <div style={controlPanelStyle}>
                    <div style={dropdownContainerStyle}>
                        <div style={columnSelectLabelStyle}>{columnLabel}</div>
                        {/* TODO is this a bug?
                        there's no value attribute on <select> (instead use option's selected attr) */}
                        <select
                            onChange={this.handleSelect}
                            style={selectDropdownStyle}
                            value={selectedChartType}
                        >
                            {PLOT_TYPES.map((opt, i) =>
                                <option key={i} value={opt.value}>{opt.label}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        {boxes.map(({ name, type }, index) =>
                            <Box
                                name={name}
                                type={type}
                                isDropped={this.isDropped(name)}
                                key={index}
                            />
                        )}
                    </div>
                </div>
                <div>
                    <div style={{float: 'left', height: '400px'}}>
                        <AxisDropZone
                            accepts={['column']}
                            onDrop={item => this.handleDrop(item, 'yaxis')}
                            removeDroppedItem={this.handleRemove}
                            handleClick={this.handleClick}
                            key={1}
                            dropType="yaxis"
                            droppedItems={yAxisColumnNames}
                            selectedColumn={selectedColumn}
                        />
                    </div>
                    <div style={{marginLeft: '100px', position: 'relative'}}>
                        <PlotlyComponent
                            data={plotJSON.data}
                            layout={plotJSON.layout}
                            config={{editable: true}}
                        />
                    </div>
                </div>
                <AxisDropZone
                    accepts={['column']}
                    onDrop={item => this.handleDrop(item, 'xaxis')}
                    removeDroppedItem={this.handleRemove}
                    key={0}
                    dropType="xaxis"
                    droppedItems={[xAxisColumnName]}
                    selectedColumn={selectedColumn}
                />
            </div>
        );
    }

    handleRemove(colName, axisType) {
        let {selectedColumn} = this.props;
        const {updateProps, yAxisColumnNames} = this.props;

        if (colName === selectedColumn || yAxisColumnNames.length === 1) {
            selectedColumn = '';
        }

        if (axisType === 'xaxis') {
            updateProps({
                xAxisColumnName: '',
                selectedColumn: selectedColumn
            });
        }
        else if (axisType === 'yaxis') {
            updateProps({
                yAxisColumnNames: yAxisColumnNames.filter(val => val !== colName),
                selectedColumn: selectedColumn
            });
        }
    }

    handleSelect(event) {
        const traceType = event.target.value;
        const columnTraceTypes = this.props.columnTraceTypes;
        const {columnNames, selectedColumn, updateProps} = this.props;

        if (selectedColumn) {
            columnTraceTypes[selectedColumn] = traceType;
        }
        else {
            columnNames.forEach(
                colName => (columnTraceTypes[colName] = traceType)
            );
        }

        updateProps({
            columnTraceTypes: columnTraceTypes,
            selectedChartType: traceType
        });
    }

    handleClick(colName) {
        const {columnTraceTypes, selectedColumn, updateProps} = this.props;
        if (colName === selectedColumn) {
            updateProps({selectedColumn: ''});
        } else {
            updateProps({
                selectedColumn: colName,
                selectedChartType: columnTraceTypes[colName]
            });
        }
    }

    handleDrop(item, axisType) {
        const {name} = item;
        const {
            updateProps,
            droppedBoxNames,
            yAxisColumnNames
        } = this.props;

        if (axisType === 'xaxis') {
            updateProps({
                droppedBoxNames: R.concat(droppedBoxNames, [name]),
                xAxisColumnName: name
            });
        }
        else if (axisType === 'yaxis') {
            updateProps({
                droppedBoxNames: R.concat(droppedBoxNames, [name]),
                yAxisColumnNames: R.concat(
                    yAxisColumnNames,
                    [name]
                ),
                selectedColumn: name
            });
        }
    }
}
