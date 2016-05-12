//import Sequelize from 'sequelize';

// local variables
var logmessage = 'Plotly MySQL connector: ';

// http://localhost:5000/login?USER=root&DB=fake_plotly

// extract variables from the sent url to localhost 5000
var usr = 'readonly';
var psw = 'password';
var db = 'world';
var prt = 3308;
var engine = 'mysql';

console.log('Trying to connect to database ' + db + ' as ' + usr);
//
// const sequelize = new Sequelize(db, usr, psw, {
//       dialect: engine, // 'mysql'|'mariadb'|'sqlite'|'postgres'|'mssql'
//       port:    prt, // or 5432 (for postgres)
// });

export function makeQuery () {
    console.warn('makeQuery');
    // debugger;

    return dispatch => {
        /*
        sequelize.authenticate().then(msg => {
            console.warn('MSG: ', msg);
        }).catch(err => {
            console.warn('err: ', err);
        });
        */
    }
}
