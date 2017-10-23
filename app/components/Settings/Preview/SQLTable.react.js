import React from 'react';
import PropTypes from 'prop-types';
import {Table, Column, Cell} from 'fixed-data-table';

const SQLTable = function(props) {
    const {columnNames, rows} = props;

    return (
        <Table
            rowHeight={30}
            rowsCount={rows.length}
            width={750}
            height={200}
            headerHeight={40}
        >
            {columnNames.map(function(colName, colIndex) {
                return <Column
                    columnKey={colName}
                    key={colIndex}
                    label={colName}
                    flexgrow={1}
                    width={200}
                    header={<Cell>{colName}</Cell>}
                    cell={({rowIndex}) => (
                        <Cell
                            height={20}
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
