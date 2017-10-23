import React from 'react';
import PropTypes from 'prop-types';
import {Table, Column, Cell} from 'fixed-data-table';

const SQLTable = function(props) {
    const {columnNames, rows} = props;

    return (
        <Table
            rowHeight={50}
            rowsCount={rows.length}
            width={800}
            height={200}
            headerHeight={40}
            {...this.props}
        >
            {columnNames.map(function(colName, colIndex) {
                return <Column
                    columnKey={colName}
                    key={colIndex}
                    label={colName}
                    flexgrow={1}
                    width={200}
                    header={<Cell>{colName}</Cell>}
                    cell={({rowIndex, ...cellProps}) => (
                        <Cell
                            height={20}
                            {...cellProps}
                        >
                            {rows[rowIndex][colIndex]}
                        </Cell>
                    )}
                />;
            })}
        </Table>
    );
};

SQLTable.propTypes = {
    columnNames: PropTypes.array,
    rows: PropTypes.array
};

export default SQLTable;
