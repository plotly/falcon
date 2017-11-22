const os = require('os');
const path = require('path');

const electronEnv = (process.argv[2] === '--electron');

function execSync(command) {
    console.log('>>', command); // eslint-disable-line no-console
    return require('child_process').execSync(command, {stdio: 'inherit'});
}

if (electronEnv) {
    const localBin = require('child_process').execSync('yarn bin').toString().trim();
    const installAppDeps = path.join(localBin, 'electron-builder install-app-deps');
    execSync(installAppDeps);
} else {
    execSync('yarn install --force');
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
