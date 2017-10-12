
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropTarget } from 'react-dnd';
import Box from './Box.react.js';
import {xAxisDropStyle, yAxisDropStyle} from './editorConstants';

const axisZoneTarget = {
    drop(props, monitor) {
        props.onDrop(monitor.getItem());
    },

    canDrop(props, monitor) {
        // Can't drop an item twice
        const item = monitor.getItem();

        return !props.droppedItems.includes(item.name);
    }
};

@DropTarget(props => props.accepts, axisZoneTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
}))
export default class AxisDropZone extends Component {

    constructor (props) {
        super(props);
        this.clickRemoveHandler = this.clickRemoveHandler.bind(this);
    }

    static propTypes = {
        connectDropTarget: PropTypes.func.isRequired,
        isOver: PropTypes.bool.isRequired,
        canDrop: PropTypes.bool.isRequired,
        accepts: PropTypes.arrayOf(PropTypes.string).isRequired,
        onDrop: PropTypes.func.isRequired
    };

    clickRemoveHandler (colName, dropType) {
        this.props.removeDroppedItem(colName, dropType);
    }

    render() {
        const { isOver, canDrop, connectDropTarget, dropType, droppedItems } = this.props;
        const isActive = isOver && canDrop;
        const style = dropType === 'xaxis' ? xAxisDropStyle : yAxisDropStyle;

        let backgroundColor = '#f3f6fa';
        if (isActive) {
            backgroundColor = '#00cc96';
        } else if (canDrop) {
            backgroundColor = '#c8d4e3';
        }

        return connectDropTarget(
            <div style={{ ...style, backgroundColor }}>

                {droppedItems.map((colName, i) => 
                    <Box
                        name={colName}
                        type="column"
                        isDropped={true}
                        removeDroppedItem={this.props.removeDroppedItem}
                        handleClick={this.props.handleClick}
                        selectedColumn={this.props.selectedColumn}
                        dropType={this.props.dropType}
                        key={i}
                    />
                )}

            </div>,
        );
    }
}