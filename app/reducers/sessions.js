import {
    NEW_SESSION,
    SWITCH_SESSION,
    DELETE_SESSION,
    UPDATE_CONNECTION,
    UPDATE_CONFIGURATION,
    UPDATE_IPC_STATE
} from '../actions/sessions.js';
import Immutable from 'immutable';
import {EMPTY_SESSION} from '../constants/constants';

// see end of file for `list` description
const INITIAL_STATE = Immutable.Map({
    list: Immutable.Map({}),
    sessionSelected: 0,
    startupIPC: Immutable.Map({})
});

export default function sessions(state = INITIAL_STATE, action) {

    switch (action.type) {

        /*
         * TODO: make this action take a new random index
         * instead of pushing to the list
         */

        case NEW_SESSION:
            return state.mergeIn(['list'],
                {
                    [action.payload]: {
                        configuration:
                            Immutable.Map (EMPTY_SESSION.CONFIGURATION),
                        connection:
                            Immutable.Map(EMPTY_SESSION.CONNECTION),
                        /*
                         * include startup inter process communcation
                         * into each session
                         */
                        ipc:
                            state.get('startupIPC')
                    }
                }
            );

        case SWITCH_SESSION:
            return state.merge({sessionSelected: action.payload});

        case DELETE_SESSION:
            return state.deleteIn(['list', `${action.payload}`]);

        case UPDATE_CONFIGURATION:
            return state.mergeIn(
                ['list', `${state.get('sessionSelected')}`, 'configuration'],
                action.payload
            );

        case UPDATE_CONNECTION:
            return state.mergeIn(
                ['list', `${state.get('sessionSelected')}`, 'connection'],
                action.payload
            );

        case UPDATE_IPC_STATE:
            if (state.get('list').size > 0) {
                return state.mergeIn(
                    ['list', `${state.get('sessionSelected')}`, 'ipc'],
                    Immutable.fromJS(action.payload)
                );
            } else {
                return state.mergeIn(
                    ['startupIPC'],
                    Immutable.fromJS(action.payload)
                );
            }

        default:
            return state;
    }
}



/*
 * where the 'list' will hold several sessions such as
   {
       session1 : {
            ipc: {} // ipc related info (see below)
            connection: {} // status of the app related info
            configuration: {} // info required for user connection
        },
    ...
    }
 *
 * ipc is a generic key-value store that stores state from
 * back-end messages.
 *
 * the backend (messageHandler.js) sends objects over the ipc channel and these
 * objects get merged into this IPC state. fully populated,
 * this state looks like:

    0: {
        databases: {
            [
                database1, database2
            ]
        },
        tables: {
            {
                table1: {},
                table2: {}
            }
        },
    },
    1: {
        databases: {
            [
                database1, database2
            ]
        },
        tables: {
            {
                table1: {},
                table2: {}
            }
        },
    }

{
    databases: {
        [
            database1, database2
        ]
    },
    tables: {
        {
            table1: {},
            table2: {}
        }
    },
    previews: {
        {
            table1: {
                nrows: 3,
                ncols: 2,
                colnames: ['col1', 'col2', 'col3']
                rows: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
            },
            table2: {}
        }
    },
    log: {
        [
            {logEntry: 'something happened'},
            {timestamp: "17:45:52 GMT-0400 (EDT)"}
        ]
    },
    canSetupHttps: true,
    hasSelfSignedCert: true,
    error: 'something bad happened'
}

 *
 *
 */
