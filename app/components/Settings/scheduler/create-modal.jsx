import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Controlled as CodeMirror} from 'react-codemirror2';
import cronstrue from 'cronstrue';

import {Row, Column} from '../../layout.jsx';
import Modal from '../../modal.jsx';
import {Link} from '../../Link.react';
import SuccessMessage from '../../success.jsx';
import RequestError from './request-error.jsx';
import TimedMessage from './timed-message.jsx';
import CronPicker from '../cron-picker/cron-picker.jsx';
import SQL from './sql.jsx';
import TagPicker from './tag-picker.jsx';
import TagModal from './tags-modal.jsx';

import {datasetUrl as getDatasetURL} from '../../../utils/utils';
import {getHighlightMode, WAITING_MESSAGE, SAVE_WARNING} from '../../../constants/constants.js';

import './create-modal.css';

function noop() {}
const rowStyleOverride = {justifyContent: 'flex-start'};
const secondaryRowStyle = Object.assign({}, rowStyleOverride, {
    marginTop: '8px',
    borderTop: '1px solid #c8d4e3',
    paddingTop: '18px'
});
const containerOverride = {width: '60%', maxHeight: '100vh', minWidth: 640, paddingBottom: '16px'};
const minHeight = {minHeight: '60px'};

function generateFilename() {
    let n = Math.floor(Math.random() * 1e8).toString();

    // Pad 0 if needed
    if (n.length < 8) {
        n = `0${n}`;
    }

    return `Grid_${n}`;
}

// implements a modal window to schedule a new query
class CreateModal extends Component {
    static propTypes = {
        initialCode: PropTypes.string,
        initialName: PropTypes.string,
        onClickAway: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired,
        openQueryPage: PropTypes.func.isRequired,
        open: PropTypes.bool,
        dialect: PropTypes.string,
        tags: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                color: PropTypes.string
            })
        )
    };
    static defaultProps = {
        initialCode: '',
        initialName: '',
        onClickAway: noop,
        onSubmit: noop,
        openQueryPage: noop,
        tags: []
    };
    constructor(props) {
        super(props);

        this.state = {
            successMessage: null,
            code: props.initialCode,
            name: props.initialName,
            interval: '*/5 * * * *',
            error: null,
            saving: false,
            datasetUrl: null,
            tags: [],
            tagsModalOpen: false
        };
        this.options = {
            lineWrapping: true,
            lineNumbers: true,
            tabSize: 4,
            readOnly: false,
            extraKeys: {},
            mode: getHighlightMode(this.props.dialect)
        };
        this.updateCode = this.updateCode.bind(this);
        this.handleIntervalChange = this.handleIntervalChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleTagsChange = this.handleTagsChange.bind(this);
        this.submit = this.submit.bind(this);
        this.openTagsModal = this.openTagsModal.bind(this);
        this.closeTagsModal = this.closeTagsModal.bind(this);
    }

    updateCode(editor, meta, code) {
        this.setState({code});
    }

    handleIntervalChange(newInterval) {
        this.setState({interval: newInterval});
    }

    handleNameChange(e) {
        this.setState({name: e.target.value});
    }

    handleTagsChange(tags) {
        if (tags.error) {
            this.setState({error: tags.error.message || tags.error});
        } else {
            this.setState({tags, error: null});
        }
    }

    openTagsModal() {
        this.setState({tagsModalOpen: true});
    }

    closeTagsModal(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({tagsModalOpen: false});
    }

    submit() {
        if (!this.state.code || !this.state.code.length) {
            return this.setState({
                error: 'Please enter the query to be scheduled above.'
            });
        }
        if (!this.state.interval) {
            return this.setState({error: 'Please select an interval above.'});
        }

        this.setState({saving: true, error: null});
        this.props
            .onSubmit({
                query: this.state.code,
                filename: generateFilename(),
                cronInterval: this.state.interval,
                name: this.state.name ? this.state.name.trim() : '',
                tags: this.state.tags.map(t => t.id)
            })
            .then(res => {
                this.setState({
                    successMessage: 'Scheduled query saved successfully!',
                    saving: false,
                    datasetUrl: getDatasetURL(res.fid)
                });
            })
            .catch(error => this.setState({error: error.message, saving: false}));
    }

    render() {
        if (this.state.tagsModalOpen) {
            return <TagModal onClickAway={this.closeTagsModal} />;
        }
        return (
            <Modal open={this.props.open} onClickAway={this.props.onClickAway} className="scheduler create-modal">
                <Column className="container" style={containerOverride}>
                    <Row>
                        <Column className="innerColumn">
                            <h5 className="header">Create Scheduled Query</h5>
                            <button className="button close-btn" onClick={this.props.onClickAway}>
                                &times;
                            </button>
                        </Column>
                    </Row>
                    <Column className="detailsColumn">
                        <Row>
                            <p>A scheduled query runs and updates its corresponding dataset in Plotly Cloud.</p>
                        </Row>
                        <Row style={rowStyleOverride}>
                            <div className="row-header">Query</div>
                            <div className="row-body">
                                {this.state.successMessage ? (
                                    <SQL>{this.state.code}</SQL>
                                ) : (
                                    <CodeMirror
                                        options={this.options}
                                        value={this.state.code}
                                        onBeforeChange={this.updateCode}
                                    />
                                )}
                            </div>
                        </Row>
                        <Row style={secondaryRowStyle}>
                            <div className="row-header">Query name</div>
                            <div className="row-body">
                                {this.state.successMessage ? (
                                    <em style={{marginTop: 5, display: 'inherit'}}>
                                        <b>{this.state.name}</b>
                                    </em>
                                ) : (
                                    <input
                                        maxLength="150"
                                        placeholder="Enter query name here..."
                                        value={this.state.name}
                                        style={{
                                            margin: '0 0 16px',
                                            width: '70%',
                                            float: 'none'
                                        }}
                                        onChange={this.handleNameChange}
                                    />
                                )}
                            </div>
                        </Row>
                        <Row style={secondaryRowStyle}>
                            <div className="row-header" style={{paddingTop: 5}}>
                                Schedule
                            </div>
                            <div className="row-body" style={{minHeight: '64px'}}>
                                {this.state.successMessage ? (
                                    <em style={{marginTop: 5, display: 'inherit'}}>
                                        <b>{cronstrue.toString(this.state.interval)}</b>
                                    </em>
                                ) : (
                                    <CronPicker onChange={this.handleIntervalChange} />
                                )}
                            </div>
                        </Row>
                        <Row style={secondaryRowStyle}>
                            <div className="row-header" style={{paddingTop: 5}}>
                                <div>Tags</div>
                                <div onClick={this.openTagsModal}>
                                    <u className="tag-manager-text">manage tags</u>
                                </div>
                            </div>
                            <div className="row-body" style={minHeight}>
                                <TagPicker
                                    disabled={Boolean(this.state.successMessage)}
                                    value={this.state.tags}
                                    options={this.props.tags}
                                    onChange={this.handleTagsChange}
                                />
                            </div>
                        </Row>
                        {this.state.error && (
                            <Row style={rowStyleOverride}>
                                <RequestError onClick={this.props.openQueryPage}>{this.state.error}</RequestError>
                            </Row>
                        )}
                        {this.state.saving && (
                            <Row style={rowStyleOverride}>
                                <TimedMessage>
                                    <div style={{fontSize: 16, paddingTop: 16}}>{WAITING_MESSAGE}</div>
                                </TimedMessage>
                            </Row>
                        )}
                    </Column>
                    <Row>
                        {this.state.successMessage ? (
                            <Column style={{padding: '0 32px 16px'}}>
                                <SuccessMessage message={this.state.successMessage}>
                                    <Link href={this.state.datasetUrl}>View Live Dataset</Link>
                                </SuccessMessage>
                            </Column>
                        ) : (
                            <Column>
                                <button type="submit" className="submit" onClick={this.submit}>
                                    {this.state.saving ? 'Saving...' : 'Save'}
                                </button>
                                <div className="save-warning">{SAVE_WARNING}</div>
                            </Column>
                        )}
                    </Row>
                </Column>
            </Modal>
        );
    }
}

export default CreateModal;
