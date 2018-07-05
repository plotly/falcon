import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import { Controlled as CodeMirror } from 'react-codemirror2';

import { Row, Column } from '../../layout.jsx';
import Modal from '../../modal.jsx';
import Error from '../../error.jsx';

import { getHighlightMode } from '../../../constants/constants.js';

import './create-modal.css';

function noop() {}

const FREQUENCIES = [
    { label: 'Run every minute', value: 60 },
    { label: 'Run every 5 minutes', value: 5 * 60 },
    { label: 'Run hourly', value: 60 * 60 },
    { label: 'Run daily', value: 24 * 60 * 60 },
    { label: 'Run weekly', value: 7 * 24 * 60 * 60 }
];

const rowStyleOverride = { justifyContent: 'flex-start' };

function generateFilename() {
  let n = Math.floor(Math.random() * 1e8).toString();

  // Pad 0 if needed
  if (n.length < 8) {
    n = `0${n}`;
  }

  return `Grid ${n}`;
}

export const FrequencySelector = props => (
    <Select
        options={FREQUENCIES}
        value={props.value}
        searchable={false}
        onChange={props.onChange}
    />
);
FrequencySelector.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func
};

// implements a modal window to schedule a new query
class CreateModal extends Component {
    static propTypes = {
        initialCode: PropTypes.string,
        // `initialFilename` currently unused but will be implemented once backend supports
        initialFilename: PropTypes.string,
        onClickAway: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired,
        open: PropTypes.bool,
        dialect: PropTypes.string
    };
    static defaultProps = {
        initialCode: '',
        initialFilename: '',
        onClickAway: noop,
        onSubmit: noop
    };
    constructor(props) {
        super(props);

        this.state = {
            code: props.initialCode,
            filename: props.initialFilename || generateFilename(),
            intervalType: null,
            error: null,
            loading: false
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
        this.setState({ code });
    }

    handleIntervalChange({ value: intervalType }) {
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
        // if (!this.state.filename || !this.state.filename.length) {
        //     return this.setState({
        //         error: 'Please enter a filename for your scheduled query.'
        //     });
        // }
        if (!this.state.intervalType) {
            return this.setState({ error: 'Please select a frequency above.' });
        }
        this.setState({ loading: true });
        this.props.onSubmit({
            query: this.state.code,
            refreshInterval: this.state.intervalType,
            filename: this.state.filename
        })
        .then(() => {
            this.setState({
                code: '',
                filename: '',
                intervalType: null,
                error: null
            });
        })
        .catch(error => this.setState({ error: error.message }))
        .then(() => this.setState({ loading: false }));
    }

    render() {
        return (
            <Modal
                open={this.props.open}
                onClickAway={this.props.onClickAway}
                className="scheduler create-modal"
            >
                <Column className="container " style={{ width: '60%' }}>
                    <Row>
                        <Column className="innerColumn">
                            <h5 className="header">
                                Create Scheduled Query
                            </h5>
                            <button
                                className="button"
                                onClick={this.props.onClickAway}
                            >
                                &times;
                            </button>
                        </Column>
                    </Row>
                    <Column className="detailsColumn">
                        <Row>
                            <p>
                                A scheduled query runs and updates its
                                corresponding dataset in Plotly Cloud. Learn
                                more about scheduled queries here.
                            </p>
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
                        <Row style={rowStyleOverride}>
                            <div className="row-header">Frequency</div>
                            <div className="row-body">
                                <div className="dropdown">
                                    <FrequencySelector
                                        value={this.state.intervalType}
                                        onChange={this.handleIntervalChange}
                                    />
                                </div>
                            </div>
                        </Row>
                        {this.state.error && (
                            <Row style={rowStyleOverride}>
                                <Error message={this.state.error} />
                            </Row>
                        )}
                    </Column>
                    <Row>
                        <button
                            type="submit"
                            className="submit"
                            onClick={this.submit}
                        >
                            {this.state.loading ? 'Loading...' : 'Schedule Query'}
                        </button>
                    </Row>
                </Column>
            </Modal>
        );
    }
}

export default CreateModal;
