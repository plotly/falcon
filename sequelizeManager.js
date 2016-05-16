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

      // connect
    this.connection.authenticate().then(msg => {
      this.connectionState = `succcess:  ${msg}`;
    }).catch(err => {
      this.connectionState = `failed: ' + ${err}`;
    });
  }
}
