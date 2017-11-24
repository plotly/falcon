const os = require('os');

function execSync(command) {
    console.log('>>', command); // eslint-disable-line no-console
    return require('child_process').execSync(command, {stdio: 'inherit'});
}

// Workaround for https://github.com/ibmdb/node-ibm_db/issues/329
if (os.platform() === 'darwin') {
    execSync([
        'install_name_tool -change',
        '`pwd`/node_modules/ibm_db/installer/clidriver/lib/libdb2.dylib',
        '@loader_path/../../installer/clidriver/lib/libdb2.dylib',
        'node_modules/ibm_db/build/Release/odbc_bindings.node'
    ].join(' '));
}
