import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './Preview.css';

export default class Preview extends Component {
    constructor(props) {
        super(props);
        this.renderTable = this.renderTable.bind(this);
        this.testClass = this.testClass.bind(this);
    }

    testClass() {
        return 'test-connected';
    }

    renderTable(table) {
        const tableHeaders = table.get('columnnames').map(
            column => <th>{column}</th>
        );

        const renderCell = cell => <td>{cell}</td>;
        const tableRows = table.get('rows').map(
            row => <tr>{row.map(renderCell)}</tr>
        );
        return (
            <table>
                <thead>{tableHeaders}</thead>
                <tbody>{tableRows}</tbody>
            </table>
        );
    }

    render() {
        const {ipc} = this.props;
        const previews = ipc.get('previews');

        if (!previews) {
            return null;
        }

        const renderedTables = previews.map(
            preview => {
                const tableName = preview.keySeq().first();
                if (preview.get(tableName)) {
                    return (
                        <div>
                            <div className={styles.tableHeader}>
                                Preview of table: <u>{tableName}</u>
                            </div>
                            {this.renderTable(preview.get(tableName))}
                        </div>
                    );
                }
            }
        );

        return (
            <div id="test-tables" className={this.testClass()}>
                {renderedTables}
            </div>
        );
    }
}

Preview.propTypes = {
    ipcActions: PropTypes.object,
    ipc: ImmutablePropTypes.map.isRequired
};
