import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as Actions from '../../../actions/sessions';

import {Row, Column} from '../../layout.jsx';
import Modal from '../../modal.jsx';
import RequestError from './request-error.jsx';
import ColorPicker from './color-picker.jsx';

import './tags-modal.css';

function noop() {}
const rowStyleOverride = {justifyContent: 'flex-start', alignItems: 'center'};
const containerOverride = {maxHeight: '100vh', width: 560, paddingBottom: '32px'};

class TagRow extends React.Component {
    static propTypes = {
        id: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        deleteTag: PropTypes.func,
        updateTag: PropTypes.func,
        open: PropTypes.bool
    };
    constructor(props) {
        super(props);
        this.state = {
            confirm: false,
            color: this.props.color
        };
        this.handleDelete = this.handleDelete.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
        this.handleColorChange = this.handleColorChange.bind(this);
    }

    handleColorChange(color) {
        this.setState({color: color.hex});
    }

    handleDelete() {
        if (this.state.confirm) {
            this.props.deleteTag(this.props.id);
        } else {
            this.setState({confirm: true});
        }
    }

    handleEdit() {
        return this.props.updateTag(this.props.id, {
            color: this.state.color
        });
    }

    render() {
        const tag = this.props;
        return (
            <Row className="tagRow" style={rowStyleOverride}>
                <ColorPicker color={this.state.color} onChange={this.handleColorChange} onClickAway={this.handleEdit} />
                <span>{tag.name}</span>
                {this.state.confirm ? (
                    <button className="delete-button" onClick={this.handleDelete}>
                        Click to confirm
                    </button>
                ) : (
                    <div className="delete" onClick={this.handleDelete}>
                        &times;
                    </div>
                )}
            </Row>
        );
    }
}

// implements a modal window to schedule a new query
export class TagsModal extends Component {
    static propTypes = {
        onClickAway: PropTypes.func.isRequired,
        open: PropTypes.bool,
        tags: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                color: PropTypes.string
            })
        ),
        deleteTag: PropTypes.func,
        createTag: PropTypes.func,
        updateTag: PropTypes.func
    };

    static defaultProps = {
        onClickAway: noop,
        deleteTag: noop,
        createTag: noop,
        updateTag: noop,
        tags: []
    };

    constructor(props) {
        super(props);

        this.state = {
            color: '#567567',
            error: null,
            colorPickerOpen: false
        };

        this.handleCreate = this.handleCreate.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
        this.handleColorChange = this.handleColorChange.bind(this);

        this.form = React.createRef();
    }

    handleCreate(e) {
        e.preventDefault();
        this.setState({error: null});
        const tagName = e.target[0].value;

        return this.props
            .createTag({
                name: tagName,
                color: this.state.color
            })
            .then(() => this.form.current.reset())
            .catch(({error}) => this.setState({error: error.message || error}));
    }

    handleEdit(...args) {
        return this.props.updateTag(...args).catch(({error}) => this.setState({error: error.message || error}));
    }

    handleColorChange(color) {
        this.setState({color: color.hex});
    }

    render() {
        return (
            <Modal open={true} onClickAway={this.props.onClickAway} className="create-modal tag-modal">
                <Column className="container" style={containerOverride}>
                    <Row>
                        <Column className="innerColumn">
                            <h5 className="header">Manage Tags</h5>
                            <button className="button" onClick={this.props.onClickAway}>
                                &times;
                            </button>
                        </Column>
                    </Row>
                    <Column className="detailsColumn">
                        <Row style={{...rowStyleOverride, padding: '24px 0px'}}>
                            <div className="count">{this.props.tags.length} tags</div>
                            <div className="note">Note: deleting a tag will remove it from all scheduled queries</div>
                        </Row>
                        {this.state.error && (
                            <Row style={rowStyleOverride}>
                                <RequestError>{this.state.error}</RequestError>
                            </Row>
                        )}
                        <form ref={this.form} onSubmit={this.handleCreate}>
                            <Row className="createTag" style={rowStyleOverride}>
                                <ColorPicker color={this.state.color} onChange={this.handleColorChange} />
                                <input className="tag-name" maxLength={30} placeholder="tag name" />
                                <button type="submit">create</button>
                            </Row>
                        </form>
                        <Row className="tagsContainer">
                            <Column className="scrollContainer">
                                {this.props.tags.map(tag => (
                                    <TagRow
                                        key={tag.name}
                                        updateTag={this.handleEdit}
                                        deleteTag={this.props.deleteTag}
                                        {...tag}
                                    />
                                ))}
                            </Column>
                        </Row>
                    </Column>
                </Column>
            </Modal>
        );
    }
}

export default connect(
    state => ({
        tags: state.tags
    }),
    dispatch => ({
        createTag: payload => dispatch(Actions.createTag(payload)),
        deleteTag: payload => dispatch(Actions.deleteTag(payload)),
        updateTag: (id, body) => dispatch(Actions.updateTag(id, body))
    })
)(TagsModal);
