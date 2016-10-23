import {
    NEW_SESSION,
    SWITCH_SESSION,
    FORGET_SESSION,
    UPDATE_CONNECTION,
    UPDATE_CONFIGURATION,
    UPDATE_IPC_STATE,
    SWAP_SESSION_ID
} from '../actions/sessions.js';
import Immutable from 'immutable';
import {EMPTY_SESSION} from '../constants/constants';
import {dissoc} from 'ramda';

// see end of file for `list` description
const INITIAL_STATE = Immutable.Map({
    list: Immutable.OrderedMap({}),
    sessionSelectedId: '0',
    startupIPC: Immutable.Map({})
});

export default function sessions(state = INITIAL_STATE, action) {

    let nextState;

    let id, update;
    if (action.payload && action.payload.id) {
        id = action.payload.id;
        update = dissoc('id', action.payload);
    } else {
        id = state.get('sessionSelectedId');
        update = action.payload;
    }
    // TODO - Remove sessionSelectedId from all of the actions

    switch (action.type) {
        case NEW_SESSION: {
            nextState = state.mergeIn(['list'],
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
            break;
        }

        case SWITCH_SESSION: {
            nextState = state.merge({sessionSelectedId: action.payload});
            break;
        }

        case FORGET_SESSION: {
            nextState = state.deleteIn(['list', `${action.payload}`]);
            break;
        }

        case UPDATE_CONFIGURATION: {
            nextState = state.mergeIn(
                ['list', id, 'configuration'],
                update
            );
            break;
        }

        case UPDATE_CONNECTION: {
            nextState = state.mergeIn(
                ['list', id, 'connection'],
                update
            );
            break;
        }

        case SWAP_SESSION_ID: {
            const newSessionId = action.payload;
            const currentSessionId = state.get('sessionSelectedId');

            nextState = state.setIn(
                ['list', newSessionId],
                state.getIn(['list', currentSessionId])
            );
            nextState = nextState.deleteIn(['list', String(currentSessionId)]);
            nextState = nextState.set('sessionSelectedId', newSessionId);
            break;
        }

        case UPDATE_IPC_STATE: {
            if (state.get('list').size > 0) {
                nextState = state.mergeIn(
                    ['list', id, 'ipc'],
                    Immutable.fromJS(update)
                );
            } else {
                nextState = state.mergeIn(
                    ['startupIPC'],
                    Immutable.fromJS(action.payload)
                );
            }
            break;
        }

        default:
            nextState = state;
    }

    console.group();
    console.warn(action.type, action.payload);
    console.warn('Previous: ', state.toJS());
    console.warn('Next: ', nextState.toJS());
    console.groupEnd();

    return nextState;
}



/*
where the 'list' will hold several sessions such as
   {
        1182736409810 : { // where this index is a timestamp
            ipc: {} // ipc related info (see below)
            connection: {} // status of the app related info
            configuration: {} // info required for user connection
        },
        1182736409815 : { // where this index is a timestamp
            ipc: {} // ipc related info (see below)
            connection: {} // status of the app related info
            configuration: {} // info required for user connection
        },
    ...
    }

------ ipc ------
ipc is a generic key-value store that stores state from
back-end messages.

the backend (messageHandler.js) sends objects over the ipc CHANNEL and these
objects get merged into this IPC state. fully populated,
this state looks like:

    ipc: {
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
    }
------ end ipc ------

------ configuration ------
    configuration: {
        username: some_username,
        password: somepassword!%5,
        database: plotly_datasets,
        dialect: mysql,
        port: 3306,
        storage: ~/Path/to/my/local/sqlite/database.db,
        host: server-faraway.com
    }
------ end configuration------

------ connection ------
    connection: {
        status: connected
    }
------ end connection------
*/
