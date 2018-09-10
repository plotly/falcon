import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import Tag from './tag.jsx';

const styles = {
    item: {display: 'inline-block', padding: '2px 0px'},
    tag: {marginRight: '0px'}
};
class TagValue extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div style={styles.item}>
                <span className="Select-value-label">
                    <Tag name={this.props.value.label} color={this.props.value.color} style={styles.tag} />
                </span>
            </div>
        );
    }
}

TagValue.propTypes = {
    value: PropTypes.object
};

function optionRenderer(option) {
    return <Tag color={option.color} name={option.label} />;
}

class TagPicker extends React.Component {
    render() {
        return (
            <Select
                {...this.props}
                placeholder="Select tags"
                searchable={false}
                multi={true}
                optionRenderer={optionRenderer}
                valueComponent={TagValue}
            />
        );
    }
}

TagPicker.propTypes = {
    value: PropTypes.object,
    options: PropTypes.array,
    onChange: PropTypes.func
};

export default TagPicker;
