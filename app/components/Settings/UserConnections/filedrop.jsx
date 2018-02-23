import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {SAMPLE_DBS} from '../../../constants/constants';

export default class Filedrop extends Component {
    static propTypes = {
        settings: PropTypes.object,
        connection: PropTypes.object,
        updateConnection: PropTypes.func,
        sampleCredentialsStyle : PropTypes.object
    }

    /**
     * Filedrop is an input component where users can type an URL or drop a file
     * 
     * @param {object} props - Component properties
     * 
     * @param {object} props.settings - FileDrop settings
     * @param {string} props.settings.type - Set to 'filedrop'
     * @param {string} props.settings.value - Target property in the connection object
     * @param {string} props.settings.inputLabel - Label for input box
     * @param {string} props.settings.dropLabel - Label for drop box
     * @param {string} props.settings.placeholder - Placeholder for input box
     * 
     * @param {object} props.connection - Connection object
     * @param {string} props.connection.dialect - Connection dialect
     * @param {string} props.connection.label - Connection label
     * 
     * @param {function} props.updateConnection - Callback to update the connection object
     * 
     * @param {object} props.sampleCredentialsStyle - To control the display of sample credentials
     */
    constructor(props) {
        super(props);

        const {
            settings,
            connection,
        } = this.props;

        const url = connection[settings.value];

        /**
         * @member {object} state - Component state
         * @property {string} state.inputValue - Value typed into the input box
         * @property {string} state.dropValue - Data URL dropped into the drop box
         */
        this.state = (typeof url === 'string' && url.startsWith('data:')) ? {
            inputValue: connection.label || url.slice(0, 64),
            dropValue: url,
        } : {
            inputValue: url,
            dropValue: '',
        };
    }


    render() {
        const {
            settings,
            connection,
            updateConnection,
            sampleCredentialsStyle
        } = this.props;

        const {
            inputValue,
            dropValue,
            drag
        } = this.state;

        const setState = this.setState.bind(this);

        const {
            value,
            inputLabel,
            dropLabel,
            placeholder
        } = settings;

        const {dialect} = connection;

        const sampleCredential = (SAMPLE_DBS[dialect]) ? SAMPLE_DBS[dialect][value] : null;

        return (
            <div
                className={'inputContainer'}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <label className={'label'}>
                    {inputLabel}
                </label>
                <div className={'wrapInput'}>
                    <input
                        style={{'background-color': (drag || dropValue) ? 'lightcyan' : null}}
                        onChange={onChange}
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                        value={inputValue}
                        placeholder={placeholder}
                        type={'text'}
                    />
                    <small style={{
                        clear: 'both',
                        float: 'left',
                        'margin-left': '20px'
                    }} >
                        {dropLabel}
                    </small>
                    <div style={sampleCredentialsStyle}>
                        <code>
                            {sampleCredential}
                        </code>
                    </div>
                </div>
            </div>
        );

        function onChange(event) {
            setState({
                inputValue: event.target.value,
                dropValue: ''
            });
            updateConnection({
                [value]: event.target.value,
                label: event.target.value
            });
        }

        function onDragEnter(event) {
            event.stopPropagation();
            event.preventDefault();
            setState({drag: true});
        }

        function onDragOver(event) {
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        }

        function onDragLeave(event) {
            event.stopPropagation();
            event.preventDefault();
            setState({drag: false});
        }

        function onDrop(event) {
            event.stopPropagation();
            event.preventDefault();
            setState({drag: false});

            const files = event.dataTransfer.files;
            if (!files || files.length !== 1) {
                return;
            }

            const file = files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setState({
                    dropValue: reader.result,
                    inputValue: file.name
                });
                updateConnection({
                    [value]: reader.result,
                    label: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    }
}
