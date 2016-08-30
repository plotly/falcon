import {
    NEW_SESSION,
    SWITCH_SESSION,
    UPDATE_CONNECTION,
    UPDATE_CONFIGURATION,
    UPDATE_IPC_STATE
} from '../actions/sessions.js';
import Immutable from 'immutable';

// see end of file for `list` description
const INITIAL_STATE = Immutable.Map({
    list: Immutable.Map({}),
    sessionSelected: 0
});

export default function sessions(state = INITIAL_STATE, action) {
    console.warn('sessionsReducer');
    console.warn(state);
    console.warn(action.type);
    console.warn(action.payload);
            // debugger;


    switch (action.type) {

        /*
         * TODO: make this action take a new random index
         * instead of pushing to the list
         */

        case NEW_SESSION:
            return state.mergeIn(['list'],
                {
                    [action.payload.id]: {
                        configuration:
                            Immutable.Map (action.payload.configuration),
                        connection:
                            Immutable.Map(action.payload.connection),
                        ipc:
                            Immutable.Map(action.payload.ipc)
                    }
                }
            );

        case SWITCH_SESSION:
            return state.merge({sessionSelected: action.payload});

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
                return state;
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
