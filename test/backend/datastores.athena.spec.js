import {assert} from 'chai';

import {connect} from '../../backend/persistent/datastores/Athena';


// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('Athena Unit Tests:', function () {
    
    it('connect succeeds', function( done ) {
        const conn = {
            username: 'user',
            password: 'password',
            database: 'database',
        };
        connect( conn ).then( connection =>{
            assert.isDefined( connection, 'Connection is defined');
            done();
        }).catch( err =>{
            console.log( 'Error', err);
            done('Should have obtained a valid connection');
        })
    });

    it('connect fails missing username', function( done ) {
        const conn = {
            password: 'password',
            database: 'database',
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing username');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails username is empty', function( done ) {
        const conn = {
            username: '',
            password: 'password',
            database: 'database',
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing username');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails missing password', function( done ) {
        const conn = {
            username: 'user',
            database: 'database',
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing password');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails username is empty', function( done ) {
        const conn = {
            username: 'user',
            password: '',
            database: 'database',
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing password');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails missing database', function( done ) {
        const conn = {
            username: 'user',
            password: '',
            database: 'database',
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing database');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails database is empty', function( done ) {
        const conn = {
            username: 'user',
            password: 'password',
            database: '',
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing database');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });


});
/* eslint-enable no-invalid-this */
