import Sequelize from 'sequelize';

export default class SequelizeManager {
    constructor() {
        this.connectionState = 'none: credentials were not sent';
    }
    login({username, password, database, portNumber, engine}) {
        // create new sequelize object
        this.connection = new Sequelize(database, username, password, {
            dialect: engine,
            port: portNumber
        });
        // returns a promise of database msg
        return this.connection.authenticate();
    }
}
