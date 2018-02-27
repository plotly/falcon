import React, {Component} from 'react';
import PropTypes from 'prop-types';
import SQLOptions from './sql-options';
import ESIndicesOptions from './es-indices-options';
import ESDocsOptions from './es-docs-options';

export default class OptionsDropdown extends Component {

    static propTypes = {
        // See type of react-select's Select `value` property
        selectedTable: PropTypes.string,
        selectedIndex: PropTypes.string,

        tablesRequest: PropTypes.object,
        setTable: PropTypes.func,
        elasticsearchMappingsRequest: PropTypes.object,
        setIndex: PropTypes.func
    }

    /**
     * Options Dropdown is an options drop down
     * @param {object} props  - Component Properties
     * @param {object} props.selectedTable - The selected table
     * @param {object} props.tablesRequest - The Requested Table
     * @param {function} props.setTable - The set table function
     * @param {object} props.elasticsearchMappingsRequest - The ES Mapping Request
     * @param {object} props.selectedTable - The selected table
     * @param {object} props.selectedIndex - The Selected Index
     * @param {function} props.setIndex - The Set the index
     */
    constructor(props) {
        super(props);
    }

    render() {
        const {
            selectedTable,
            tablesRequest,
            setTable,
            elasticsearchMappingsRequest: EMR,
            setIndex,
            selectedIndex
        } = this.props;
        return (
            <div style={{marginTop: '25px'}}>
                <SQLOptions selectedTable={selectedTable}
                            tablesRequest={tablesRequest}
                            setTable={setTable}
                />
                <ESIndicesOptions elasticsearchMappingsRequest={EMR}
                                  setIndex={setIndex}
                                  selectedIndex={selectedIndex}
                />
                <ESDocsOptions selectedTable={selectedTable}
                                selectedIndex={selectedIndex}
                                elasticsearchMappingsRequest={EMR}
                                setTable={setTable}
                />
            </div>
        );
    }
}
