import Sequelize from 'sequelize';

export default class sequelizeManager{
    constructor(){
    }
    initialize (usr, psw, db, prt, engine){
      // create new sequelize object
      this.connection = new Sequelize(db, usr, psw, {
              dialect: engine,
              port:    prt
      });

      // connect
      this.connection.authenticate().then(msg => {
          console.log('succcess: ', msg);
      }).catch(err => {
          console.log('failed: ', err);
      });
    }
}
