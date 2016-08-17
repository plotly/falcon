import {UPDATE_IPC} from '../actions/ipc.js';

import Immutable from 'immutable';

const INITIAL_STATE = Immutable.Map();


/*
 * ipc is a generic key-value store that stores state from
 * back-end messages.
 *
 * the backend sends objects over the ipc channel and these
 * objects get merged into this IPC state. fully populated,
 * this state looks like:
 * TODO - Fill this in
{
    tables: {

    },
    error:

    https: {
        hasSelfSignedCert: ...
    }
 *
 *
 */
export default function ipc(state = INITIAL_STATE, action) {
    switch (action.type) {
        case UPDATE_IPC:
            return state.merge(Immutable.fromJS(action.payload));
        default:
            return state;
    }
}
