import React from 'react';
import PropTypes from 'prop-types';

import {Controlled as CodeMirror} from 'react-codemirror2';
import CM from 'codemirror';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/sql-hint';

import {DIALECTS} from '../../../constants/constants';

export default class CodeEditor extends React.Component {
    static propTypes = {
        value: PropTypes.string,
        onChange: PropTypes.func,
        runQuery: PropTypes.func,

        dialect: PropTypes.string,
        schemaRequest: PropTypes.object
    }


    /**
     * CodeEditor displays a CodeMirror editor to run SQL queries
     *
     * @param {object} props - Component properties
     *
     * @param {string} props.dialect       - Connector dialect
     * @param {object} props.schemaRequest - /connections/:id/sql-schemas API request
     *
     * @param {string}   props.value    - Value
     * @param {onChange} props.onChange - Callback to handle a value change
     * @param {runQuery} props.runQuery - Callback to run a SQL query
     */
    constructor(props) {
        super(props);

        /**
         * @member {object} state - Component state
         * @property {object} state.tables - Tables schemas (used in hintOptions)
         */
        this.state = {
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
        const mode = {
            [DIALECTS.APACHE_SPARK]: 'text/x-sparksql',
            [DIALECTS.MYSQL]: 'text/x-mysql',
            [DIALECTS.SQLITE]: 'text/x-sqlite',
            [DIALECTS.MARIADB]: 'text/x-mariadb',
            [DIALECTS.POSTGRES]: 'text/x-pgsql',
            [DIALECTS.REDSHIFT]: 'text/x-pgsql',
            [DIALECTS.MSSQL]: 'text/x-mssql'
        }[this.props.dialect] || 'text/x-sql';

        const options = {
            lineNumbers: true,
            mode: mode,
            tabSize: 4,
            readOnly: false,
            extraKeys: {
                'Shift-Enter': this.props.runQuery
            }
        };

        return (
            <CodeMirror
                value={this.props.value}
                options={options}
                onBeforeChange={this.onBeforeChange}
                onChange={this.onChange}
            />
        );
    }
}
