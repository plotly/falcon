import React from 'react';
import {Table, Column, Cell} from 'fixed-data-table';

export default function SQLTable(props) {
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
                    cell={({rowIndex, ...props}) => (
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
}
