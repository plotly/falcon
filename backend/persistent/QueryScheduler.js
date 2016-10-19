import * as Connections from './connections/Connections';
import {updateGrid} from './PlotlyAPI';
import {lookUpCredentials} from './Credentials';
import {getQueries, saveQuery} from './Queries';

function queryAndUpdateGrid (fid, uids, queryString, configuration) {
    const requestedDBCredentials = lookUpCredentials(configuration);
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
        configuration: configuration
    }) {

        // Save query to a file
        saveQuery({
            fid,
            uids,
            refreshRate,
            query,
            configuration
        });

        this.queryJobs[fid] = setInterval(
            () => this.job(fid, uids, query, configuration),
            refreshRate
        );

    }

    // Load and schedule queries - To be run on app start.
    loadQueries() {
        // read queries from a file
        const queries = this.getQueries();
        queries.forEach(this.scheduleQuery);
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
