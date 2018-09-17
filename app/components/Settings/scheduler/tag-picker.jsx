import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import Select from 'react-select';

import * as Actions from '../../../actions/sessions';
import Tag from './tag.jsx';

const styles = {
    item: {zIndex: 999, display: 'inline-block', padding: '2px 0px', cursor: 'pointer'},
    tag: {marginRight: '0px', cursor: 'pointer'}
};

export class TagValue extends React.Component {
    constructor(props) {
        super(props);
        this.handleRemove = this.handleRemove.bind(this);
    }
    handleRemove() {
        this.props.onRemove(this.props.value);
    }
    render() {
        return (
            <div onClick={this.handleRemove} style={styles.item}>
                <span className="Select-value-label">
                    <Tag name={this.props.value.label} color={this.props.value.color} style={styles.tag} />
                </span>
            </div>
        );
    }
}

TagValue.propTypes = {
    value: PropTypes.object,
    onRemove: PropTypes.func
};

function optionRenderer(option) {
    return <Tag color={option.color} name={option.label} />;
}

// TODO pick from a subset?
const randomColor = () => '#' + Math.floor(Math.random() * 13421772).toString(16);

const promptTextCreator = label => `Create new tag "${label}"`;
export class TagPicker extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(tags) {
        const newTag = tags && tags[tags.length - 1];
        if (newTag && !newTag.name) {
            newTag.name = newTag.label;
            newTag.color = randomColor();

            return this.props.createTag(newTag).then(res => {
                tags[tags.length - 1] = res;
                this.props.onChange(tags);
            });
        }

        this.props.onChange(tags);
    }
    render() {
        return (
            <Select.Creatable
                placeholder="Select tags"
                {...this.props}
                value={this.props.value.map(t => ({label: t.name, ...t}))}
                options={this.props.options.map(t => ({label: t.name, ...t}))}
                onChange={this.handleChange}
                multi={true}
                optionRenderer={optionRenderer}
                valueComponent={TagValue}
                promptTextCreator={promptTextCreator}
            />
        );
    }
}

TagPicker.propTypes = {
    value: PropTypes.array,
    options: PropTypes.array,
    onChange: PropTypes.func,
    createTag: PropTypes.func
};

function mapDispatchToProps(dispatch) {
    return {
        createTag: payload => dispatch(Actions.createTag(payload))
    };
}

export default connect(
    null,
    mapDispatchToProps
)(TagPicker);
