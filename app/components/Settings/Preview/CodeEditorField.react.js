'use es6';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import CodeMirror from 'react-codemirror';
// assuming a setup with webpack/create-react-app import the additional js/css files
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/sql-hint';
import * as Actions from '../../../actions/sessions';

class CodeEditorField extends Component {

    constructor(props) {
        super(props);
        this.autoComplete = this.autoComplete.bind(this);
        this.handleChange = this.handleChange.bind(this);

        this.state = {
            tables: {}
        }
    }

    componentDidMount() {
        const {connectionObject, dispatch}  = this.props;
        const p = dispatch(Actions.getSqlSchema(
            connectionObject.id,
            connectionObject.dialect,
            connectionObject.database
        ));

        p.then( (schema) => {
            let lastTableName = '';
            let tableName;
            let tables = {};
            let newColumnArray = [];
            const TABLE_NAME = 2;
            const COLUMN_NAME = 3;
            const DATA_TYPE = 7;            
            schema.rows.map(function(row) {
                tableName = row[TABLE_NAME];
                if (tableName !== lastTableName) {
                    if (newColumnArray.length !== 0) {
                        tables[tableName] = newColumnArray;
                    }
                    newColumnArray = [];
                    lastTableName = tableName;
                }
                newColumnArray.push(row[COLUMN_NAME]);
            });
            this.setState({tables: tables});
        })
        .catch(function(error) {
            console.error(error);
        });
    }

    autoComplete(cm) {

        const codeMirror = this.refs['CodeMirror'].getCodeMirrorInstance();

        // hint options for specific plugin & general show-hint
        // 'tables' is sql-hint specific
        // 'disableKeywords' is also sql-hint specific, and undocumented but referenced in sql-hint plugin
        // Other general hint config, like 'completeSingle' and 'completeOnSingleClick' 
        // should be specified here and will be honored
        const hintOptions = {
            tables: this.state.tables,
            disableKeywords: false,
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

export default connect()(CodeEditorField);