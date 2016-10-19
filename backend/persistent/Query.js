import Sequelize from 'sequelize';
import {parseSQL} from '../parse';

// Sequelize query
export function queryDatabase(queryString, configuration) {
    // ^^ pulled from sequelizeManager.createConnection
    const {
        username, password, database, port, dialect, storage, host, ssl
    } = configuration;

    const options = {
        dialect, host, port, storage,
        dialectOptions: {ssl}
    };

    const connection = new Sequelize(
        database, username, password, options
    );

    return connection.authenticate()
        .then(() => connection.query(
            queryString,
            {type: Sequelize.QueryTypes.SELECT}
        )).then(results => parseSQL(results));
}
