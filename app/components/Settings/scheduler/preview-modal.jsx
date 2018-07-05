import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { Controlled as CodeMirror } from 'react-codemirror2';
import ms from 'ms';

import Modal from '../../modal.jsx';
import { Link } from '../../Link.react.js';
import { FrequencySelector } from './create-modal.jsx';
import { Row, Column } from '../../layout.jsx';
import SQL from './sql.jsx';
import { plotlyUrl } from '../../../utils/utils.js';
import { getHighlightMode } from '../../../constants/constants.js';

const NO_OP = () => {};

const rowStyle = {
    justifyContent: 'flex-start',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    padding: '16px 0px'
};
const boxStyle = { boxSizing: 'border-box', width: '50%' };

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
        dialect: PropTypes.string
    };
    constructor(props) {
        super(props);
        this.state = {
            editing: false,
            code: props.query && props.query.query,
            refreshInterval: props.query && props.query.refreshInterval,
            confirmedDelete: false
        };
        this.toggleEditing = this.toggleEditing.bind(this);
        this.updateCode = this.updateCode.bind(this);
        this.updateRefreshInterval = this.updateRefreshInterval.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.close = this.close.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (
            this.props.query &&
            this.props.query.query !==
                (prevProps.query && prevProps.query.query)
        ) {
            // eslint-disable-next-line
            this.setState({
                code: this.props.query.query,
                refreshInterval: this.props.query.refreshInterval
            });
        }
    }

    updateCode(editor, meta, code) {
        this.setState({ code });
    }

    updateRefreshInterval({ value: refreshInterval }) {
        this.setState({ refreshInterval });
    }

    toggleEditing() {
        this.setState(({ editing }) => ({ editing: !editing }));
    }

    onSubmit() {
        if (this.state.editing) {
            const { connectionId, fid, requestor, uids } = this.props.query;
            const { code: query, refreshInterval } = this.state;
            this.props.onSave({
                connectionId,
                fid,
                requestor,
                uids,
                query,
                refreshInterval
            });
            this.setState({ editing: false, confirmedDelete: false });
        } else {
            this.toggleEditing();
        }
    }

    onDelete() {
        if (this.state.confirmedDelete) {
            this.setState({ confirmedDelete: false }, () => {
                this.props.onDelete(this.props.query.fid);
            });
        } else {
            this.setState({ confirmedDelete: true });
        }
    }

    close() {
        this.setState({ confirmedDelete: false });
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
            const editing = this.state.editing;
            content = (
                <Column style={{ width: '50%', background: 'white' }}>
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
                            style={{ margin: 0, letterSpacing: '1px' }}
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
                    <Column style={{ background: '#F5F7FB', padding: '32px' }}>
                        <Row style={rowStyle}>
                            <div style={boxStyle}>Query</div>
                            <div
                                className="sql-preview scheduler"
                                style={boxStyle}
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
                            <div style={boxStyle}>Update Frequency</div>
                            {editing ? (
                                <div style={{ width: '50%' }}>
                                    <FrequencySelector
                                        value={this.state.refreshInterval}
                                        onChange={this.updateRefreshInterval}
                                    />
                                </div>
                            ) : (
                                <em style={boxStyle}>
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
                            <div style={boxStyle}>Live Dataset</div>
                            <Link href={link} style={boxStyle}>
                                {link}
                            </Link>
                        </Row>
                        <Row
                            style={{
                                ...rowStyle,
                                justifyContent: 'space-between',
                                border: 'none'
                            }}
                        >
                            <button
                                style={{ margin: 0 }}
                                onClick={this.onSubmit}
                            >
                                {editing ? 'Save' : 'Edit'}
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
                                    {this.state.confirmedDelete
                                        ? 'Click to confirm'
                                        : 'Delete'}
                                </button>
                            )}
                        </Row>
                    </Column>
                </Column>
            );
        }

        return (
            <Modal
                {...props}
                className="meta-preview"
                open={props.query !== null}
            >
                {content}
            </Modal>
        );
    }
}

export default PreviewModal;
