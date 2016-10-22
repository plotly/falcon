import * as Connections from './connections/Connections';
import {updateGrid} from './PlotlyAPI';
import {getCredentialById} from './Credentials';
import {getQueries, saveQuery} from './Queries';

function queryAndUpdateGrid (fid, uids, queryString, credentialId) {
    const requestedDBCredentials = getCredentialById(credentialId);
    console.warn('requestedDBCredentials: ', requestedDBCredentials);
    Connections.query(queryString, requestedDBCredentials).then(
        rowsAndColumns => updateGrid(
            rowsAndColumns.rows,
            fid,
            uids
        )
        // TODO - ^^ Error handling.
        // - throttling
        // - API keys
        // - 404 -> remove query
    );
}


class QueryScheduler {
    constructor(job = queryAndUpdateGrid) {
        this.scheduleQuery = this.scheduleQuery.bind(this);
        this.loadQueries = this.loadQueries.bind(this);

        this.job = job;
        this.queryJobs = {};
    }

    // TODO - also type of the database
    scheduleQuery({
        fid: fid,
        uids: uids,
        refreshRate: refreshRate,
        query: query,
        credentialId: credentialId
    }) {

        // Save query to a file
        saveQuery({
            fid,
            uids,
            refreshRate,
            query,
            credentialId
        });

        if (this.queryJobs[fid]) {
            clearInterval(this.queryJobs[fid]);
        }

        this.queryJobs[fid] = setInterval(
            () => this.job(fid, uids, query, credentialId),
            refreshRate
        );

    }

    // Load and schedule queries - To be run on app start.
    loadQueries() {
        // read queries from a file
        const queries = this.getQueries();
        queries.forEach(this.scheduleQuery);
    }

    // Clear out setInterval queries from memory - used to clean up tests
    clearQueries() {
        Object.keys(this.queryJobs).forEach(fid => {
            clearInterval(this.queryJobs[fid]);
            delete this.queryJobs[fid];
        });
    }
}

// TODO - temporary
export {queryAndUpdateGrid};
export default QueryScheduler;


// TODO - do we allow the user to change their credentials
// and all of their saved queries? if we save
// serializedConfiguration in plotly, then that'll be hard to
// update.
// or wait, no it won't, we can just make an API call to the
// grid and update it.
