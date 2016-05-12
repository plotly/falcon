import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Immutable from 'immutable';
import AceEditor from 'react-ace';
import brace from 'brace';


require('brace/mode/sql');
require('brace/theme/tomorrow');


export default class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {query: ''}
    }

  render() {
    console.warn('this.props: ', this.props);
    const configuration = this.props.configuration.toJS();

    const onChange = query => {
        this.setState({query})
        this.props.ipcActions.query(query);
        /*
        this.props.configActions.setValue({
            key: e.target.value, value: e.target.value
        });
        */
    }

    return (
      <div>
        <div className={{}}>
          <h5>Getting staarted</h5>

          <AceEditor
                    value={this.state.query}
                    onChange={onChange}
          			mode="sql"
          			theme="tomorrow"
          />

          <input onChange={onChange}/>

          <pre>
            {JSON.stringify(this.props.ipc.toJS().log, null, 2)}
          </pre>

          <pre>
            {JSON.stringify(this.props.ipc.toJS().rows, null, 2)}
          </pre>

          <pre>
            {JSON.stringify(this.props.ipc.toJS().metadata, null, 2)}
          </pre>


            <pre>
              {JSON.stringify(this.props.ipc.toJS().error, null, 2)}
            </pre>


        </div>
      </div>
    );
  }
}

Configuration.PropTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    setValue: PropTypes.func.isRequired
}
