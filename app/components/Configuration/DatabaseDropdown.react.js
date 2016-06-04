import React, {Component, PropTypes} from 'react';
import styles from './DatabaseDropdown.css';
import Select from 'react-select';
import {ENGINES} from './SupportedEngines.react';

/*
    Displays in a dropdown menu all available databases/schemes
    using `ipc`.
    Permits to alter the `configuration` database parameter once
    user selects an option.
    Sends a preset query to show all tables within a database/
    scheme that was chosen in the dropdown using `ipcActions`.
*/

export default class DatabaseDropdown extends Component {
    constructor(props) {
        super(props);
    }

	render() {
        const {configuration, ipc, ipcActions, merge} = this.props;

        const ipcDatabases = ipc.get('databases');
        let databaseDropdownOptions;
        let isDisabled = configuration.get('engine') === ENGINES.SQLITE;

        if (ipcDatabases) {
            databaseDropdownOptions = ipcDatabases.toJS().map(database => (
                {
                    /*
                        the keys of the database object returned differ
                        by database engines, so use whatever key is there
                    */
                    value: database[Object.keys(database)],
                    label: database[Object.keys(database)],
                    disabled: isDisabled
                }
            ));
        } else {
            databaseDropdownOptions = [
                {value: 'None', label: 'None Found', disabled: true}
            ];
        }

        function onSelectDatabase(database) {
            merge({database: database.value});
            ipcActions.selectDatabase();
        }

        return (
            <div className={styles.dropdown}>
                <Select
                    name="form-field-name"
                    placeholder="Select a Database"
                    options={databaseDropdownOptions}
                    onChange={onSelectDatabase}
                    value={configuration.get('database')}
                    resetValue="null"
                    matchPos="start"
                />
            </div>
        );
    }
}
