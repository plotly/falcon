import * as Connections from './connections/Connections';
import {updateGrid} from './PlotlyAPI';
import {getCredentialById} from './Credentials';
import {getQueries, saveQuery, deleteQuery} from './Queries';
import Logger from '../Logger';

class QueryScheduler {
    constructor() {
        this.scheduleQuery = this.scheduleQuery.bind(this);
        this.loadQueries = this.loadQueries.bind(this);
        this.clearQuery = this.clearQuery.bind(this);
        this.clearQueries = this.clearQueries.bind(this);
        this.queryAndUpdateGrid = this.queryAndUpdateGrid.bind(this);

        // Expose this.job so that tests can overwrite it
        this.job = this.queryAndUpdateGrid;
        this.queryJobs = {};
    }

    scheduleQuery({
        fid: fid,
        uids: uids,
        refreshRate: refreshRate,
        query: query,
        credentialId: credentialId
    }) {
        Logger.log(`Scheduling "${query}" with credential ${credentialId} updating grid ${fid}`);
        // TODO - Make Query an object that contains database
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
            () => {
                try {
                    this.job(fid, uids, query, credentialId);
                } catch (e) {
                    Logger.log(e, 0);
                }

            },
            refreshRate
        );

    }

    // Load and schedule queries - To be run on app start.
    loadQueries() {
        // read queries from a file
        const queries = getQueries();
        queries.forEach(this.scheduleQuery);
    }

    // Remove query from memory
    clearQuery(fid) {
        clearInterval(this.queryJobs[fid]);
        delete this.queryJobs[fid];
    }

    // Clear out setInterval queries from memory - used to clean up tests
    clearQueries() {
        Object.keys(this.queryJobs).forEach(this.clearQuery);
    }

    queryAndUpdateGrid (fid, uids, queryString, credentialId) {
        // TODO - look up username and API key
        const requestedDBCredentials = getCredentialById(credentialId);
        let startTime = process.hrtime();

        Logger.log(`Querying "${queryString}" with credential ${credentialId} to update grid ${fid}`, 2);
        Connections.query(queryString, requestedDBCredentials)
        .then(rowsAndColumns => {
            Logger.log(`Query "${queryString}" took ${process.hrtime(startTime)[0]} seconds`, 2);

            Logger.log(`Updating grid ${fid} with new data`, 2);
            Logger.log(
                `First row:
                ${JSON.stringify(rowsAndColumns.rows.slice(0, 1))}`,
            2);

            startTime = process.hrtime();

            return updateGrid(
                rowsAndColumns.rows,
                fid,
                uids
            );

        }).then(res => {
            setTimeout(function() {
                Logger.log(`Request to Plotly for grid ${fid} took ${process.hrtime(startTime)[0]} seconds`, 2);
            }, 2000);

            /*
             * If 404, then assume the user has deleted their grid and
             * remove the query
             */
            if (res.status === 404) {
                // TODO - Log this
                this.clearQuery(fid);
                deleteQuery(fid);
                Logger.log(
                    `Grid ID ${fid} doesn't exist on Plotly anymore,
                     removing persistent query.`,
                     2
                );
            } else if (res.status !== 200) {
                Logger.log(`Error ${res.status} while updating grid ${fid}.`, 0);
            }

            res.json().then(json => {
                if (res.status !== 200) {
                    Logger.log(`Response: ${JSON.stringify(json, null, 2)}`, 2);
                } else {
                Logger.log(`Grid ${fid} has been updated.`, 2);
                }
            });

        }).catch(error => {
            console.error(error);
            Logger.log(error, 0);
        });

    }

}

export default QueryScheduler;


// TODO - do we allow the user to change their credentials
// and all of their saved queries? if we save
// serializedConfiguration in plotly, then that'll be hard to
// update.
// or wait, no it won't, we can just make an API call to the
// grid and update it.
