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

    const onPressConnect = () => {
      this.props.ipcActions.connect(this.props.configuration.toJS());
    };

    const onSendQuery = () => {
      this.props.ipcActions.query(this.state.query);
    };

    const onUpdateCredentials = e => {
      this.props.configActions.setValue({
        key: e.target.name,
        value: e.target.value
      });
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
            <button className={styles.btn} onClick={onPressConnect}>
              connect
            </button>
            <button className={styles.btn} onClick={onSendQuery}>
              query
            </button>
          </div>

          <input
            onChange={onUpdateCredentials}
            placeholder="port number"
            name="portnb"
          />
          <input
            onChange={onUpdateCredentials}
            placeholder="database engine"
            name="engine"
          />
          <input
            onChange={onUpdateCredentials}
            placeholder="database name"
            name="database"
          />
          <input
            onChange={onUpdateCredentials}
            placeholder="username"
            name="username"
          />
          <input
            onChange={onUpdateCredentials}
            placeholder="password"
            name="password"
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
