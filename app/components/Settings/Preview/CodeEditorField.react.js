'use es6';
import React, {Component} from 'react';
import {has, isEmpty, propOr} from 'ramda';
// https://github.com/JedWatson/react-codemirror/issues/106
import CodeMirror from '@skidding/react-codemirror';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/sql-hint';
import * as Actions from '../../../actions/sessions';

class CodeEditorField extends Component {

    constructor(props) {
        super(props);
        this.autoComplete = this.autoComplete.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.injectAutocomplete = this.injectAutocomplete.bind(this);
    }

    injectAutocomplete() {
        const {schemaRequest, preview, updatePreview} = this.props;

        if (typeof schemaRequest !== 'undefined' && typeof preview !== 'undefined' &&
            schemaRequest.status === 200 && !has('codeSchema', preview)) {

            let lastTableName = '';
            let tableName;
            let tables = {};
            let newColumnArray = [];
            let DB_HAS_ONLY_ONE_TABLE;
            const TABLE_NAME = 0;
            const COLUMN_NAME = 1;
            const DATA_TYPE = 2;
            const schema = schemaRequest.content;
            schema.rows.map(function(row, i) {
                tableName = row[TABLE_NAME];
                DB_HAS_ONLY_ONE_TABLE = (Object.keys(tables).length === 0 && i === schema.rows.length-1);
                if (tableName !== lastTableName || DB_HAS_ONLY_ONE_TABLE) {
                    if (newColumnArray.length !== 0) {
                        tables[tableName] = newColumnArray;
                    }
                    newColumnArray = [];
                    lastTableName = tableName;
                }
                newColumnArray.push(row[COLUMN_NAME]);
            });

            updatePreview({
                codeSchema: tables
            });            
        }
    }

    componentDidMount() {
        this.injectAutocomplete();
    }

    componentWillReceiveProps(nextProps) {
        this.injectAutocomplete();
    }

    autoComplete(cm) {

        const codeMirror = this.refs['CodeMirror'].getCodeMirrorInstance();

        // hint options for specific plugin & general show-hint
        // 'tables' is sql-hint specific
        // 'disableKeywords' is also sql-hint specific, and undocumented but referenced in sql-hint plugin
        // Other general hint config, like 'completeSingle' and 'completeOnSingleClick'
        // should be specified here and will be honored
        const hintOptions = {
            tables: propOr([], 'codeSchema', this.props.preview),
            completeSingle: false,
            completeOnSingleClick: true
        };

        // codeMirror.hint.sql is defined when importing codemirror/addon/hint/sql-hint
        // (this is mentioned in codemirror addon documentation)
        // Reference the hint function imported here when including other hint addons
        // or supply your own
        codeMirror.showHint(cm, codeMirror.hint.sql, hintOptions);
    }

    handleChange(newCode) {
        this.props.onChange(newCode);

        // Don't show autocomplete after a space
        let char = newCode.slice(-1);
        if (char !== ' ' && char !== ';') {
            let cm = this.refs['CodeMirror'].getCodeMirror();
            this.autoComplete(cm);
        }
    }

    render() {
        const options = {
            lineNumbers: true,
            mode: 'text/x-pgsql',
            tabSize: 4,
            readOnly: false,
            extraKeys: {
                'Shift-Enter': this.props.runQuery
            }
        };

        return (
            <CodeMirror
                ref="CodeMirror"
                value={this.props.value}
                onChange={this.handleChange}
                options={options}
            />
        );
    }
}

export default CodeEditorField;
