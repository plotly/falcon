import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Configuration from '../components/Configuration.react';
import * as ConfigurationActions from '../actions/configuration';
import * as IpcActions from '../actions/ipc';
import * as ConnectionActions from '../actions/connection';

function mapStateToProps(state) {
    return {
        configuration: state.configuration,
        ipc: state.ipc,
        connection: state.connection
    };
}

function mapDispatchToProps(dispatch) {
    const configActions = bindActionCreators(ConfigurationActions, dispatch);
    const ipcActions = bindActionCreators(IpcActions, dispatch);
    const connectionActions = bindActionCreators(ConnectionActions, dispatch);
    return {configActions, ipcActions, connectionActions};
}

export default connect(mapStateToProps, mapDispatchToProps)(Configuration);
