import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Controlled as CodeMirror} from 'react-codemirror2';
import cronstrue from 'cronstrue';

import {Row, Column} from '../../layout.jsx';
import Modal from '../../modal.jsx';
import SuccessMessage from '../../success.jsx';
import RequestError from './request-error.jsx';
import TimedMessage from './timed-message.jsx';
import CronPicker from '../cron-picker/cron-picker.jsx';
import SQL from './sql.jsx';

import {
    getHighlightMode,
    DEFAULT_REFRESH_INTERVAL,
    WAITING_MESSAGE,
    SAVE_WARNING
} from '../../../constants/constants.js';

import './create-modal.css';

function noop() {}
const rowStyleOverride = {justifyContent: 'flex-start'};
const secondaryRowStyle = Object.assign({}, rowStyleOverride, {
    marginTop: '8px',
    borderTop: '1px solid #c8d4e3',
    paddingTop: '18px'
});

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
        dialect: PropTypes.string
    };
    static defaultProps = {
        initialCode: '',
        initialName: '',
        onClickAway: noop,
        onSubmit: noop,
        openQueryPage: noop
    };
    constructor(props) {
        super(props);

        this.state = {
            successMessage: null,
            code: props.initialCode,
            name: props.initialName,
            interval: '*/5 * * * *',
            error: null,
            saving: false
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
        this.submit = this.submit.bind(this);
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

    submit() {
        if (!this.state.code || !this.state.code.length) {
            return this.setState({
                error: 'Please enter the query to be scheduled above.'
            });
        }
        if (!this.state.interval) {
            return this.setState({error: 'Please select an interval above.'});
        }
        if (this.state.name && this.state.name.trim().length === 0) {
          return this.setState({error: 'Please enter a valid query name above.'});
        }

        this.setState({saving: true, error: null});
        this.props
            .onSubmit({
                query: this.state.code,
                refreshInterval: DEFAULT_REFRESH_INTERVAL,
                filename: generateFilename(),
                cronInterval: this.state.interval,
                name: this.state.name
            })
            .then(() => {
                this.setState({successMessage: 'Scheduled query saved successfully!', saving: false});
            })
            .catch(error => this.setState({error: error.message, saving: false}));
    }

    render() {
        return (
            <Modal open={this.props.open} onClickAway={this.props.onClickAway} className="scheduler create-modal">
                <Column className="container" style={{width: '60%', maxHeight: '100vh', minWidth: 640, paddingBottom: '16px'}}>
                    <Row>
                        <Column className="innerColumn">
                            <h5 className="header">Create Scheduled Query</h5>
                            <button className="button" onClick={this.props.onClickAway}>
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
                                        onChange={this.handleNameChange}
                                    />
                                )}
                            </div>
                        </Row>
                        <Row style={secondaryRowStyle}>
                            <div className="row-header" style={{paddingTop: 5}}>
                                Schedule
                            </div>
                            <div className="row-body" style={{minHeight: '108px'}}>
                                {this.state.successMessage ? (
                                    <em style={{marginTop: 5, display: 'inherit'}}>
                                        <b>{cronstrue.toString(this.state.interval)}</b>
                                    </em>
                                ) : (
                                    <CronPicker onChange={this.handleIntervalChange} />
                                )}
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
                            <SuccessMessage>{this.state.successMessage}</SuccessMessage>
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
