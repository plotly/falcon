import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import Select from 'react-select';

import * as Actions from '../../../../actions/sessions';
import Tag from '../presentational/tag';

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
        if (!this.props.disabled) {
            this.props.onRemove(this.props.value);
        }
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
    onRemove: PropTypes.func,
    disabled: PropTypes.bool
};

function optionRenderer(option) {
    return <Tag color={option.color} name={option.label} />;
}

// helpers
const randomColor = () => '#' + Math.floor(Math.random() * 13421772).toString(16);
const tagToOption = tag => ({label: tag.name, value: tag.id, color: tag.color});

const promptTextCreator = label => `Create new tag "${label}"`;
const isValidNewOption = tag => tag.label && tag.label.length && tag.label.trim().length;
const inputProps = {maxLength: 30};

export class TagPicker extends React.Component {
    constructor(props) {
        super(props);
        this.handleCreate = this.handleCreate.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    handleCreate(newTag) {
        return this.props
            .createTag({...newTag, name: newTag.label, color: randomColor()})
            .then(res => this.props.onChange(this.props.value.concat(res)))
            .catch(errorRes => this.props.onChange(errorRes));
    }

    onChange(selectedOptions) {
        const selectedTags = this.props.options.filter(tag => {
            return selectedOptions.some(option => option.value === tag.id);
        });

        this.props.onChange(selectedTags);
    }

    render() {
        return (
            <Select.Creatable
                placeholder="Select tags"
                noResultsText="No tags exist yet"
                {...this.props}
                multi
                value={this.props.value.map(tagToOption)}
                options={this.props.options.map(tagToOption)}
                onChange={this.onChange}
                optionRenderer={optionRenderer}
                valueComponent={TagValue}
                promptTextCreator={promptTextCreator}
                onNewOptionClick={this.handleCreate}
                inputProps={inputProps}
                isValidNewOption={isValidNewOption}
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
