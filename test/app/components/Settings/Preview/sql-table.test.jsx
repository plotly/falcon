jest.unmock('../../../../../app/components/Settings/Preview/sql-table.jsx');
import SQLTable from '../../../../../app/components/Settings/Preview/sql-table.jsx';
import React from 'react';
import {configure, mount} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

describe('SQLTable', () => {
    let sqlTable, columnNames, rows;

    beforeAll(() => {
        configure({adapter: new Adapter()});

        columnNames = ['col 1', 'col 2', 'col 3', 'col 4'];

        rows = [1, 2, 3, 4, 5].map(row =>
            [1, 2, 3, 4].map(col =>
                `(${row},${col})`
            )
        );

        sqlTable = mount(
            <SQLTable
                columnNames={columnNames}
                rows={rows}
            />
        );
    });

    it('honors props', () => {
        const tableHeaderCells = sqlTable.find('.react-grid-HeaderCell');

        expect(tableHeaderCells.length).toBe(columnNames.length);

        tableHeaderCells.forEach((headerCell, index) => {
            const value = headerCell.find('.widget-HeaderCell__value').first();
            expect(value.text()).toBe(columnNames[index]);
        });

        const tableRows = sqlTable.find('.react-grid-Row');

        expect(tableRows.length).toBe(rows.length);
        tableRows.forEach((tableRow, i) => {
            const tableRowCells = tableRow.find('.react-grid-Cell__value');
            tableRowCells.forEach((cell, j) => {
                const value = cell.childAt(0).childAt(0).childAt(0);
                expect(value.text()).toBe(rows[i][j]);
            });
        });
    });

    it('can toggle row filters', () => {
        const overlay = sqlTable.find('.sqltable-click-overlay').first();

        // before clicking
        expect(sqlTable.find('.react-grid-HeaderRow').length).toBe(1);

        overlay.simulate('click');

        // after clicking
        expect(sqlTable.find('.react-grid-HeaderRow').length).toBe(2);
    });
});
