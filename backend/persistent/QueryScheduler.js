import fs from 'fs';
import {queryDatabase} from './Query';
import {updateGrid} from './PlotlyAPI';
import {lookUpCredentials} from './Credentials';

// TODO - Make generic
export const QUERY_FILE = '/Users/chriddyp/Repos/plotly-database-connector/queue.json';

function queryAndUpdateGrid (fid, uids, queryString, serializedConfiguration) {
    const requestedDBCredentials = lookUpCredentials(serializedConfiguration);
    queryDatabase(queryString, requestedDBCredentials).then(rowsAndColumns => {
        updateGrid(rowsAndColumns.rows, fid, uids, serializedConfiguration);
        // TODO - ^^ Error handling.
        // - throttling
        // - API keys
        // - 404 -> remove query
    });
}


class QueryScheduler {
    constructor(job = queryAndUpdateGrid) {
        this.scheduleQuery = this.scheduleQuery.bind(this);
        this.loadQueries = this.loadQueries.bind(this);

        this._readQueries = this._readQueries.bind(this);
        this._saveQuery = this._saveQuery.bind(this);

        this.job = job;
        this.queryJobs = {};
    }

    // TODO - also type of the database
    scheduleQuery({
        fid: fid,
        uids: uids,
        refreshRate: refreshRate,
        query: query,
        serializedConfiguration: serializedConfiguration
    }) {

        this._saveQuery({
            fid,
            uids,
            refreshRate,
            query,
            serializedConfiguration
        });

        this.queryJobs[fid] = setInterval(
            () => this.job(fid, uids, query, serializedConfiguration),
            refreshRate
        );

    }

    // Load and schedule queries - To be run on app start.
    loadQueries() {
        const queries = this._readQueries();
        Object.keys(queries).forEach(
            serializedConfiguration => {
                this.scheduleQuery(queries[serializedConfiguration]);
            }
        );
    }

    // Read queries from a file and return them
    _readQueries() {
        let queriesOnFile;
        try {
            queriesOnFile = fs.readFileSync(QUERY_FILE).toString();
        } catch (e) {
            queriesOnFile = '{}';
        }
        return JSON.parse(queriesOnFile);
    }

    // Save queries to a file
    _saveQuery(queryOptions) {
        const queries = this._readQueries();
        if (queries[queryOptions.serializedConfiguration]) {
            queries[queryOptions.serializedConfiguration].push(queryOptions);
        } else {
            queries[queryOptions.serializedConfiguration] = [queryOptions];
        }

        fs.writeFileSync(QUERY_FILE, JSON.stringify(queries));

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
