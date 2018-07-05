import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import { Controlled as CodeMirror } from 'react-codemirror2';

import { Row, Column } from '../../layout.jsx';
import Modal from '../../modal.jsx';
import { mapDialect } from './util.js';

function noop() {}

const FREQUENCIES = [
    { label: 'Run every minute', value: 60 },
    { label: 'Run every 5 minutes', value: 5 * 60 },
    { label: 'Run hourly', value: 60 * 60 },
    { label: 'Run daily', value: 24 * 60 * 60 },
    { label: 'Run weekly', value: 7 * 24 * 60 * 60 }
];

const styles = {
    column: { width: '60%', background: '#F5F7FB' },
    innerColumn: { background: '#fff', position: 'relative' },
    header: { marginBottom: '16px', padding: '0 32px' },
    button: {
        position: 'absolute',
        top: '16px',
        right: '16px',
        padding: '2px 4px'
    },
    detailsColumn: { padding: '0 32px' },
    p: { margin: '32px 0', padding: '16px' },
    submit: {
        width: '100%',
        margin: '24px 32px 32px'
    },
    row: { justifyContent: 'flex-start' },
    input: {
        margin: '0 0 16px',
        width: '70%'
    },
    dropdown: {
        padding: 0,
        marginBottom: '16px',
        width: '100%',
        maxWidth: '432px'
    }
};

const rowStyles = {
    header: { width: '20%' },
    body: { width: '80%' }
};

const Error = props => <div className="errorMessage">{props.message}</div>;
Error.propTypes = {
    message: PropTypes.string.isRequired
};

export const FrequencySelector = props => (
    <Select
        options={FREQUENCIES}
        value={props.value}
        searchable={false}
        onChange={props.onChange}
    />
);
FrequencySelector.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func
};

class CreateModal extends Component {
    static propTypes = {
        initialCode: PropTypes.string,
        initialFilename: PropTypes.string,
        onClickAway: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired,
        open: PropTypes.bool,
        dialect: PropTypes.string
    };
    static defaultProps = {
        initialCode: '',
        onClickAway: noop,
        onSubmit: noop
    };
    constructor(props) {
        super(props);

        this.state = {
            code: props.initialCode,
            filename: props.initialFilename,
            intervalType: null,
            error: null
        };
        this.options = {
            lineNumbers: true,
            tabSize: 4,
            readOnly: false,
            extraKeys: {},
            mode: mapDialect(this.props.dialect)
        };
        this.updateCode = this.updateCode.bind(this);
        this.handleIntervalChange = this.handleIntervalChange.bind(this);
        this.handleFilenameChange = this.handleFilenameChange.bind(this);
        this.submit = this.submit.bind(this);
    }

    updateCode(editor, meta, code) {
        this.setState({ code });
    }

    handleIntervalChange(intervalType) {
        this.setState({ intervalType });
    }

    handleFilenameChange(e) {
        this.setState({ filename: e.target.value });
    }

    submit() {
        if (!this.state.code || !this.state.code.length) {
            return this.setState({
                error: 'Please enter the query to be scheduled above.'
            });
        }
        if (!this.state.filename || !this.state.filename.length) {
            return this.setState({
                error: 'Please enter a filename for your scheduled query.'
            });
        }
        if (!this.state.intervalType || !this.state.intervalType.value) {
            return this.setState({ error: 'Please select a frequency above.' });
        }
        this.props.onSubmit({
            query: this.state.code,
            refreshInterval: this.state.intervalType.value,
            filename: this.state.filename
        });
        this.setState({
            code: '',
            filename: '',
            intervalType: null,
            error: null
        });
    }

    render() {
        return (
            <Modal
                open={this.props.open}
                onClickAway={this.props.onClickAway}
                className="scheduler"
            >
                <Column style={styles.column}>
                    <Row>
                        <Column style={styles.innerColumn}>
                            <h5 style={styles.header}>
                                Create Scheduled Query
                            </h5>
                            <button
                                onClick={this.props.onClickAway}
                                style={styles.button}
                            >
                                &times;
                            </button>
                        </Column>
                    </Row>
                    <Column style={styles.detailsColumn}>
                        <Row>
                            <p style={styles.p}>
                                A scheduled query runs and updates its
                                corresponding dataset in Plotly Cloud. Learn
                                more about scheduled queries here.
                            </p>
                        </Row>
                        <Row style={styles.row}>
                            <div style={rowStyles.header}>Query</div>
                            <div style={rowStyles.body}>
                                <CodeMirror
                                    options={this.options}
                                    value={this.state.code}
                                    onBeforeChange={this.updateCode}
                                />
                            </div>
                        </Row>
                        <Row style={styles.row}>
                            <div style={rowStyles.header}>Filename</div>
                            <div style={rowStyles.body}>
                                <input
                                    style={styles.input}
                                    placeholder="Enter filename here..."
                                    value={this.state.filename}
                                    onChange={this.handleFilenameChange}
                                />
                            </div>
                        </Row>
                        <Row style={styles.row}>
                            <div style={rowStyles.header}>Frequency</div>
                            <div style={rowStyles.body}>
                                <div
                                    className="dropdown"
                                    style={styles.dropdown}
                                >
                                    <FrequencySelector
                                        value={this.state.intervalType}
                                        onChange={this.handleIntervalChange}
                                    />
                                </div>
                            </div>
                        </Row>
                        {this.state.error && (
                            <Row style={styles.row}>
                                <Error message={this.state.error} />
                            </Row>
                        )}
                    </Column>
                    <Row>
                        <button
                            type="submit"
                            style={styles.submit}
                            onClick={this.submit}
                        >
                            Schedule Query
                        </button>
                    </Row>
                </Column>
            </Modal>
        );
    }
}

export default CreateModal;
