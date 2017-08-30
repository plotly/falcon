const path = require("path");

const electronEnv = (process.argv[2] === '--electron');
const winEnv = (process.platform === 'win32');

function execSync(command) {
    console.log('>>', command);
    return require('child_process').execSync(command, {stdio: 'inherit'});
}


const globalBin = require('child_process').execSync('npm bin -g').toString().trim();
const globalNpm = path.join(globalBin, 'npm');

execSync(`${globalNpm} uninstall --no-save ibm_db`);
execSync(`${globalNpm} install ibm_db`);

if (electronEnv) {
    const root = require('child_process').execSync('npm root').toString().trim();
    const ibmdbInstaller = path.join(root, 'ibm_db', 'installer');
    if (!winEnv) execSync(`chmod -R +w ${ibmdbInstaller}`);

    const localBin = require('child_process').execSync('npm bin').toString().trim();
    const installAppDeps = path.join(localBin, 'electron-builder install-app-deps');
    execSync(installAppDeps);
}
