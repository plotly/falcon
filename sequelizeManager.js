import Sequelize from 'sequelize';

export default class SequelizeManager {
  constructor() {
    this.connectionState = 'none: credentials were not sent';
  }
  login(usr, psw, db, prt, engine) {
      // create new sequelize object
    this.connection = new Sequelize(db, usr, psw, {
      dialect: engine,
      port: prt
    });
      // returns a promise of database msg
    return this.connection.authenticate();
  }
}
