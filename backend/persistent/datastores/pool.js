export default class Pool {
    /**
     * Pool keeps a list of clients indexed by connection objects
     *
     * @param {function} newClient       Function that takes a connection object and creates a new client
     * @param {function} sameConnection  Function that returns whether two connection objects are the same
     */
    constructor(newClient, sameConnection) {
        this.newClient = newClient;
        this.sameConnection = sameConnection;
        this._pool = [];
    }

    /**
     * Get client indexed by connection (if no client found, a new client is created using newClient)
     * @param {object} connection  Connection object
     * @returns {*} client for connection
     */
    getClient(connection) {
        for (let i = this._pool.length - 1; i >= 0; i--) {
            if (this.sameConnection(connection, this._pool[i][0])) {
                return this._pool[i][1];
            }
        }

        const client = this.newClient(connection);
        this._pool.push([connection, client]);
        return client;
    }

    /**
     * Remove connection from pool
     * @param {object} connection  Connection object
     * @returns {*} removed client (or undefined, if no client was found)
     */
    remove(connection) {
        for (let i = this._pool.length - 1; i >= 0; i--) {
            if (this.sameConnection(connection, this._pool[i][0])) {
                return this._pool.splice(i, 1)[0][1];
            }
        }
    }
}
