import React from 'react';
import PropTypes from 'prop-types';

// Workaround to use `react-data-grid-addons` in React 16
React.PropTypes = PropTypes;
React.createClass = require('create-react-class');

import ReactDataGrid from 'react-data-grid';
const {Data: {Selectors}} = require('react-data-grid-addons');

export default class SQLTable extends React.Component {
    static propTypes = {
        columnNames: PropTypes.array,
        rows: PropTypes.array
    }

    /**
     * SQLTable displays query results as a table
     *
     * @param {object} props - Component properties
     *
     * @param {Array}         props.columnNames - Array of column names
     * @param {Array.<Array>} props.rows - Array of rows
     */
    constructor(props) {
        super(props);

        /**
         * @member {object} state - Component state
         * @property {Array.<object>} state.filters - filters
         */
        this.state = {
            filters: []
        };

        /**
         * @member {Array} columns - Array of column descriptions
         */
        this.columns = this.props.columnNames.map((name, key) => {
            return {key, name, filterable: true};
        });

        /**
         * Get number of selected rows
         * @returns {number} size
         */
        this.getSize = () => {
            return this.getRows().length;
        };

        /**
         * Get selected row
         * @param {object} index - Row index
         * @returns {Array} row
         */
        this.getRow = (index) => {
            return this.getRows()[index];
        };

        /**
         * Get all the selected rows
         * @returns {Array} rows
         */
        this.getRows = () => {
            const {rows} = this.props;
            const {filters} = this.state;
            return Selectors.getRows({rows, filters});
        };

        /**
         * Handler of filter updates
         * @param {object} filter - updated filters
         * @returns {undefined}
         */
        this.onAddFilter = (filter) => {
            const filters = this.state.filters.slice();

            if (filter.filterTerm) {
                filters[filter.column.key] = filter;
            } else {
                delete filters[filter.column.key];
            }

            this.setState({filters});
        };

        /**
         * Delete all filters
         * @returns {undefined}
         */
        this.onClearFilters = () => {
            this.setState({filters: []});
        };
    }

    componentWillReceiveProps(newProps) {
        // Did columnNames change?
        const {columnNames} = this.props;
        const {columnNames: newColumnNames} = newProps;

        let isEqual = (columnNames.length === newColumnNames.length);
        for (let i = 0; isEqual && (i < columnNames); i++) {
            isEqual = isEqual && (columnNames[i] === newColumnNames[i]);
        }

        // If it did, update `this.columns`
        if (!isEqual) {
            this.columns = newColumnNames.map((name, key) => {
                return {key, name, filterable: true};
            });
        }
    }

    render() {
        return (
            <div>
                <div
                    className={'sqltable-click-overlay'}

                    style={{
                        float: 'left',
                        minWidth: '100%',
                        minHeight: '32px',
                        position: 'absolute',
                        zIndex: 2
                    }}

                    onClick={() => this.refs.reactDataGrid.onToggleFilter()}
                />
                <ReactDataGrid
                    ref={'reactDataGrid'}

                    minWidth={740}
                    minHeight={200}
                    headerRowHeight={32}
                    rowHeight={30}

                    columns={this.columns}
                    rowGetter={this.getRow}
                    rowsCount={this.getSize()}

                    enableCellSelect={true}

                    onAddFilter={this.onAddFilter}
                    onClearFilters={this.onClearFilters}
                />
                <small><code
                    style={{
                        display: 'block',
                        textAlign: 'center',
                        width: '100%'
                    }}
                >
                    (click on header to toggle row filter)
                </code></small>
            </div>
        );
    }
}
