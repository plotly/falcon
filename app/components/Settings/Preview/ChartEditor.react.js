import React, { PureComponent } from 'react';
import update from 'react/lib/update';
import createPlotlyComponent from 'react-plotlyjs';
import Plotly from 'plotly.js/dist/plotly.min.js';
import R from 'ramda';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import AxisDropZone from './components/AxisDropZone.react.js';
import Box from './components/Box.react.js';

import getPlotJsonFromState from './components/getPlotJsonFromState.js'
import {PLOT_TYPES, controlPanelStyle, columnSelectLabelStyle,
        dropdownContainerStyle, selectDropdownStyle, submitStyle} from './components/editorConstants';


@DragDropContext(HTML5Backend)
export default class ChartEditor extends PureComponent {

    constructor(props) {
        super(props);

        this.handleRemove = this.handleRemove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleSelect = this.handleSelect.bind(this);

        let columnTraceTypes = [];
        this.props.columnNames.map(colName => (columnTraceTypes[colName] = 'scatter'));

        this.state = {};
    }

    propsToState(nextProps, oldProps) {
        let newState = {};

        const defaultState = {
            xAxisColumnName: columnNames => columns[0],
            yAxisColumnNames: columnNames => [columns[1]],
            boxes: columnNames => columnNames.map(colName => ({name: colName, type: 'column'})),
            droppedBoxNames: () => [],
            selectedColumn: () => '',
            selectedChartType: () => 'scatter'
        }

        if (nextProps.columnNames !== oldProps) {
            // Reset props to defaults based off of columnNames
            R.keys(defaultState).forEach(k => {
                newState[k] = defaultState[k](nextProps.columnNames)
            });
            this.setState(newState);
        } else if (nextProps.columnNames.length === 0) {
            ['droppedBoxNames', 'selectedColumn', 'selectedChartType'].forEach(
                k => newState[k] = defaultState[k]()
            );
            this.setState(newState);
        } else {
            R.keys(defaultState).forEach(k => {
                newState[k] = nextProps[k];
            });
            this.setState(newState);
        }

    }

    componentWillMount() {
        this.propsToState(this.props, {});
    }

    componentWillReceiveProps(nextProps) {
        this.propsToState(nextProps, this.props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        // if( JSON.stringify(this.state) === JSON.stringify(nextState) ) {
        //     return false;
        // }

        return true;
    }

    isDropped(boxName) {
        return this.state.droppedBoxNames.indexOf(boxName) > -1;
    }

    render() {

        const PlotlyComponent = createPlotlyComponent(Plotly);
        const {
            xAxisColumnName,
            yAxisColumnNames,
            boxes,
            droppedBoxNames,
            selectedColumn,
            selectedChartType
        } = this.state;

        const {
            columnNames,
            rows,
            updateProps,
            updatePlotJson,
            plotJSON
        } = this.props;

        const columnLabel = selectedColumn ?
            'Select a chart type for ' + selectedColumn :
            'Select a chart type';

        return (
            <div style={{fontFamily:'Open Sans, Sans-Serif'}}>
                <div style={controlPanelStyle}>
                    <div style={dropdownContainerStyle}>
                        <div style={columnSelectLabelStyle}>{columnLabel}</div>
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
                    <div style={{float:'left', height:'400px'}}>
                        <AxisDropZone
                            accepts={['column']}
                            onDrop={item => this.handleDrop(item, 'yaxis')}
                            removeDroppedItem={this.handleRemove}
                            handleClick={this.handleClick}
                            key={1}
                            dropType='yaxis'
                            droppedItems={yAxisColumnNames}
                            selectedColumn={selectedColumn}
                        />
                    </div>
                    <div style={{marginLeft:'100px', position:'relative'}}>
                        <PlotlyComponent
                            data={plotJSON.data}
                            layout={plotJSON.layout}
                            config={{editable: true}}
                        />
                    </div>
                </div>
                <AxisDropZone
                    accepts={['column']}
                    onDrop={item => this.handleDrop(item ,'xaxis')}
                    removeDroppedItem={this.handleRemove}
                    key={0}
                    dropType='xaxis'
                    droppedItems={[xAxisColumnName]}
                    selectedColumn={selectedColumn}
                />
            </div>
        );
    }

    handleRemove(colName, axisType) {
        let {selectedColumn} = this.state;
        const {yAxisColumnNames} = this.state;
        const {updateProps} = this.props;

        if (colName === selectedColumn) {
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
        const selectedColumn = this.state.selectedColumn;
        let columnTraceTypes = this.state.columnTraceTypes;
        const {columnNames, updateProps} = this.props;

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
        const {updateProps} = this.props;
        const {columnTraceTypes} = this.state;
        if (colName === this.state.selectedColumn) {
            updateProps({selectedColumn: ''});
        }
        else{
            updateProps({
                selectedColumn: colName,
                selectedChartType: columnTraceTypes[colName]
            });
        }
    }

    handleDrop(item, axisType) {
        const {name} = item;
        const {updateProps} = this.props;

        if (axisType === 'xaxis') {
            updateProps(update(this.state, {
                droppedBoxNames: name ? {
                    $push: [name],
                } : {},
                xAxisColumnName: {
                    $set: name,
                },
            }));
        }
        else if (axisType === 'yaxis') {
            updateProps(update(this.state, {
                droppedBoxNames: name ? {
                    $push: [name],
                } : {},
                yAxisColumnNames: name ? {
                    $push: [name],
                } : {},
                selectedColumn: {
                    $set: name
                }
            }));
        }
    }
}
