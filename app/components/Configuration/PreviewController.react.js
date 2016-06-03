import React, {Component, PropTypes} from 'react';
import parse from '../../../parse';
import R from 'ramda';
import Immutable from 'immutable';
import styles from './Preview.css';

export default class PreviewController extends Component {
    constructor(props) {
        super(props);
        this.renderTable = this.renderTable.bind(this);
    }

    renderTable(table) {
        const tableHeader = table.get('columnnames').map(
            column => <th>{column}</th>
        );
        const renderCell = cell => <td>{cell}</td>;
        const tableRows = table.get('rows').map(
            row => <tr>{row.map(renderCell)}</tr>
        );
        return (
            <table>
                <thead>{tableHeader}</thead>
                <tbody>{tableRows}</tbody>
            </table>
        );
    }

    render() {
        const tables = this.props.ipc.get('tables');
        if (!tables) {
            return null;
        }

        console.warn('styles: ', styles);

        const renderedTables = tables.map(
            tableName => {
                if (this.props.ipc.has(tableName)) {
                    return (
                        <div>
                            <div className={styles.tableHeader}>{tableName}</div>
                            {this.renderTable(this.props.ipc.get(tableName))}
                        </div>
                    );
                }
            }
        );

        return (
            <div>
                {renderedTables}
            </div>
        );
    }

}
