import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {keys} from 'ramda';
import Select from 'react-select';

export default class ESDocsOptions extends Component {
    static propTypes = {
        selectedTable: PropTypes.string,
        selectedIndex: PropTypes.string,
        setTable: PropTypes.func,
        elasticsearchMappingsRequest: PropTypes.object
    }

    /**
     * ES Docs Options is an options drop down
     * @param {object} props  - Component Properties
     * @param {object} props.elasticsearchMappingsRequest - The ES Mapping Request
     * @param {object} props.selectedTable - The selected table
     * @param {object} props.selectedIndex - The Selected Index
     * @param {object} props.setTable - The table
     */
    constructor(props) {
        super(props);
    }

    render() {
        const {
            selectedTable,
            selectedIndex,
            elasticsearchMappingsRequest: EMR,
            setTable
        } = this.props;

        if (!selectedIndex) {
            return null;
        }

        const tablesList = keys(EMR.content[selectedIndex].mappings);
        if (tablesList.length === 0) {
            return <div>{'No docs found'}</div>;
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