import React, {Component, PropTypes} from 'react';
import styles from './DatabaseDropdown.css';
import Select from 'react-select';

export default class DatabaseDropdown extends Component {
    constructor(props) {
        super(props);
    }

	render() {
        const {ipc, ipcActions, setValue} = this.props;

        const ipcDatabases = ipc.get('databases');
        let databaseDropdownOptions;
        if (ipcDatabases) {
            databaseDropdownOptions = ipcDatabases.toJS().map(database => (
                { value: database.Database, label: database.Database }
            ));
        } else {
            databaseDropdownOptions = [
                {value: 'None', label: 'None Found', disabled: true }
            ];
        }

        function onSelectDatabase(database) {
            setValue({key: 'database', value: database.value});
            ipcActions.useDatabase();
        }

        return (
            <div className={styles.dropdown}>
                <Select
                    name="form-field-name"
                    placeholder="Select Your Database"
                    options={databaseDropdownOptions}
                    onChange={onSelectDatabase}
                />
            </div>
        );
    }
}
