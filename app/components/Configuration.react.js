import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import AceEditor from 'react-ace';
import styles from './Configuration.css';


require('brace/mode/sql');
require('brace/theme/tomorrow');


export default class Configuration extends Component {
  constructor(props) {
    super(props);
    this.state = {query: ''};
  }

  render() {
    const onChangeQuery = query => {
      this.setState({query});
    };

    const onClickConnect = () => {
      this.props.ipcActions.connect(this.props.configuration);
    };

    const onClickQuery = () => {
      this.props.ipcActions.query(this.state.query);
    };

    const onUpdateCredentials = key => e => {
      this.props.configActions.setValue({key, value: e.target.value});
    };

    return (
      <div>
        <div className={{}}>
          <h5>Getting staarted</h5>

          <AceEditor
            value={this.state.query}
            onChange={onChangeQuery}
            mode="sql"
            theme="tomorrow"
            height="100"
          />

          <div className={styles.btnGroup}>
            <button className={styles.btn} onClick={onClickConnect}>
              connect
            </button>
            <button className={styles.btn} onClick={onClickQuery}>
              query
            </button>
          </div>

          <input
            onChange={onUpdateCredentials('portNumber')}
            placeholder="port number"
          />
          <input
            onChange={onUpdateCredentials('engine')}
            placeholder="database engine"
          />
          <input
            onChange={onUpdateCredentials('database')}
            placeholder="database name"
          />
          <input
            onChange={onUpdateCredentials('username')}
            placeholder="username"
          />
          <input
            onChange={onUpdateCredentials('password')}
            placeholder="password"
          />

          <pre>
            {JSON.stringify(this.props.configuration.toJS())}
          </pre>

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

Configuration.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    setValue: PropTypes.func.isRequired,
    ipc: ImmutablePropTypes.map.isRequired,
    ipcActions: PropTypes.Object,
    configActions: PropTypes.Object
};
