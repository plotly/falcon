import * as Connections from './connections/Connections';
import {updateGrid} from './PlotlyAPI';
import {getCredentialById} from './Credentials';
import {getQuery, getQueries, saveQuery, deleteQuery} from './Queries';
import {getSetting} from '../settings';
import Logger from '../logger';
import {PlotlyAPIRequest} from './PlotlyAPI';

class QueryScheduler {
    constructor() {
        this.scheduleQuery = this.scheduleQuery.bind(this);
        this.loadQueries = this.loadQueries.bind(this);
        this.clearQuery = this.clearQuery.bind(this);
        this.clearQueries = this.clearQueries.bind(this);
        this.queryAndUpdateGrid = this.queryAndUpdateGrid.bind(this);

        // Expose this.job so that tests can overwrite it
        this.job = this.queryAndUpdateGrid;
        this.minimumRefreshInterval = 60 * 1000;
        this.queryJobs = {};
    }

    scheduleQuery({
        fid: fid,
        uids: uids,
        refreshInterval: refreshInterval,
        query: query,
        credentialId: credentialId
    }) {
        if (!refreshInterval) {
            throw new Error('Refresh rate was not supplied');
        // TODO - bump up to 60 when done testing.
    } else if (refreshInterval < this.minimumRefreshInterval) {
            throw new Error(`
                Refresh rate must be at least
                ${this.minimumRefreshInterval}
                (${this.minimumRefreshInterval / 1000} seconds)`);
        }

        Logger.log(`Scheduling "${query}" with credential ${credentialId} updating grid ${fid}`);
        // Delete query if it is already saved
        if (getQuery(fid)) {
            this.clearQuery(fid);
            deleteQuery(fid);
        }

        // Save query to a file
        saveQuery({
            fid,
            uids,
            refreshInterval,
            query,
            credentialId
        });

        // Schedule
        this.queryJobs[fid] = setInterval(
            () => {
                try {
                    this.job(fid, uids, query, credentialId)
                    .catch(error => {
                        Logger.log(error, 0);
                    });
                } catch (e) {
                    Logger.log(e, 0);
                }

            },
            refreshInterval
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
        return Connections.query(queryString, requestedDBCredentials)
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
            Logger.log(`Request to Plotly for grid ${fid} took ${process.hrtime(startTime)[0]} seconds`, 2);
            if (res.status !== 200) {
                Logger.log(`Error ${res.status} while updating grid ${fid}.`, 0);

                /*
                 * If it was a 500 error, it might've been because the user
                 * has deleted their grid.
                 * Check if the grid exists and the query if it doesn't.
                 * In Plotly, deletes can either be permenant or non-permentant.
                 * Delete the grid in either case.
                 */
                const username = fid.split(':')[0];
                const user = getSetting('USERS').find(
                     u => u.username === username
                );
                const {apikey: apiKey, accessToken} = user;
                return PlotlyAPIRequest(
                    `grids/${fid}`,
                    {username, apiKey, accessToken, method: 'GET'}
                )
                .then(res => {
                    // Permenant deletion
                    if (res.status === 404) {
                        Logger.log(`
                            Grid ID ${fid} doesn't exist on Plotly anymore,
                            removing persistent query.`,
                             2
                        );
                        this.clearQuery(fid);
                        deleteQuery(fid);
                    } else {
                        return res.json().then(filemeta => {
                            if (filemeta.deleted) {
                                Logger.log(`
                                    Grid ID ${fid} was deleted,
                                    removing persistent query.`,
                                    2
                                );
                                this.clearQuery(fid);
                                deleteQuery(fid);
                            }
                        });
                    }
                });

            } else {

                return res.json().then(json => {
                    Logger.log(`Grid ${fid} has been updated.`, 2);
                });

            }

        })

    }

}

export default QueryScheduler;


// TODO - do we allow the user to change their credentials
// and all of their saved queries? if we save
// serializedConfiguration in plotly, then that'll be hard to
// update.
// or wait, no it won't, we can just make an API call to the
// grid and update it.
