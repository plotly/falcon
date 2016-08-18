import {UPDATE_IPC_STATE} from '../actions/ipc.js';

import Immutable from 'immutable';

const INITIAL_STATE = Immutable.Map();


/*
 * ipc is a generic key-value store that stores state from
 * back-end messages.
 *
 * the backend (messageHandler.js) sends objects over the ipc channel and these
 * objects get merged into this IPC state. fully populated,
 * this state looks like:

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

export default function ipc(state = INITIAL_STATE, action) {
    switch (action.type) {
        case UPDATE_IPC_STATE:
            return state.merge(Immutable.fromJS(action.payload));
        default:
            return state;
    }
}
