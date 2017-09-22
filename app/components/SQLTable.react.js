import React from 'react';

export default function SQLTable(props) {
	const {columnNames, rows} = props;

	return (
	    <Table
	        rowHeight={50}
	        rowsCount={rows.length}
	        width={800}
	        height={200}
	        headerHeight={40}
	        {...this.props}>
	        {columnNames.map(function(colName, colIndex){
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
	                        {...props}
	                    >
	                        {rows[rowIndex][colIndex]}
	                    </Cell>
	                )}
	            />;
	        })}
	    </Table>
	);
}