import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';

const style = {
    border: '1px dashed #c8d4e3',
    backgroundColor: 'white',
    padding: '0.5rem 1rem',
    marginRight: '0.5rem',
    marginBottom: '0.5rem',
    cursor: 'move',
    float: 'left',
    fontSize: '12px',
    borderRadius: '10px'
};

const boxSource = {
    beginDrag(props) {
        return {
            name: props.name
        };
    }
};

@DragSource(props => props.type, boxSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
}))
export default class Box extends Component {
    constructor(props) {
        super(props);

        this.handleRemove = this.handleRemove.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    static propTypes = {
        connectDragSource: PropTypes.func.isRequired,
        isDragging: PropTypes.bool.isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        isDropped: PropTypes.bool.isRequired,
        dropType: PropTypes.string,
        removeDroppedItem: PropTypes.func,
        handleClick: PropTypes.func,
        selectedColumn: PropTypes.string
    };

    handleRemove() {
        const { name, dropType } = this.props;

        if (typeof this.props.removeDroppedItem === 'function') {
            this.props.removeDroppedItem(name, dropType);
        }
    }

    handleClick() {
        const { name } = this.props;

        if (typeof this.props.handleClick === 'function') {
            this.props.handleClick(name);
        }
    }

    render() {
        const { name, isDropped, isDragging, connectDragSource } = this.props;
        const opacity = isDragging ? 0.4 : 1;
        const borderColor = (name === this.props.selectedColumn) ? '#2a3f5f' : '#c8d4e3';

        if (!name) {
            return null;
        }

        return connectDragSource(
            <div style={{ ...style, opacity, borderColor }}>
                {isDropped && this.props.dropType ?
                    <div>
                        <a
                            onClick={this.handleRemove}
                            style={{cursor: 'pointer', marginRight: '5px', color: '#d36046', textDecoration: 'none'}}
                        >
                            &times;
                        </a>
                        <a
                            onClick={this.handleClick}
                            style={{cursor: 'pointer', color: '#2a3f5f', textDecoration: 'none'}}
                        >
                            {name}
                        </a>
                    </div> :
                    <div>
                        {name}
                    </div>
                }
            </div>,
        );
    }
}
