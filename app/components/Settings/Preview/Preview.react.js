import React, {Component, PropTypes} from 'react';
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

    renderTable(columnnames, rows) {
        const tableHeaders = columnnames.map(
            column => <th>{column}</th>
        );
        const isObject = (arg) => typeof arg === 'object';
        const renderCell = cell => <td>{isObject(cell) ? JSON.stringify(cell) : cell}</td>;
        const tableRows = rows.map(
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
        const TablePreview = () => {
            const {previewTableRequest} = this.props;
            if (previewTableRequest.status >= 400) {
                return (<div>{'Hm... An error while trying to load this table'}</div>);
            } else if (previewTableRequest.status === 'loading') {
                return (<div>{'Loading...'}</div>);
            } else if (previewTableRequest.status === 200) {
                const {columnnames, rows} = previewTableRequest.content;
                return (
                    this.renderTable(columnnames, rows)
                );
            } else {
                return null;
            }
        };

        const S3Preview = () => {
            const {s3KeysRequest} = this.props;
            if (s3KeysRequest.status >= 400) {
                return (<div>{'Hm... An error while trying to load S3 keys'}</div>);
            } else if (s3KeysRequest.status === 'loading') {
                return (<div>{'Loading...'}</div>);
            } else if (s3KeysRequest.status === 200) {
                return (
                    <div>
                        <h5>CSV Files on S3</h5>
                        <div style={{maxHeight: 500, overflowY: 'auto'}}>
                            {s3KeysRequest.content.filter(object => object.Key.endsWith('.csv'))
                                .map(object => <div>{object.Key}</div>
                            )}
                        </div>
                    </div>
                );
            } else {
                return null;
            }
        };

        const ApacheDrillPreview = () => {
            const {
                apacheDrillStorageRequest,
                apacheDrillS3KeysRequest
            } = this.props;
            if (apacheDrillStorageRequest.status >= 400) {
                return (<div>{'Hm... An error while trying to load Apache Drill'}</div>);
            } else if (apacheDrillStorageRequest.status === 'loading') {
                return (<div>{'Loading...'}</div>);
            } else if (apacheDrillStorageRequest.status === 200) {
                const storage = (
                    <div>
                        <h5>Enabled Apache Drill Storage Plugins</h5>
                        <div style={{maxHeight: 500, overflowY: 'auto'}}>
                            {apacheDrillStorageRequest.content
                                .filter(object => object.config.enabled)
                                .map(object => (
                                    <div>{`${object.name} - ${object.config.connection}`}</div>
                                ))
                            }
                        </div>
                    </div>
                );

                let availableFiles = null;
                if (apacheDrillS3KeysRequest.status === 200) {
                    const parquetFiles = apacheDrillS3KeysRequest
                        .content
                        .filter(object => object.Key.indexOf('.parquet') > -1)
                        .map(object => object.Key.slice(0, object.Key.indexOf('.parquet')) + '.parquet');
                    const uniqueParquetFiles = [];
                    parquetFiles.forEach(file => {
                        if (uniqueParquetFiles.indexOf(file) === -1) {
                            uniqueParquetFiles.push(file);
                        }
                    });
                    if (uniqueParquetFiles.length === 0) {
                        availableFiles = (
                            <div>
                                Heads up! It looks like no .parquet files were
                                found in this S3 bucket.
                            </div>
                        );
                    } else {
                        availableFiles = (
                            <div>
                                <h5>Available Parquet Files on S3</h5>
                                <div style={{maxHeight: 500, overflowY: 'auto'}}>
                                    {uniqueParquetFiles.map(key => (
                                        <div>{`${key}`}</div>
                                    ))}
                                </div>
                            </div>
                        );
                    }
                }
                return (
                    <div>
                        {storage}
                        {availableFiles}
                    </div>
                );
            } else {
                return null;
            }
        };

        return (
            <div className={styles.previewContainer}>
                {TablePreview()}
                {S3Preview()}
                {ApacheDrillPreview()}
            </div>
        );
    }
}
