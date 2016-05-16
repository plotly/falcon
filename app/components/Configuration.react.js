import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Immutable from 'immutable';
import AceEditor from 'react-ace';
import brace from 'brace';
import styles from './Configuration.css';


require('brace/mode/sql');
require('brace/theme/tomorrow');


export default class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {query: ''};
    }

  render() {
    console.warn('this.props: ', this.props);
    const configuration = this.props.configuration.toJS();

    const onChangeQuery = query => {
        this.setState({query});
    }

    const onPressConnect = (event) => {
      this.props.ipcActions.connect(this.state.connect);
    }

    const onSendQuery = (event) => {
        this.props.ipcActions.query(this.state.query);
    }

    return (
      <div>
        <div className={{}}>
          <h5>Getting staarted</h5>

          <AceEditor
                    value={this.state.query}
                    onChange={onChangeQuery}
          			mode="sql"
          			theme="tomorrow"
                height='100'
          />

          <div className={styles.btnGroup}>
            <button  className={styles.btn} onClick={onPressConnect}>
              connect
            </button>
            <button  className={styles.btn} onClick={onSendQuery}>
              query
            </button>
          </div>

          <pre>
            {JSON.stringify(this.props.ipc.toJS().rows, null, 2)}
          </pre>

          <pre>
            {JSON.stringify(this.props.ipc.toJS().log, null, 2)}
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
