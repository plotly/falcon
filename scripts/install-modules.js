const path = require('path');

const electronEnv = (process.argv[2] === '--electron');

function execSync(command) {
    console.log('>>', command);
    return require('child_process').execSync(command, {stdio: 'inherit'});
}

if (electronEnv) {
    const localBin = require('child_process').execSync('yarn bin').toString().trim();
    const installAppDeps = path.join(localBin, 'electron-builder install-app-deps');
    execSync(installAppDeps);
} else {
    execSync('yarn install --force');
}
