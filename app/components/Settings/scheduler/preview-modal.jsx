import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {Controlled as CodeMirror} from 'react-codemirror2';
import ms from 'ms';
import cronstrue from 'cronstrue';

import Modal from '../../modal.jsx';
import SuccessMessage from '../../success.jsx';
import RequestError from './request-error.jsx';
import TimedMessage from './timed-message.jsx';
import {Link} from '../../Link.react.js';
import CronPicker from '../cron-picker/cron-picker.jsx';
import {Row, Column} from '../../layout.jsx';
import SQL from './sql.jsx';
import {plotlyUrl} from '../../../utils/utils.js';
import {
    getHighlightMode,
    DEFAULT_REFRESH_INTERVAL,
    WAITING_MESSAGE,
    SAVE_WARNING
} from '../../../constants/constants.js';
import {getInitialCronMode} from '../cron-picker/cron-helpers.js';

const NO_OP = () => {};

const rowStyle = {
    justifyContent: 'flex-start',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    padding: '12px 0px'
};
const keyStyle = {boxSizing: 'border-box', width: '35%'};
const valueStyle = {boxSizing: 'border-box', width: '65%'};
const noMargin = {margin: 0};

// implements a modal window to view details of a scheduled query
export class PreviewModal extends Component {
    static defaultProps = {
        onSave: NO_OP,
        onDelete: NO_OP,
        onLogin: NO_OP,
        onClickAway: NO_OP,
        openQueryPage: NO_OP
    };
    static propTypes = {
        query: PropTypes.object,
        onSave: PropTypes.func,
        onDelete: PropTypes.func,
        onLogin: PropTypes.func,
        openQueryPage: PropTypes.func,
        onClickAway: PropTypes.func,
        dialect: PropTypes.string,
        currentRequestor: PropTypes.string
    };
    constructor(props) {
        super(props);
        this.state = {
            successMessage: null,
            editing: false,
            code: props.query && props.query.query,
            cronInterval: props.query && props.query.cronInterval,
            name: props.query && props.query.name,
            confirmedDelete: false,
            loading: false
        };
        this.updateCode = this.updateCode.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.close = this.close.bind(this);
        this.renderButtonRow = this.renderButtonRow.bind(this);
        this.handleIntervalChange = this.handleIntervalChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
    }

    updateCode(editor, meta, code) {
        this.setState({code});
    }

    handleIntervalChange(newInterval) {
        this.setState({cronInterval: newInterval});
    }

    handleNameChange(e) {
        this.setState({name: e.target.value});
    }

    onSubmit() {
        if (this.state.editing) {
            const {connectionId, fid, requestor, uids, refreshInterval} = this.props.query;
            const {code: query, cronInterval, name} = this.state;
            this.setState({loading: true, error: null});
            this.props
                .onSave({
                    connectionId,
                    fid,
                    requestor,
                    uids,
                    query,
                    name,
                    cronInterval,
                    refreshInterval: refreshInterval || DEFAULT_REFRESH_INTERVAL
                })
                .then(() => {
                    this.setState({
                        successMessage: 'Query saved successfully!',
                        loading: false,
                        editing: false,
                        confirmedDelete: false
                    });
                })
                .catch(error => this.setState({error: error.message, loading: false}));
        } else {
            this.setState({editing: true, confirmedDelete: false});
        }
    }

    onDelete() {
        if (this.state.confirmedDelete) {
            this.setState({confirmedDelete: false}, () => {
                this.props.onDelete(this.props.query.fid);
            });
        } else {
            this.setState({confirmedDelete: true});
        }
    }

    close() {
        this.setState({confirmedDelete: false, editing: false});
        this.props.onClickAway();
    }

    renderButtonRow() {
        const {loading, editing} = this.state;
        const canEdit = this.props.currentRequestor && this.props.currentRequestor === this.props.query.requestor;
        const success = this.state.successMessage;

        if (!canEdit) {
            return (
                <button style={noMargin} onClick={this.props.onLogin}>
                    Log in to edit query
                </button>
            );
        }

        if (success) {
            return <SuccessMessage>{this.state.successMessage}</SuccessMessage>;
        }

        if (editing) {
            return (
                <Column>
                    <button style={noMargin} onClick={this.onSubmit}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <div style={{fontSize: 12, margin: '16px 0px 0px', opacity: 0.7}}>{SAVE_WARNING}</div>
                </Column>
            );
        }

        return (
            <Fragment>
                <button style={noMargin} onClick={this.onSubmit}>
                    Edit
                </button>
                <button
                    style={{
                        margin: 0,
                        border: 'none',
                        background: 'red'
                    }}
                    onClick={this.onDelete}
                >
                    {this.state.confirmedDelete ? 'Click to confirm' : 'Delete'}
                </button>
            </Fragment>
        );
    }

    render() {
        const props = this.props;

        let content;
        if (!props.query) {
            content = null;
        } else {
            const [account, gridId] = props.query.fid.split(':');
            const link = `${plotlyUrl()}/~${account}/${gridId}`;
            const {editing, loading} = this.state;

            const initialModeId = getInitialCronMode(props.query);

            content = (
                <Column style={{width: '60%', maxHeight: '100vh', minWidth: 640, background: 'white'}}>
                    <Row
                        className="sql-preview"
                        style={{
                            padding: '16px 32px',
                            position: 'relative',
                            justifyContent: 'flex-start'
                        }}
                    >
                        <h5 className="sql-preview ellipsis" style={{...noMargin, letterSpacing: '1px'}}>
                            {this.state.name ? <b>{this.state.name}</b> : <SQL className="bold">{this.state.code}</SQL>}
                        </h5>
                        <button
                            onClick={this.close}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                padding: '2px 4px'
                            }}
                        >
                            &times;
                        </button>
                    </Row>
                    <Column style={{background: '#F5F7FB', padding: '16px 32px'}}>
                        <Row style={rowStyle}>
                            <div style={keyStyle}>Query</div>
                            <div className="sql-preview scheduler" style={{...valueStyle, overflowY: 'auto'}}>
                                {editing ? (
                                    <div>
                                        <CodeMirror
                                            options={{
                                                lineNumbers: true,
                                                lineWrapping: true,
                                                tabSize: 4,
                                                readOnly: false,
                                                mode: getHighlightMode(this.props.dialect)
                                            }}
                                            value={this.state.code}
                                            onBeforeChange={this.updateCode}
                                        />
                                    </div>
                                ) : (
                                    <SQL className="default wrap">{this.state.code}</SQL>
                                )}
                            </div>
                        </Row>
                        {(this.state.name || editing) && (
                            <Row style={rowStyle}>
                                <div style={keyStyle}>Query Name</div>
                                {editing ? (
                                    <input
                                        maxLength="150"
                                        style={noMargin}
                                        placeholder="Enter query name here..."
                                        value={this.state.name}
                                        onChange={this.handleNameChange}
                                    />
                                ) : (
                                    <em style={valueStyle}>
                                        <b>{this.state.name}</b>
                                    </em>
                                )}
                            </Row>
                        )}
                        <Row style={rowStyle}>
                            <div style={keyStyle}>Schedule</div>
                            {editing ? (
                                <div style={{width: '65%', minHeight: '108px'}}>
                                    <CronPicker onChange={this.handleIntervalChange} initialModeId={initialModeId} />
                                </div>
                            ) : (
                                <em style={valueStyle}>
                                    {props.query.cronInterval ? (
                                        <b>{cronstrue.toString(this.state.cronInterval)}</b>
                                    ) : (
                                        <React.Fragment>
                                            Runs every{' '}
                                            <b>
                                                {ms(props.query.refreshInterval * 1000, {
                                                    long: true
                                                })}
                                            </b>
                                        </React.Fragment>
                                    )}
                                </em>
                            )}
                        </Row>
                        <Row style={rowStyle}>
                            <div style={keyStyle}>Live Dataset</div>
                            <Link href={link} style={valueStyle}>
                                {link}
                            </Link>
                        </Row>
                        {this.state.error && (
                            <Row style={rowStyle}>
                                <RequestError onClick={this.props.openQueryPage}>{this.state.error}</RequestError>
                            </Row>
                        )}
                        {loading && (
                            <Row style={{justifyContent: 'flex-start'}}>
                                <TimedMessage>
                                    <div style={{fontSize: 16, paddingTop: 16}}>{WAITING_MESSAGE}</div>
                                </TimedMessage>
                            </Row>
                        )}
                        <Row
                            style={{
                                ...rowStyle,
                                justifyContent: 'space-between',
                                border: 'none',
                                marginTop: 48,
                                paddingBottom: 0
                            }}
                        >
                            {this.renderButtonRow()}
                        </Row>
                    </Column>
                </Column>
            );
        }

        return (
            <Modal onClickAway={this.close} className="meta-preview" open={props.query !== null}>
                {content}
            </Modal>
        );
    }
}

export default PreviewModal;
