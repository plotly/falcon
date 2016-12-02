import * as Connections from './datastores/Datastores';
import {updateGrid} from './PlotlyAPI';
import {getConnectionById} from './Connections';
import {getQuery, getQueries, saveQuery, deleteQuery} from './Queries';
import {getSetting} from '../settings';
import Logger from '../logger';
import {PlotlyAPIRequest} from './PlotlyAPI';
import {has} from 'ramda';

class QueryScheduler {
    constructor() {
        this.scheduleQuery = this.scheduleQuery.bind(this);
        this.loadQueries = this.loadQueries.bind(this);
        this.clearQuery = this.clearQuery.bind(this);
        this.clearQueries = this.clearQueries.bind(this);
        this.queryAndUpdateGrid = this.queryAndUpdateGrid.bind(this);

        // Expose this.job so that tests can overwrite it
        this.job = this.queryAndUpdateGrid;

        // Expose this.minimumRefreshInterval so that tests can overwrite it
        this.minimumRefreshInterval = 60;
        this.queryJobs = {};
    }

    scheduleQuery({
        requestor,
        fid,
        uids,
        refreshInterval,
        query,
        connectionId
    }) {
        if (!refreshInterval) {
            throw new Error('Refresh interval was not supplied');
        // TODO - bump up to 60 when done testing.
    } else if (refreshInterval < this.minimumRefreshInterval) {
            throw new Error(
                'Refresh interval must be at least ' +
                `${this.minimumRefreshInterval} ` +
                `(${this.minimumRefreshInterval} seconds). ` +
                `${refreshInterval} was supplied.`
            );
        }

        Logger.log(`Scheduling "${query}" with connection ${connectionId} updating grid ${fid}`);
        // Delete query if it is already saved
        if (getQuery(fid)) {
            deleteQuery(fid);
        }

        // If for some reason it wasn't on file but is in memory, delete it.
        if (has(fid, this.queryJobs)) {
            this.clearQuery(fid);
        }

        // Save query to a file
        saveQuery({
            requestor,
            fid,
            uids,
            refreshInterval,
            query,
            connectionId
        });

        // Schedule
        this.queryJobs[fid] = setInterval(
            () => {
                try {
                    this.job(fid, uids, query, connectionId, requestor)
                    .catch(error => {
                        Logger.log(error, 0);
                    });
                } catch (e) {
                    Logger.log(e, 0);
                }
            },
            refreshInterval * 1000
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
        clearInterval(fid);
        delete this.queryJobs[fid];
    }

    // Clear out setInterval queries from memory - used to clean up tests
    clearQueries() {
        Object.keys(this.queryJobs).forEach(this.clearQuery);
    }

    queryAndUpdateGrid (fid, uids, queryString, connectionId, requestor) {
        const requestedDBConnections = getConnectionById(connectionId);
        let startTime = process.hrtime();

        /*
         * Do a pre-query check that the user has the correct credentials
         * and that the connector can connect to plotly
         */
        /*
         * If the user is the owner, then requestor === fid.split(':')[0]
         * If the user is a collaborator, then requestor is different
         */
        const username = requestor;
        const user = getSetting('USERS').find(
             u => u.username === username
        );

        // Check if the user even exists
        if (!user || !(user.apiKey || user.accessToken)) {
            /*
             * Heads up - the front end looks for "Unauthenticated" in this
             * error message. So don't change it!
             */
            const errorMessage = (
                `Unauthenticated: Attempting to update grid ${fid} but the ` +
                `authentication credentials for the user "${username}" do not exist.`
            );
            Logger.log(errorMessage, 0);
            throw new Error(errorMessage);
        }
        const {apiKey, accessToken} = user;
        // Check if the credentials are valid
        return PlotlyAPIRequest('users/current', {
            method: 'GET', username, apiKey, accessToken
        }).then(res => {
            if (res.status !== 200) {
                const errorMessage = (
                    `Yikes! ${getSetting('PLOTLY_API_URL')} failed to identify ${username}.`
                )
                Logger.log(errorMessage, 0);
                throw new Error(errorMessage);
            }

            Logger.log(`Querying "${queryString}" with connection ${connectionId} to update grid ${fid}`, 2);
            return Connections.query(queryString, requestedDBConnections)

        }).then(rowsAndColumns => {

            Logger.log(`Query "${queryString}" took ${process.hrtime(startTime)[0]} seconds`, 2);
            Logger.log(`Updating grid ${fid} with new data`, 2);
            Logger.log(
                'First row: ' +
                JSON.stringify(rowsAndColumns.rows.slice(0, 1)),
            2);

            startTime = process.hrtime();
            return updateGrid(
                rowsAndColumns.rows,
                fid,
                uids,
                requestor
            );

        }).then(res => {
            Logger.log(`Request to Plotly for grid ${fid} took ${process.hrtime(startTime)[0]} seconds`, 2);
            if (res.status !== 200) {
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

                return PlotlyAPIRequest(
                    `grids/${fid}`,
                    {username, apiKey, accessToken, method: 'GET'}
                ).then(res => {

                    if (res.status === 404) {
                        Logger.log(('' +
                            `Grid ID ${fid} doesn't exist on Plotly anymore, ` +
                            'removing persistent query.'),
                             2
                        );
                        this.clearQuery(fid);
                        return deleteQuery(fid);
                    } else {
                        return res.text()
                        .then(text => {
                            let filemeta;
                            try {
                                filemeta = JSON.parse(text);
                            } catch (e) {
                                // Well, that's annoying.
                                Logger.log(`Failed to parse the JSON of request ${fid}`, 0);
                                Logger.log(e)
                                Logger.log('Text response: ' + text, 0);
                                throw new Error(e);
                            }
                            if (filemeta.deleted) {
                                Logger.log(`
                                    Grid ID ${fid} was deleted,
                                    removing persistent query.`,
                                    2
                                );
                                this.clearQuery(fid);
                                return deleteQuery(fid);
                            }
                        });
                    }
                });

            } else {

                return res.json().then(json => {
                    Logger.log(`Grid ${fid} has been updated.`, 2);
                });

            }

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
