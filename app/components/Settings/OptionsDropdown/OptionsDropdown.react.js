import React, {Component} from 'react';
import PropTypes from 'prop-types';
import SQLOptions from './SQLOptions.react';
import ESIndicesOptions from './ESIndicesOptions.react';
import ESDocsOptions from './ESDocsOptions.react';

export default class OptionsDropdown extends Component {

    static propTypes = {
        // See type of react-select's Select `value` property
        selectedTable: PropTypes.any,
        selectedIndex: PropTypes.any,
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
        this.renderSQLOptions = this.renderSQLOptions.bind(this);
        this.renderElasticsearchIndecies = this.renderElasticsearchIndecies.bind(this);
        this.renderElasticsearchDocs = this.renderElasticsearchDocs.bind(this);
    }

    renderSQLOptions() {
        const {selectedTable, tablesRequest, setTable} = this.props;

        return (<SQLOptions selectedTable={selectedTable}
                            tablesRequest={tablesRequest}
                            setTable={setTable}
        />);
    }

    renderElasticsearchIndecies() {
        const {
            elasticsearchMappingsRequest: EMR,
            setIndex,
            selectedIndex
        } = this.props;

        return (<ESIndicesOptions elasticsearchMappingsRequest={EMR}
                                  setIndex={setIndex}
                                  selectedIndex={selectedIndex}
        />);
    }

    renderElasticsearchDocs() {
        const {
            selectedTable,
            selectedIndex,
            elasticsearchMappingsRequest: EMR,
            setTable
        } = this.props;

        return (<ESDocsOptions selectedTable={selectedTable}
                                selectedIndex={selectedIndex}
                                elasticsearchMappingsRequest={EMR}
                                setTable={setTable}
        />);
    }

    render() {
        return (
            <div style={{marginTop: '25px'}}>
                {this.renderSQLOptions()}
                {this.renderElasticsearchIndecies()}
                {this.renderElasticsearchDocs()}
            </div>
        );
    }
}
