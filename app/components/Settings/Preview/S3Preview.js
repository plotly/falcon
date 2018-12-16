import React from 'react';
import PropTypes from 'prop-types';

const S3Preview = function(props) {
    const {s3KeysRequest} = props;
    if (s3KeysRequest.status >= 400) {
        return (<div>{'Hm... An error occurred while trying to load S3 keys'}</div>);
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
    }

    return null;
};

S3Preview.propTypes = {
    s3KeysRequest: PropTypes.object
};

export default S3Preview;
