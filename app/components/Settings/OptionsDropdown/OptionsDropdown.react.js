import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {flatten, keys, isEmpty} from 'ramda';
import * as styles from './TableDropdown.css';
import Select from 'react-select';

export default class OptionsDropdown extends Component {
    constructor(props) {
        super(props);
        this.renderSQLOptions = this.renderSQLOptions.bind(this);
        this.renderElasticsearchIndecies = this.renderElasticsearchIndecies.bind(this);
        this.renderElasticsearchDocs = this.renderElasticsearchDocs.bind(this);
        this.testClass = this.testClass.bind(this);
        this.state = {elasticsearchIndex: ''};
    }

    testClass() {
        return 'test-connected';
    }

    renderSQLOptions() {
        const {selectedTable, tablesRequest, setTable} = this.props;
        if (!tablesRequest.status) {
            return null;
        } else if (tablesRequest.status === 'loading') {
            return <div>{'Loading tables'}</div>;
        } else if (tablesRequest.status > 300) {
            // TODO - Make this prettier.
            return <div>{'Hm.. there was an error loading up your tables'}</div>;
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

    renderElasticsearchIndecies() {
        const {
            elasticsearchMappingsRequest: EMR, setIndex, index
        } = this.props;
        if (!EMR.status) {
            return null;
        } else if (EMR.status === 'loading') {
            return <div>{'Loading docs'}</div>;
        } else if (EMR.status > 300) {
            // TODO - Make this prettier.
            return <div>{'Hm.. there was an error loading up your docs'}</div>;
        } else if (EMR.status === 200) {
            const indeciesList = keys(EMR.content);
            if (indeciesList.length === 0) {
                return <div>{'No docs found'}</div>;
            } else {
                return (
                    <div className={styles.dropdown}
                        id="test-table-dropdown"
                    >
                        <Select
                            options={indeciesList.map(t => ({label: t, value: t}))}
                            value={index}
                            onChange={option => {
                                setIndex(option.value);
                            }}
                        />
                    </div>
                );
            }
        }
    }

    renderElasticsearchDocs() {
        const {
            selectedTable, index, elasticsearchMappingsRequest: EMR, setTable, credentialObject
        } = this.props;
        if (!index) {
            return null;
        } else {
            const tablesList = keys(EMR.content[index].mappings);
            if (tablesList.length === 0) {
                return <div>{'No docs found'}</div>;
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

    render() {
        return (
            <div>
                {this.renderSQLOptions()}
                {this.renderElasticsearchIndecies()}
                {this.renderElasticsearchDocs()}
            </div>
        );
    }
}
