import React from 'react';
import PropTypes from 'prop-types';
import enhanceWithClickOutside from 'react-click-outside';
import {ChromePicker} from 'react-color';

class ColorPicker extends React.Component {
    static propTypes = {
        color: PropTypes.string,
        onClickAway: PropTypes.func
    };

    static defaultProps = {
        onClickAway: () => {}
    };

    handleClickOutside(e) {
        if (this.state.open) {
            this.setState({open: false});
            this.props.onClickAway(e);
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
        this.openColorPicker = this.openColorPicker.bind(this);
    }

    openColorPicker() {
        this.setState({open: true});
    }

    render() {
        return (
            <div onClick={this.openColorPicker} className="color-box" style={{background: this.props.color}}>
                {this.state.open && (
                    <div style={{position: 'absolute'}}>
                        <ChromePicker disableAlpha={true} {...this.props} />
                    </div>
                )}
            </div>
        );
    }
}

export default enhanceWithClickOutside(ColorPicker);
