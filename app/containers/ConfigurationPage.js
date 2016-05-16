import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Configuration from '../components/Configuration.react';
import * as ConfigurationActions from '../actions/configuration';
import * as IpcActions from '../actions/ipc';

function mapStateToProps(state) {
    console.warn('state: ', state);
  return {
      configuration: state.configuration,
      ipc: state.ipc
  };
}

function mapDispatchToProps(dispatch) {
  const configActions = bindActionCreators(ConfigurationActions, dispatch);
  const ipcActions = bindActionCreators(IpcActions, dispatch);

  return {configActions, ipcActions};
}

export default connect(mapStateToProps, mapDispatchToProps)(Configuration);
