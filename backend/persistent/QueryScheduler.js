import {has} from 'ramda';
import * as scheduler from 'node-schedule';

import {getConnectionById} from './Connections.js';
import * as Connections from './datastores/Datastores.js';
import {mapRefreshToCron, mapCronToRefresh} from '../utils/cronUtils.js';
import {extractOrderedUids} from '../utils/gridUtils.js';
import Logger from '../logger';
import {getQuery, getQueries, saveQuery, updateQuery, deleteQuery} from './Queries.js';
import {getCredentials, getSetting} from '../settings.js';
import {getCurrentUser, getGridMeta, newGrid, patchGrid, updateGrid, getGridColumn} from './plotly-api.js';
import {EXE_STATUS} from '../../shared/constants.js';

const SUCCESS_CODES = [200, 201, 204];

class QueryScheduler {
    constructor() {
        this.scheduleQuery = this.scheduleQuery.bind(this);
        this.loadQueries = this.loadQueries.bind(this);
        this.clearQuery = this.clearQuery.bind(this);
        this.clearQueries = this.clearQueries.bind(this);
        this.queryAndCreateGrid = this.queryAndCreateGrid.bind(this);
        this.queryAndUpdateGrid = this.queryAndUpdateGrid.bind(this);

        // this.job wraps this.queryAndUpdateGrid to avoid concurrent runs of the same job
        this.runningJobs = {};

        this.job = (fid, query, connectionId, requestor, cronInterval, refreshInterval) => {
            const startedAt = Date.now();
            try {
                if (this.runningJobs[fid]) {
                    return;
                }

                this.runningJobs[fid] = true;

                updateQuery(fid, {
                    lastExecution: {
                        status: EXE_STATUS.running,
                        startedAt
                    }
                });

                return this.queryAndUpdateGrid(fid, query, connectionId, requestor, cronInterval, refreshInterval)
                    .then(exeRes => {
                        const {completedAt, duration, rowCount} = exeRes.queryResults;
                        updateQuery(fid, {
                            lastExecution: {
                                status: EXE_STATUS.ok,
                                startedAt,
                                completedAt,
                                duration,
                                rowCount
                            }
                        });
                    })
                    .catch(error => {
                        Logger.log(error, 0);
                        updateQuery(fid, {
                            lastExecution: {
                                status: EXE_STATUS.failed,
                                startedAt,
                                completedAt: Date.now(),
                                errorMessage: error.toString()
                            }
                        });
                    })
                    .then(() => {
                        delete this.runningJobs[fid];
                    });
            } catch (e) {
                Logger.log(e, 0);
                updateQuery(fid, {
                    lastExecution: {
                        status: EXE_STATUS.failed,
                        startedAt,
                        completedAt: Date.now(),
                        errorMessage: e.toString()
                    }
                });
            }
        };

        // Expose this.minimumRefreshInterval so that tests can overwrite it
        this.minimumRefreshInterval = 60;
        this.queryJobs = {};
    }

    scheduleQuery({
        requestor,
        fid,
        uids,
        refreshInterval = null,
        cronInterval = null,
        name,
        tags,
        lastExecution,
        nextScheduledAt,
        query,
        connectionId
    }) {
        if (!cronInterval && !refreshInterval) {
            throw new Error('A scheduling interval was not supplied');
        } else if (refreshInterval && refreshInterval < this.minimumRefreshInterval) {
            throw new Error(
                [
                    `Refresh interval must be at least ${this.minimumRefreshInterval} seconds`,
                    `(supplied ${refreshInterval})`
                ].join(' ')
            );
        }

        if (name && name.length > 150) {
            throw new Error('Invalid query name. Must be less than 150 characters.');
        }

        Logger.log(`Scheduling "${query}" with connection ${connectionId} updating grid ${fid}`);

        // Delete query if it is already saved
        if (getQuery(fid)) {
            deleteQuery(fid);
        }

        // Remove the query from the in-memory timers
        if (has(fid, this.queryJobs)) {
            this.clearQuery(fid);
        }

        // Save query to a file
        const queryParams = {
            requestor,
            fid,
            uids,
            refreshInterval: refreshInterval || mapCronToRefresh(cronInterval),
            cronInterval,
            query,
            connectionId,
            lastExecution,
            nextScheduledAt,
            name,
            tags
        };

        saveQuery(queryParams);

        // Schedule
        const job = () => this.job(fid, query, connectionId, requestor, cronInterval, refreshInterval);
        let jobInterval = cronInterval;
        if (!jobInterval) {
            // convert refresh interval to cron representation
            jobInterval = mapRefreshToCron(refreshInterval);
        }

        this.queryJobs[fid] = scheduler.scheduleJob(jobInterval, job);

        this.queryJobs[fid].on('scheduled', nextInvocation => {
            updateQuery(fid, {nextScheduledAt: nextInvocation.getTime()});
        });

        // we'll miss the first schedule event, so initialize manually the first time
        updateQuery(fid, {nextScheduledAt: this.queryJobs[fid].nextInvocation().getTime()});
    }

    // Load and schedule queries - To be run on app start.
    loadQueries() {
        // read queries from a file
        const queries = getQueries();
        queries.forEach(this.scheduleQuery);
    }

    // Remove query from memory
    clearQuery(fid) {
        if (this.queryJobs[fid]) {
            this.queryJobs[fid].cancel();
        }
        delete this.queryJobs[fid];
    }

    // Clear out setInterval queries from memory - used to clean up tests
    clearQueries() {
        Object.keys(this.queryJobs).forEach(this.clearQuery);
    }

    queryAndCreateGrid(filename, query, connectionId, requestor, cronInterval, refreshInterval) {
        const {username, apiKey, accessToken} = getCredentials(requestor);
        const formattedRefresh = refreshInterval || mapCronToRefresh(cronInterval);
        let currStartTime;
        let fid;

        const BEGIN_STAMP = Date.now();
        const queryResults = {};

        // Check if the user even exists
        if (!username || !(apiKey || accessToken)) {
            /*
             * Warning: The front end looks for "Unauthenticated" in this error message. Don't change it!
             */
            const errorMessage =
                'Unauthenticated: Attempting to create a grid but the ' +
                `authentication credentials for the user "${username}" do not exist.`;
            Logger.log(errorMessage, 0);
            throw new Error(errorMessage);
        }

        // Check if the credentials are valid
        return getCurrentUser(username)
            .then(res => {
                if (res.status !== 200) {
                    const errorMessage = `Unauthenticated: ${getSetting(
                        'PLOTLY_API_URL'
                    )} failed to identify ${username}.`;
                    Logger.log(errorMessage, 0);
                    throw new Error(errorMessage);
                }

                currStartTime = process.hrtime();

                Logger.log(`Querying "${query}" with connection ${connectionId} to create a new grid`, 2);
                return Connections.query(query, getConnectionById(connectionId)).catch(e => {
                    /*
                * Warning: The front end looks for "QueryExecutionError" in this error message. Don't change it!
                */
                    throw new Error(`QueryExecutionError: ${e.message}`);
                });
            })
            .then(({rows, columnnames}) => {
                Logger.log(`Query "${query}" took ${process.hrtime(currStartTime)[0]} seconds`, 2);
                Logger.log('Create a new grid with new data', 2);
                Logger.log(`First row: ${JSON.stringify(rows.slice(0, 1))}`, 2);

                queryResults.rowCount = rows && rows.length ? rows.length : 0;

                currStartTime = process.hrtime();

                return newGrid(filename, columnnames, rows, requestor).catch(e => {
                    /*
                * Warning: The front end looks for "PlotlyApiError" in this error message. Don't change it!
                */
                    throw new Error(`PlotlyApiError: ${e.message}`);
                });
            })
            .then(res => {
                Logger.log(`Request to Plotly for creating a grid took ${process.hrtime(currStartTime)[0]} seconds`, 2);

                if (res.status !== 201) {
                    Logger.log(`Error ${res.status} while creating a grid`, 2);
                }

                return res.json();
            })
            .then(json => {
                fid = json.file.fid;
                queryResults.uids = json.file.cols.map(col => col.uid);

                currStartTime = process.hrtime();
                return patchGrid(fid, requestor, {
                    metadata: {
                        query,
                        connectionId,
                        connectorUrl: getSetting('BASE_URL')
                    },
                    refresh_interval: formattedRefresh
                }).catch(e => {
                    /*
                * Warning: The front end looks for "MetadataError" in this error message. Don't change it!
                */
                    throw new Error(`MetadataError: ${e.message}`);
                });
            })
            .then(() => {
                Logger.log(`Request to Plotly for creating a grid took ${process.hrtime(currStartTime)[0]} seconds`, 2);
                Logger.log(`Grid ${fid} has been updated.`, 2);

                queryResults.duration = Math.floor((Date.now() - BEGIN_STAMP) / 1000);
                queryResults.completedAt = Date.now();

                return {
                    fid,
                    queryResults
                };
            });
    }

    queryAndUpdateGrid(fid, query, connectionId, requestor, cronInterval, refreshInterval) {
        const requestedDBConnections = getConnectionById(connectionId);
        const formattedRefresh = refreshInterval || mapCronToRefresh(cronInterval);
        let currStartTime = process.hrtime();

        const BEGIN_STAMP = Date.now();
        const queryResults = {};

        /*
         * Do a pre-query check that the user has the correct credentials
         * and that the connector can connect to plotly
         */
        /*
         * If the user is the owner, then requestor === fid.split(':')[0]
         * If the user is a collaborator, then requestor is different
         */
        const {username, apiKey, accessToken} = getCredentials(requestor);

        // Check if the user even exists
        if (!username || !(apiKey || accessToken)) {
            /*
             * Warning: The front end looks for "Unauthenticated" in this error message. Don't change it!
             */
            const errorMessage =
                `Unauthenticated: Attempting to update grid ${fid} but the ` +
                `authentication credentials for the user "${username}" do not exist.`;
            Logger.log(errorMessage, 0);
            throw new Error(errorMessage);
        }

        // Check if the credentials are valid
        return getCurrentUser(username)
            .then(res => {
                if (res.status !== 200) {
                    const errorMessage = `Unauthenticated: ${getSetting(
                        'PLOTLY_API_URL'
                    )} failed to identify ${username}.`;
                    Logger.log(errorMessage, 0);
                    throw new Error(errorMessage);
                }

                Logger.log(`Querying "${query}" with connection ${connectionId} to update grid ${fid}`, 2);
                return Connections.query(query, requestedDBConnections).catch(e => {
                    /*
                * Warning: The front end looks for "QueryExecutionError" in this error message. Don't change it!
                */
                    throw new Error(`QueryExecutionError: ${e.message}`);
                });
            })
            .then(({rows, columnnames}) => {
                Logger.log(`Query "${query}" took ${process.hrtime(currStartTime)[0]} seconds`, 2);
                Logger.log(`Updating grid ${fid} with new data`, 2);
                Logger.log('First row: ' + JSON.stringify(rows.slice(0, 1)), 2);

                queryResults.rowCount = rows && rows.length ? rows.length : 0;

                currStartTime = process.hrtime();

                return updateGrid(rows, columnnames, fid, requestor).catch(e => {
                    /*
                * Warning: The front end looks for "PlotlyApiError" in this error message. Don't change it!
                */
                    throw new Error(`PlotlyApiError: ${e.message}`);
                });
            })
            .then(res => {
                Logger.log(`Request to Plotly for grid ${fid} took ${process.hrtime(currStartTime)[0]} seconds`, 2);
                if (!SUCCESS_CODES.includes(res.status)) {
                    Logger.log(`Error ${res.status} while updating grid ${fid}.`, 2);

                    /*
                 * If it was a 404 error and the requestor was the owner, then
                 * it might've been because the owner has deleted their grid.
                 * If it was a 404 and the requestor wasn't the owner,
                 * then either the owner has deleted the grid or the
                 * requestor no longer has permission to view the graph.
                 * In any case, delete the query.
                 * Note that when a user is requesting to update or save
                 * a query via `post /queries`, we first check that they have
                 * permission to edit the file. Otherwise, this code block
                 * could delete an owner's grid when given any request by
                 * a non-collaborator.
                 * In Plotly, deletes can either be permenant or non-permentant.
                 * Delete the query in either case.
                 */

                    /*
                 * Plotly's API returns a 500 instead of a 404 in these
                 * PUTs. To check if the file is really there or not,
                 * make an additional API call to GET it
                 */

                    return getGridMeta(fid, username).then(resFromGET => {
                        if (resFromGET.status === 404) {
                            Logger.log(`Grid ID ${fid} doesn't exist on Plotly anymore, removing persistent query.`, 2);
                            this.clearQuery(fid);
                            return deleteQuery(fid);
                        }

                        return resFromGET.text().then(text => {
                            let filemeta;
                            try {
                                filemeta = JSON.parse(text);
                            } catch (e) {
                                Logger.log(`Failed to parse the JSON of request ${fid}`, 0);
                                Logger.log(e);
                                Logger.log('Text response: ' + text, 0);
                                throw new Error(e);
                            }
                            if (filemeta.deleted) {
                                Logger.log(
                                    `
                                Grid ID ${fid} was deleted,
                                removing persistent query.`,
                                    2
                                );
                                this.clearQuery(fid);
                                return deleteQuery(fid);
                            }
                            /*
                            * Warning: The front end looks for "PlotlyApiError" in this error message. Don't change it!
                            */
                            throw new Error(`PlotlyApiError: non 200 grid update response code (got: ${res.status})`);
                        });
                    });
                }

                currStartTime = process.hrtime();

                return patchGrid(fid, requestor, {
                    metadata: {
                        query,
                        connectionId,
                        connectorUrl: getSetting('BASE_URL')
                    },
                    refresh_interval: formattedRefresh
                }).catch(e => {
                    /*
                * Warning: The front end looks for "MetadataError" in this error message. Don't change it!
                */
                    throw new Error(`MetadataError: ${e.message}`);
                });
            })
            .then(res => {
                Logger.log(`Request to Plotly for creating a grid took ${process.hrtime(currStartTime)[0]} seconds`, 2);
                Logger.log(`Grid ${fid} has been updated.`, 2);

                // res is undefined if the `deleteQuery` is returned above
                if (res && res.status && res.status !== 200) {
                    throw new Error(`MetadataError: error updating grid metadata (status: ${res.status})`);
                }

                currStartTime = process.hrtime();

                // fetch updated grid column for returning
                return getGridColumn(fid, requestor);
            })
            .then(res => {
                Logger.log(
                    `Request to Plotly for fetching updated grid took ${process.hrtime(currStartTime)[0]} seconds`,
                    2
                );

                if (res.status !== 200) {
                    throw new Error(`PlotlyApiError: error fetching updated columns (status: ${res.status})`);
                }

                return res.json();
            })
            .then(grid => {
                queryResults.uids = extractOrderedUids(grid);
                queryResults.duration = Math.floor((Date.now() - BEGIN_STAMP) / 1000);
                queryResults.completedAt = Date.now();
                return {
                    fid,
                    queryResults
                };
            });
    }
}

export default QueryScheduler;

// TODO - do we allow the user to change their connection
// and all of their saved queries? if we save
// serializedConfiguration in plotly, then that'll be hard to
// update.
// or wait, no it won't, we can just make an API call to the
// grid and update it.
