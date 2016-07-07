import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import classnames from 'classnames';
import * as styles from './DatabaseDropdown.css';
import Select from 'react-select';
import {DIALECTS} from '../../../constants/constants';

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
        this.testClass = this.testClass.bind(this);
    }

    testClass(options) {
        /*
            'connected' if has enabled database options
        */
        return (!options[0].disabled) ? 'test-connected' : 'test-disconnected';

    }

	render() {
        const {configuration, configActions, ipc, ipcActions} = this.props;

        const ipcDatabases = ipc.get('databases');
        let databaseDropdownOptions;
        /*
            disable the selector for sqlite which does not have databases, only
            tables
        */
        const isDisabled = configuration.get('dialect') === DIALECTS.SQLITE;
        if (ipcDatabases === null) {
            databaseDropdownOptions = [
                {value: 'None', label: 'None Found', disabled: true}
            ];
        } else {
            databaseDropdownOptions = ipcDatabases.toJS().map(database => (
                {value: database, label: database, disabled: isDisabled}
            ));
        }

        function onSelectDatabase(database) {
            configActions.update({database: database.value});
            ipcActions.selectDatabase();
        }

        return (
            <div className={classnames(
                    styles.dropdown,
                    this.testClass(databaseDropdownOptions)
                )}
                id="test-database-dropdown"
            >
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

DatabaseDropdown.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    configActions: PropTypes.object,
    ipc: ImmutablePropTypes.map.isRequired,
    ipcActions: PropTypes.object
};
