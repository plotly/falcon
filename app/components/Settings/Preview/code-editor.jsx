import React from 'react';
import PropTypes from 'prop-types';

import {Controlled as CodeMirror} from 'react-codemirror2';
import CM from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sql/sql.js';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/sql-hint.js';

import {ResizableBox} from 'react-resizable';
import 'react-resizable/css/styles.css';

import './code-editor.css';

import {getHighlightMode} from '../../../constants/constants';

import clickHouseDialect from '../../../utils/codemirror/clickhouse';

// Define ClickHouse SQL dialect
CM.defineMIME("text/x-chsql", clickHouseDialect);

const MIN_CONSTRAINTS_HEIGHT = 74;

export default class CodeEditor extends React.Component {
    static propTypes = {
        value: PropTypes.string,
        onChange: PropTypes.func,
        dialect: PropTypes.string,
        runQuery: PropTypes.func,
        openScheduler: PropTypes.func,
        schemaRequest: PropTypes.object,
        isLoading: PropTypes.bool
    }


    /**
     * CodeEditor displays a CodeMirror editor to run SQL queries
     *
     * @param {object} props - Component properties
     *
     * @param {string}   props.value    - Value
     * @param {onChange} props.onChange - Callback to handle a value change
     *
     * @param {string}   props.dialect       - Connector dialect
     * @param {runQuery} props.runQuery      - Callback to run a SQL query
     * @param {object}   props.schemaRequest - /connections/:id/sql-schemas API request
     * @param {object}   props.isLoading     - true if last run query is still running
     */
    constructor(props) {
        super(props);

        /**
         * @member {object} state - Component state
         * @property {object} state.tables - Tables schemas (used in hintOptions)
         * @property {number} state.height - Height in pixels
         * @property {?number} state.width - Width in pixels
         */
        this.state = {
            height: 250,
            width: null,
            minConstraints: [200, MIN_CONSTRAINTS_HEIGHT],
            maxConstraints: [Infinity, Infinity],
            tables: CodeEditor.computeAutocompleteTables(this.props)
        };

        this.onBeforeChange = (editor, data, value) => {
            this.props.onChange(value);
        };

        this.onChange = (editor) => {
            // Don't show autocomplete after a space or semicolon
            const ch = editor.getTokenAt(editor.getCursor()).string.slice(-1);
            if (!ch || ch === ' ' || ch === ';') {
                return;
            }

            // hint options for specific plugin & general show-hint
            // 'tables' is sql-hint specific
            // 'disableKeywords' is also sql-hint specific, and undocumented but referenced in sql-hint plugin
            // Other general hint config, like 'completeSingle' and 'completeOnSingleClick'
            // should be specified here and will be honored
            const hintOptions = {
                tables: this.state.tables,
                completeSingle: false,
                completeOnSingleClick: true
            };

            // editor.hint.sql is defined when importing codemirror/addon/hint/sql-hint
            // (this is mentioned in codemirror addon documentation)
            // Reference the hint function imported here when including other hint addons
            // or supply your own
            CM.showHint(editor, CM.hint.sql, hintOptions);
        };

        this.editorDidMount = (editor) => {
            this.editor = editor;

            const wrapperElement = this.editor.getWrapperElement();
            const height = wrapperElement.clientHeight;
            const width = wrapperElement.clientWidth;

            const minConstraints = [width, MIN_CONSTRAINTS_HEIGHT];
            const maxConstraints = [width, Infinity];

            this.setState({height, width, minConstraints, maxConstraints});
        };

        this.onResize = (event, data) => {
            const height = data.size.height;

            const wrapperElement = this.editor ? this.editor.getWrapperElement() : {};
            const width = wrapperElement.clientWidth;

            if (this.editor) this.editor.setSize(width, height);

            this.setState({height, width});
        };
    }

    static computeAutocompleteTables(props) {
        const schemaRequest = props.schemaRequest || {};

        if (schemaRequest.status !== 200 || !schemaRequest.content || !schemaRequest.content.rows) {
            return {};
        }

        const codeSchema = {};
        const bareTableNames = {};

        schemaRequest.content.rows.forEach(function(row) {
            const [tableName, columnName, dataType] = row;

            let bareTableName = bareTableNames[tableName];
            if (!bareTableName) {
                bareTableName = tableName.split('.').slice(-1)[0];

                const first = bareTableName.charAt(0);
                if (first === '"' || first === '\'') {
                    bareTableName = bareTableName.slice(1);
                }

                const last = bareTableName.charAt(bareTableName.length - 1);
                if (last === '"' || last === '\'') {
                    bareTableName = bareTableName.slice(0, -1);
                }

                if (!bareTableName) return;

                bareTableNames[tableName] = bareTableName;
            }

            if (!codeSchema[bareTableName]) {
                codeSchema[bareTableName] = {};
            }

            codeSchema[bareTableName][columnName] = dataType;
        });

        return codeSchema;
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.schemaRequest !== nextProps.schemaRequest) {
            this.setState({
                tables: CodeEditor.computeAutocompleteTables(this.props)
            });
        }
    }

    render() {
        const {
            editorDidMount,
            onBeforeChange,
            onChange,
            onResize
        } = this;

        const {
            value,
            dialect,
            runQuery,
            isLoading,
            openScheduler
        } = this.props;

        const {
            height,
            width,
            minConstraints,
            maxConstraints
        } = this.state;

        const mode = getHighlightMode(dialect);

        const options = {
            lineNumbers: true,
            mode: mode,
            tabSize: 4,
            readOnly: false,
            extraKeys: {
                'Shift-Enter': runQuery
            }
        };

        return (
            <ResizableBox
                height={height}
                width={width}
                minConstraints={minConstraints}
                maxConstraints={maxConstraints}
                onResize={onResize}
            ><div>
                <CodeMirror
                    options={options}
                    value={value}
                    onBeforeChange={onBeforeChange}
                    onChange={onChange}
                    editorDidMount={editorDidMount}
                />
                <button
                    className="btn btn-secondary scheduleButton"
                    onClick={openScheduler}
                    disabled={isLoading}
                >
                    {isLoading ? 'Loading...' : 'Schedule'}
                </button>
                <a
                    className="btn btn-primary runButton"
                    onClick={runQuery}
                    disabled={isLoading}
                >
                    {isLoading ? 'Loading...' : 'Run'}
                </a>
            </div></ResizableBox>
        );
    }
}
