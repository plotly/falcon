import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Controlled as CodeMirror} from 'react-codemirror2';

import {Row, Column} from '../../layout.jsx';
import Modal from '../../modal.jsx';
import SuccessMessage from '../../success.jsx';
import RequestError from './request-error.jsx';
import TimedMessage from './timed-message.jsx';
import CronPicker from '../cron-picker/cron-picker.jsx';

import {getHighlightMode, DEFAULT_REFRESH_INTERVAL, WAITING_MESSAGE} from '../../../constants/constants.js';

import './create-modal.css';

function noop() {}
const rowStyleOverride = {justifyContent: 'flex-start'};

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
        // `initialFilename` currently unused but will be implemented once backend supports
        initialFilename: PropTypes.string,
        onClickAway: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired,
        openQueryPage: PropTypes.func.isRequired,
        open: PropTypes.bool,
        dialect: PropTypes.string
    };
    static defaultProps = {
        initialCode: '',
        initialFilename: '',
        onClickAway: noop,
        onSubmit: noop,
        openQueryPage: noop
    };
    constructor(props) {
        super(props);

        this.state = {
            successMessage: null,
            code: props.initialCode,
            filename: props.initialFilename,
            interval: '*/5 * * * *',
            error: null,
            saving: false
        };
        this.options = {
            lineNumbers: true,
            tabSize: 4,
            readOnly: false,
            extraKeys: {},
            mode: getHighlightMode(this.props.dialect)
        };
        this.updateCode = this.updateCode.bind(this);
        this.handleIntervalChange = this.handleIntervalChange.bind(this);
        this.handleFilenameChange = this.handleFilenameChange.bind(this);
        this.submit = this.submit.bind(this);
    }

    updateCode(editor, meta, code) {
        this.setState({code});
    }

    handleIntervalChange(newInterval) {
        this.setState({interval: newInterval});
    }

    handleFilenameChange(e) {
        this.setState({filename: e.target.value});
    }

    submit() {
        if (!this.state.code || !this.state.code.length) {
            return this.setState({
                error: 'Please enter the query to be scheduled above.'
            });
        }
        // if (!this.state.filename) {
        //     return this.setState({
        //         error: 'Please enter a filename for your scheduled query.'
        //     });
        // }
        if (!this.state.interval) {
            return this.setState({error: 'Please select an interval above.'});
        }

        this.setState({saving: true, error: null});
        this.props
            .onSubmit({
                query: this.state.code,
                refreshInterval: DEFAULT_REFRESH_INTERVAL,
                filename: generateFilename(),
                cronInterval: this.state.interval
            })
            .then(() => {
                this.setState({successMessage: 'Scheduled query saved successfully!', saving: false});
                setTimeout(this.props.onClickAway, 2500);
            })
            .catch(error => this.setState({error: error.message, saving: false}));
    }

    render() {
        return (
            <Modal open={this.props.open} onClickAway={this.props.onClickAway} className="scheduler create-modal">
                <Column className="container " style={{width: '60%', minWidth: 640}}>
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
                                <CodeMirror
                                    options={this.options}
                                    value={this.state.code}
                                    onBeforeChange={this.updateCode}
                                />
                            </div>
                        </Row>
                        {/*
                          <Row style={rowStyleOverride}>
                              <div className="row-header">Filename</div>
                              <div className="row-body">
                                  <input
                                      placeholder="Enter filename here..."
                                      value={this.state.filename}
                                      onChange={this.handleFilenameChange}
                                  />
                              </div>
                          </Row>
                        */}
                        <Row
                            style={Object.assign({}, rowStyleOverride, {
                                marginTop: '8px',
                                borderTop: '1px solid #c8d4e3',
                                paddingTop: '24px'
                            })}
                        >
                            <div className="row-header" style={{paddingTop: 5}}>
                                Frequency
                            </div>
                            <div className="row-body" style={{minHeight: '108px'}}>
                                <CronPicker onChange={this.handleIntervalChange} />
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
                            <button type="submit" className="submit" onClick={this.submit}>
                                {this.state.saving ? 'Saving...' : 'Schedule Query'}
                            </button>
                        )}
                    </Row>
                </Column>
            </Modal>
        );
    }
}

export default CreateModal;
