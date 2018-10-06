import React from 'react';
import PropTypes from 'prop-types';

const formatCalls = count => count.toLocaleString('en');
const pluralize = (word, num) => (num > 1 ? `${word}s` : word);

export const AdditionalCallsPreview = props => {
    const {additionalCalls, currTotal} = props;
    const newTotal = additionalCalls + currTotal;

    return (
        <div style={{fontSize: '12px', opacity: 0.5, marginBottom: 16}}>
            API Usage: {formatCalls(additionalCalls)} {pluralize('call', additionalCalls)}/day (new total:{' '}
            {formatCalls(newTotal)})
        </div>
    );
};
AdditionalCallsPreview.propTypes = {
    additionalCalls: PropTypes.number.isRequired,
    currTotal: PropTypes.number.isRequired
};
AdditionalCallsPreview.defaultProps = {
    additionalCalls: 0,
    currTotal: 0
};

export const toIndividualCallCountString = count => `${formatCalls(count)} API ${pluralize('call', count)} per day`;

export const IndividualCallCount = ({count}) => {
    return <span style={{fontSize: '12px', opacity: 0.5}}>{toIndividualCallCountString(count)}</span>;
};
IndividualCallCount.propTypes = {
    count: PropTypes.number.isRequired
};

export const CallCountWidget = ({count}) => {
    return (
        <React.Fragment>
            <p style={{fontSize: '12px', padding: '8px 16px', textAlign: 'center'}}>
                <span style={{fontWeight: 600, textAlign: 'center', display: 'block'}}>API Usage</span>
                {formatCalls(count)} {pluralize('call', count)}/day
                <i style={{display: 'block', textAlign: 'center'}}>for this connection</i>
            </p>
        </React.Fragment>
    );
};
CallCountWidget.propTypes = {
    count: PropTypes.number.isRequired
};
