import {DIALECTS} from '../../../constants/constants.js';

export function mapDialect(dialect) {
  return ({
    [DIALECTS.APACHE_SPARK]: 'text/x-sparksql',
    [DIALECTS.MYSQL]: 'text/x-mysql',
    [DIALECTS.SQLITE]: 'text/x-sqlite',
    [DIALECTS.MARIADB]: 'text/x-mariadb',
    [DIALECTS.ORACLE]: 'text/x-plsql',
    [DIALECTS.POSTGRES]: 'text/x-pgsql',
    [DIALECTS.REDSHIFT]: 'text/x-pgsql',
    [DIALECTS.MSSQL]: 'text/x-mssql'
    })[dialect] || 'text/x-sql';
}