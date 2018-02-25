import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {flatten} from 'ramda';
import Select from 'react-select';

export default class SQLOptions extends Component {

    static propTypes = {
        selectedTable: PropTypes.any,
        tablesRequest: PropTypes.object,
        setTable: PropTypes.func
    };

    /**
     * SQLOptions is an options drop down down
     * @param {object} props  - Component Properties
     * @param {object} props.selectedTable - The selected table
     * @param {object} props.tablesRequest - The Requested Table
     * @param {function} props.setTable - The set table function
     */
    constructor(props) {
        super(props);
    }

    render() {
        const {selectedTable, tablesRequest, setTable} = this.props;
        if (!tablesRequest.status) {
            return null;
        } else if (tablesRequest.status === 'loading') {
            return <div>{'Loading tables'}</div>;
        } else if (tablesRequest.status > 300) {
            // TODO - Make this prettier.
            return (
                <div>
                    <div>{'Hm.. there was an error loading up your tables'}</div>
                    <div style={{color: 'red'}}>{JSON.stringify(tablesRequest)}</div>
                </div>
            );
        } else if (tablesRequest.status === 200) {
            const tablesList = flatten(tablesRequest.content);
            if (tablesList.length === 0) {
                return <div>{'No tables found'}</div>;
            }
            return (
                <div className={'dropdown'}
                    id="test-table-dropdown"
                >
                    <Select
                        options={tablesList.map(t => ({label: t, value: t}))}
                        value={selectedTable}
                        searchable={false}
                        onChange={option => {
                            setTable(option.value);
                        }}
                    />
                </div>
            );
        }
    }
}