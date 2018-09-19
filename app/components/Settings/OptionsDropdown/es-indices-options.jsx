import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {keys} from 'ramda';
import Select from 'react-select';

export default class ESIndicesOptions extends Component {
    static propTypes = {
        elasticsearchMappingsRequest: PropTypes.object,
        setIndex: PropTypes.func,
        selectedIndex: PropTypes.string
    };

    /**
     * ES Indicies Options is an options drop down
     * @param {object} props  - Component Properties
     * @param {object} props.elasticsearchMappingsRequest - The ES Mapping Request
     * @param {object} props.setIndex - The Set Index Function
     * @param {object} props.selectedIndex - The Selected Index
     */
    constructor(props) {
        super(props);
    }

    render() {
        const {
            elasticsearchMappingsRequest: EMR,
            setIndex,
            selectedIndex
        } = this.props;
        if (!EMR.status) {
            return null;
        } else if (EMR.status === 'loading') {
            return <div>{'Loading docs'}</div>;
        } else if (EMR.status > 300) {
            // TODO - Make this prettier.
            return (
                <div>
                    <div>{'There was an error loading up your docs'}</div>
                    <div style={{color: '#EF553B'}}>{JSON.stringify(EMR)}</div>
                </div>
            );
        } else if (EMR.status === 200) {
            const indeciesList = keys(EMR.content);
            if (indeciesList.length === 0) {
                return <div>{'No docs found'}</div>;
            }
            return (
                <div className={'dropdown'}
                    id="test-table-dropdown"
                >
                    <Select
                        options={indeciesList.map(t => ({label: t, value: t}))}
                        value={selectedIndex}
                        searchable={false}
                        onChange={option => {
                            setIndex(option.value);
                        }}
                    />
                </div>
            );
        }
    }
}
