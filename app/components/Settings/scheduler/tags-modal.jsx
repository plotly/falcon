import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as Actions from '../../../actions/sessions';

import {Row, Column} from '../../layout.jsx';
import Modal from '../../modal.jsx';

import './tags-modal.css';

function noop() {}
const rowStyleOverride = {justifyContent: 'flex-start', alignItems: 'center'};
const containerOverride = {width: '60%', maxHeight: '100vh', maxWidth: 522, paddingBottom: '16px'};

class TagRow extends React.Component {
    static propTypes = {
        id: PropTypes.string.isRequired,
        deleteTag: PropTypes.func,
        open: PropTypes.bool
    };
    constructor(props) {
        super(props);
        this.state = {
            confirm: false
        };
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        if (this.state.confirm) {
            this.props.deleteTag(this.props.id);
        } else {
            this.setState({confirm: true});
        }
    }

    render() {
        const tag = this.props;
        return (
            <Row className="tagRow" style={rowStyleOverride}>
                <div className="color-box" style={{background: tag.color}} />
                <span>{tag.name}</span>
                {this.state.confirm ? (
                    <button className="delete-button" onClick={this.handleDelete}>
                        Click to confirm
                    </button>
                ) : (
                    <div className="delete" onClick={this.handleDelete}>
                        X
                    </div>
                )}
            </Row>
        );
    }
}

const ConnectedTagRow = connect(
    null,
    dispatch => ({
        deleteTag: payload => dispatch(Actions.deleteTag(payload))
    })
)(TagRow);

// implements a modal window to schedule a new query
class TagsModal extends Component {
    static propTypes = {
        onClickAway: PropTypes.func.isRequired,
        open: PropTypes.bool,
        tags: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                color: PropTypes.string
            })
        )
    };
    static defaultProps = {
        onClickAway: noop,
        tags: []
    };

    render() {
        return (
            <Modal open={this.props.open} onClickAway={this.props.onClickAway} className="create-modal tag-modal">
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
                            <div className="note">Note: deleting a tag will remove it from all applications</div>
                        </Row>
                        <Column className="tagsContainer">
                            {this.props.tags.map(tag => <ConnectedTagRow key={tag.name} {...tag} />)}
                        </Column>
                    </Column>
                </Column>
            </Modal>
        );
    }
}

export default TagsModal;
