import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {flatten} from 'ramda';
import * as styles from './TableDropdown.css';
import Select from 'react-select';

export default function TableDropdown(props) {
    const {selectedTable, tablesRequest, setTable} = props;
    if (!tablesRequest.status) {
        return null;
    } else if (tablesRequest.status === 'loading') {
        return <div>{'Loading tables'}</div>;
    } else if (tablesRequest.status > 300) {
        // TODO - Make this prettier.
        return <div>{'Hm.. there was an error loading up your tables.'}</div>;
    } else if (tablesRequest.status === 200) {
        const tablesList = flatten(tablesRequest.content);
        if (tablesList.length === 0) {
            return <div>{'No tables found'}</div>;
        } else {
            return (
                <div className={styles.dropdown}
                    id="test-table-dropdown"
                >
                    <Select
                        options={tablesList.map(t => ({label: t, value: t}))}
                        value={selectedTable}
                        onChange={option => {
                            setTable(option.value);
                        }}
                    />
                </div>
            );
        }
    }
}
