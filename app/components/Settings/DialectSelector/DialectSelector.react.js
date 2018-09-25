import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import {
    DIALECTS, LOGOS
} from '../../../constants/constants';

class DialectOption extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    isDisabled: PropTypes.bool,
    isFocused: PropTypes.bool,
    isSelected: PropTypes.bool,
    onFocus: PropTypes.func,
    onSelect: PropTypes.func,
    option: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  handleMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onSelect(this.props.option, event);
  }

  handleMouseEnter(event) {
    this.props.onFocus(this.props.option, event);
  }

  handleMouseMove(event) {
    if (this.props.isFocused) return;
    this.props.onFocus(this.props.option, event);
  }

  render() {
    const logoStyle = {
      display: 'inline-block',
      height: '100%',
      width: '100%',
      objectFit: 'contain',
      position: 'relative'
    };

    const logoContainerStyle = {height: '100%', width: 64, marginRight: 16};

    const optionStyle = {
      height: 56,
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center'
    };

    return (
      <div
        style={optionStyle}
        className={this.props.className}
        onMouseDown={this.handleMouseDown}
        onMouseEnter={this.handleMouseEnter}
        onMouseMove={this.handleMouseMove}
        title={this.props.option.title}
      >
        <div style={logoContainerStyle}>
          <img style={logoStyle} className={'logoImage'} src={LOGOS[this.props.option.label]} />
        </div>
        {this.props.children}
      </div>
    );
  }
}

class DialectValue extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    value: PropTypes.object
  };

  render () {
    const logoStyle = {
      display: 'inline-block',
      marginRight: 10,
      position: 'relative',
      verticalAlign: 'middle'
    };

    return (
      <div className="Select-value">
        <span className="Select-value-label">
          <img style={logoStyle} className={'logoImage'} src={LOGOS[this.props.value.label]} />
          {this.props.children}
        </span>
      </div>
    );
  }
}

/**
 * The following is the Dialect Selector
 * @param {object} props - Properties
 * @param {object} props.connectionObject - Connect Object
 * @param {string} props.connectionObject.dialect - Dialect
 * @param {function} props.updateConnection - Updates the Connection with dialect
 * @returns {ReactElement} rendered element
 */
const DialectSelector = function DialectSelector(props) {
    const {connectionObject, updateConnection} = props;

    // react-select requires options to have `label` and `value` keys
    const DIALECT_OPTIONS = Object.entries(DIALECTS).map(DIALECT => ({
      label: DIALECT[1],
      value: DIALECT[0]
    }));

    const placeholder = <span>Select a database type...</span>;

    const onChange = ({ label }) => updateConnection({dialect: label});

    const currentValue = DIALECT_OPTIONS.filter(DIALECT =>
      DIALECT.label === connectionObject.dialect)[0];

    return (
      <div>
          <label className={'label'}>Database Type</label>
          <div className={'wrapInput'}>
            <Select
              searchable={false}
              clearable={false}
              onChange={onChange}
              optionComponent={DialectOption}
              options={DIALECT_OPTIONS}
              placeholder={placeholder}
              value={currentValue}
              valueComponent={DialectValue}
            />
          </div>
      </div>
    );
};

DialectSelector.propTypes = {
    connectionObject: PropTypes.object,
    updateConnection: PropTypes.func
};

export default DialectSelector;
