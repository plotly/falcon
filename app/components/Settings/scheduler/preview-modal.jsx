import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Controlled as CodeMirror} from 'react-codemirror2';
import ms from 'ms';

import Modal from '../../modal.jsx';
import Error from '../../error.jsx';
import {Link} from '../../Link.react.js';
import CronPicker from '../cron-picker/cron-picker.jsx';
import {Row, Column} from '../../layout.jsx';
import SQL from './sql.jsx';
import {plotlyUrl} from '../../../utils/utils.js';
import {getHighlightMode, DEFAULT_REFRESH_INTERVAL} from '../../../constants/constants.js';

const NO_OP = () => {};

const rowStyle = {
    justifyContent: 'flex-start',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    padding: '16px 0px'
};
const keyStyle = {boxSizing: 'border-box', width: '35%'};
const valueStyle = {boxSizing: 'border-box', width: '65%'};

// implements a modal window to view details of a scheduled query
export class PreviewModal extends Component {
    static defaultProps = {
        onSave: NO_OP,
        onDelete: NO_OP
    };
    static propTypes = {
        query: PropTypes.object,
        onSave: PropTypes.func,
        onDelete: PropTypes.func,
        onClickAway: PropTypes.func,
        dialect: PropTypes.string,
        loggedIn: PropTypes.bool
    };
    constructor(props) {
        super(props);
        this.state = {
            editing: false,
            code: props.query && props.query.query,
            cronInterval: null,
            confirmedDelete: false,
            loading: false
        };
        this.updateCode = this.updateCode.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.close = this.close.bind(this);
        this.handleIntervalChange = this.handleIntervalChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (
            nextProps.query &&
            nextProps.query.query !== (this.props.query && this.props.query.query)
        ) {
            this.setState({
                code: nextProps.query.query,
                refreshInterval: nextProps.query.refreshInterval
            });
        }
    }

    updateCode(editor, meta, code) {
        this.setState({code});
    }

    handleIntervalChange(newInterval) {
        this.setState({cronInterval: newInterval});
    }

    onSubmit() {
        if (this.state.editing) {
            const {connectionId, fid, requestor, uids} = this.props.query;
            const {code: query, cronInterval} = this.state;
            this.setState({loading: true});
            this.props
                .onSave({
                    connectionId,
                    fid,
                    requestor,
                    uids,
                    query,
                    cronInterval,
                    refreshInterval: DEFAULT_REFRESH_INTERVAL
                })
                .then(() =>
                    this.setState({editing: false, confirmedDelete: false})
                )
                .catch(error => this.setState({error: error.message}))
                .then(() => this.setState({loading: false}));
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

    render() {
        const props = this.props;

        let content;
        if (!props.query) {
            content = null;
        } else {
            const [account, gridId] = props.query.fid.split(':');
            const link = `${plotlyUrl()}/~${account}/${gridId}`;
            const {editing, loading} = this.state;
            content = (
                <Column style={{width: '60%', background: 'white'}}>
                    <Row
                        className="sql-preview"
                        style={{
                            padding: '32px',
                            position: 'relative',
                            justifyContent: 'flex-start'
                        }}
                    >
                        <h5
                            className="sql-preview"
                            style={{margin: 0, letterSpacing: '1px'}}
                        >
                            <SQL className="bold">{props.query.query}</SQL>
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
                    <Column style={{background: '#F5F7FB', padding: '32px'}}>
                        <Row style={rowStyle}>
                            <div style={keyStyle}>Query</div>
                            <div
                                className="sql-preview scheduler"
                                style={valueStyle}
                            >
                                {editing ? (
                                    <div>
                                        <CodeMirror
                                            options={{
                                                lineNumbers: true,
                                                tabSize: 4,
                                                readOnly: false,
                                                mode: getHighlightMode(this.props.dialect)
                                            }}
                                            value={this.state.code}
                                            onBeforeChange={this.updateCode}
                                        />
                                    </div>
                                ) : (
                                    <SQL>{props.query.query}</SQL>
                                )}
                            </div>
                        </Row>
                        <Row style={rowStyle}>
                            <div style={keyStyle}>Frequency</div>
                            {editing ? (
                                <div style={{width: '65%', minHeight: '108px'}}>
                                    <CronPicker onChange={this.handleIntervalChange} />
                                </div>
                            ) : (
                                <em style={valueStyle}>
                                    Runs every{' '}
                                    <b>
                                        {ms(
                                            props.query.refreshInterval * 1000,
                                            {
                                                long: true
                                            }
                                        )}
                                    </b>
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
                                <Error message={this.state.error} />
                            </Row>
                        )}
                        {this.props.loggedIn && (
                            <Row
                                style={{
                                    ...rowStyle,
                                    justifyContent: 'space-between',
                                    border: 'none',
                                    marginTop: 48,
                                    paddingBottom: 0
                                }}
                            >
                                <button
                                    style={{margin: 0}}
                                    onClick={this.onSubmit}
                                >
                                    {loading
                                        ? 'Loading...'
                                        : editing
                                            ? 'Save'
                                            : 'Edit'}
                                </button>
                                {!editing && (
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
                                )}
                            </Row>
                        )}
                    </Column>
                </Column>
            );
        }

        return (
            <Modal
                onClickAway={this.close}
                className="meta-preview"
                open={props.query !== null}
            >
                {content}
            </Modal>
        );
    }
}

export default PreviewModal;
