import {assert} from 'chai';

import {DIALECTS} from '../../app/constants/constants.js';

import {
    query, connect, tables
} from '../../backend/persistent/datastores/Datastores.js';

const connection = {
    dialect: DIALECTS.IBM_DB2,
    username: 'db2user1',
    password: 'w8wfy99DvEmgkBsE',
    host: '127.0.0.1',
    port: 50000,
    database: 'SAMPLE'
};

describe('IBM DB2:', function () {
    it('connect succeeds', function(done) {
        this.timeout(4 * 1000);
        connect(connection).then(database => {
            assert(database.connected);
        }).then(done);
    });

    it('query returns rows and column names', function(done) {
        this.timeout(4 * 1000);
        query(
            'SELECT * FROM DB2INST1.EMP FETCH FIRST 5 ROWS ONLY',
            connection
        ).then(results => {
            assert.deepEqual(results.rows, [
                ['000010', 'CHRISTINE', 'I', 'HAAS', 'A00', '3978', '1995-01-01', 'PRES    ', 18, 'F', '1963-08-24', '152750.00', '1000.00', '4220.00'],
                ['000020', 'MICHAEL', 'L', 'THOMPSON', 'B01', '3476', '2003-10-10', 'MANAGER ', 18, 'M', '1978-02-02', '94250.00', '800.00', '3300.00'],
                ['000030', 'SALLY', 'A', 'KWAN', 'C01', '4738', '2005-04-05', 'MANAGER ', 20, 'F', '1971-05-11', '98250.00', '800.00', '3060.00'],
                ['000050', 'JOHN', 'B', 'GEYER', 'E01', '6789', '1979-08-17', 'MANAGER ', 16, 'M', '1955-09-15', '80175.00', '800.00', '3214.00'],
                ['000060', 'IRVING', 'F', 'STERN', 'D11', '6423', '2003-09-14', 'MANAGER ', 16, 'M', '1975-07-07', '72250.00', '500.00', '2580.00']
            ]);
            assert.deepEqual(results.columnnames, [
                'EMPNO', 'FIRSTNME', 'MIDINIT', 'LASTNAME', 'WORKDEPT',
                'PHONENO', 'HIREDATE', 'JOB', 'EDLEVEL', 'SEX', 'BIRTHDATE',
                'SALARY', 'BONUS', 'COMM'
            ]);
        }).then(done);
    });

    it('tables returns list of tables', function(done) {
        this.timeout(4 * 1000);
        tables(connection).then(result => {
            assert.deepEqual(result, [
                'DB2INST1.ACT', 'DB2INST1.ADEFUSR', 'DB2INST1.CATALOG',
                'DB2INST1.CL_SCHED', 'DB2INST1.CUSTOMER', 'DB2INST1.DEPARTMENT',
                'DB2INST1.DEPT', 'DB2INST1.EMP', 'DB2INST1.EMPACT',
                'DB2INST1.EMPLOYEE', 'DB2INST1.EMPMDC', 'DB2INST1.EMPPROJACT',
                'DB2INST1.EMP_ACT', 'DB2INST1.EMP_PHOTO', 'DB2INST1.EMP_RESUME',
                'DB2INST1.INVENTORY', 'DB2INST1.IN_TRAY', 'DB2INST1.ORG',
                'DB2INST1.PRODUCT', 'DB2INST1.PRODUCTSUPPLIER', 'DB2INST1.PROJ',
                'DB2INST1.PROJACT', 'DB2INST1.PROJECT',
                'DB2INST1.PURCHASEORDER', 'DB2INST1.SALES', 'DB2INST1.STAFF',
                'DB2INST1.STAFFG', 'DB2INST1.SUPPLIERS', 'DB2INST1.VACT',
                'DB2INST1.VASTRDE1', 'DB2INST1.VASTRDE2', 'DB2INST1.VDEPMG1',
                'DB2INST1.VDEPT', 'DB2INST1.VEMP', 'DB2INST1.VEMPDPT1',
                'DB2INST1.VEMPLP', 'DB2INST1.VEMPPROJACT', 'DB2INST1.VFORPLA',
                'DB2INST1.VHDEPT', 'DB2INST1.VPHONE', 'DB2INST1.VPROJ',
                'DB2INST1.VPROJACT', 'DB2INST1.VPROJRE1', 'DB2INST1.VPSTRDE1',
                'DB2INST1.VPSTRDE2', 'DB2INST1.VSTAFAC1', 'DB2INST1.VSTAFAC2'
            ]);
        }).then(done);
    });
});
