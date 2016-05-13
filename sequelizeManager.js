import Sequelize from 'sequelize';

export default class sequelizeManager{
    constructor(){
        // nothing for now
    }
    initialize (usr, psw, db, prt, engine){
      // create new sequelize object
      this.connection = new Sequelize(db, usr, psw, {
              dialect: engine,
              port:    prt
      });

      console.log('making request');
      // connect
      this.connection.authenticate().then(msg => {
          console.log('succcess: ', msg);
      }).catch(err => {
          console.log('failed: ', err);
      });
    }
}
