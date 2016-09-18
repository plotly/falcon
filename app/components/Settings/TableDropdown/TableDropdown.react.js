import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import classnames from 'classnames';
import {keys} from 'ramda';
import * as styles from './TableDropdown.css';
import Select from 'react-select';

/*
 *    Displays in a dropdown menu all available tables
 *    using `ipc`.
 *    Sends a preset query to show all tables within a database/
 *    scheme that was chosen in the dropdown using `sessionsActions`.
 */

export default class TableDropdown extends Component {
    constructor(props) {
        super(props);
        this.testClass = this.testClass.bind(this);
        this.state = {table: null};
        this.onSelectTable = this.onSelectTable.bind(this);
    }

    onSelectTable(table) {
        if (table.value) {
            this.setState({table: table.value});
            this.props.sessionsActions.previewTables([table.value]);
        } else {
            this.setState({table: ''});
            this.props.sessionsActions.updateIpcState({previews: null});
        }
    }

    testClass(options) {
        /*
         *    'connected' if has enabled database options
         */
        return (!options[0].disabled) ? 'test-connected' : 'test-disconnected';

    }

	render() {
        const {ipc} = this.props;

        const tableNames = ipc.get('tables');

        let tablesDropdownOptions;
        /*
            disable the selector for sqlite which does not have databases, only
            tables
        */

        if (tableNames === null) {
            tablesDropdownOptions = [
                {
                    value: 'Please Select a Database',
                    label: 'Please Select a Database',
                    disabled: true
                }
            ];
        } else if (tableNames.length === 0) {
            tablesDropdownOptions = [
                {value: 'None', label: 'None Found', disabled: true}
            ];
        } else {
            tablesDropdownOptions = tableNames.toJS().map(tableName => (
                {
                    value: keys(tableName)[0], label: keys(tableName)[0],
                    disabled: false
                }
            ));
        }

        return (
            <div className={classnames(
                    styles.dropdown,
                    this.testClass(tablesDropdownOptions)
                )}
                id="test-table-dropdown"
            >
                <Select
                    name="form-field-name"
                    placeholder="Select a Table"
                    options={tablesDropdownOptions}
                    onChange={this.onSelectTable}
                    value={this.state.table}
                    resetValue="null"
                    matchPos="start"
                />
            </div>
        );
    }
}

TableDropdown.propTypes = {
    ipc: ImmutablePropTypes.map.isRequired,
    sessionsActions: PropTypes.object
};
