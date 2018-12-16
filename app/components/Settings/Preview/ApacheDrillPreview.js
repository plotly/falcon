
import React from 'react';
import PropTypes from 'prop-types';

const ApacheDrillPreview = function(props) {
    const {
        apacheDrillStorageRequest,
        apacheDrillS3KeysRequest
    } = props;

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
                        Heads up! It looks like no parquet files were
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
    }

    return null;
};

ApacheDrillPreview.propTypes = {
    apacheDrillStorageRequest: PropTypes.object,
    apacheDrillS3KeysRequest: PropTypes.object
};

export default ApacheDrillPreview;
