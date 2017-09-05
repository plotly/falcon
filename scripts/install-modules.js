const path = require("path");

const electronEnv = (process.argv[2] === '--electron');
const winEnv = (process.platform === 'win32');

function execSync(command) {
    console.log('>>', command);
    return require('child_process').execSync(command, {stdio: 'inherit'});
}


execSync('yarn remove ibm_db');
execSync('yarn add ibm_db@2.0.0');

if (electronEnv) {
    const ibmdbInstaller = path.join(__dirname, '..', 'node_modules', 'ibm_db', 'installer');
    if (!winEnv) execSync(`chmod -R +w ${ibmdbInstaller}`);

    const localBin = require('child_process').execSync('yarn bin').toString().trim();
    const installAppDeps = path.join(localBin, 'electron-builder install-app-deps');
    execSync(installAppDeps);
}
