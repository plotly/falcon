import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Configuration from '../components/Configuration.react';
import * as SessionsActions from '../actions/sessions';

function mapStateToProps(state) {
    return {sessions: state.sessions};
}

function mapDispatchToProps(dispatch) {
    const sessionsActions = bindActionCreators(SessionsActions, dispatch);
    return {sessionsActions};
}

export default connect(mapStateToProps, mapDispatchToProps)(Configuration);
