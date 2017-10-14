/* eslint strict: 0, no-shadow: 0, no-unused-vars: 0, no-console: 0 */
'use strict';

require('babel-polyfill');
const os = require('os');
const webpack = require('webpack');
const electronCfg = require('./webpack.config.electron.js');
const cfg = require('./webpack.config.production.js');
const packager = require('electron-packager');
const del = require('del');
const exec = require('child_process').exec;
const argv = require('minimist')(process.argv.slice(2));
const pkg = require('./package.json');
const deps = Object.keys(pkg.dependencies);
const devDeps = Object.keys(pkg.devDependencies);

const appName = argv.name || argv.n || pkg.productName;
const shouldUseAsar = argv.asar || argv.a || false;
const shouldBuildAll = argv.all || false;

const userFriendlyAppNames = {
    arch: {ia32: '32bit', x64: '64bit'}, plat: {linux: 'Linux', darwin: 'Mac', win32: 'Windows'}
};

const DEFAULT_OPTS = {
    electronVersion: devDeps.electron,
    dir: './',
    name: appName,
    asar: shouldUseAsar,
    ignore: [
        '^/scripts($|/)',
        '^/spec($|/)',
        '^/test($|/)',
        '^/tools($|/)',
        '^/release($|/)',
        '^/ssl/certs($|/)',
        '^/backend/main.development.js'
    ]
    .concat(
        devDeps
        .map(dep => `/node_modules/${dep}($|/)`))
};

const icon = argv.icon || argv.i || 'app/app';

if (icon) {
    DEFAULT_OPTS.icon = icon;
}

startPack();

function build(cfg) {
    return new Promise((resolve, reject) => {
        webpack(cfg, (err, stats) => {
            if (err) return reject(err);
            resolve(stats);
        });
    });
}

function startPack() {
    console.log('start pack...');
    /*
     * Workaround for: https://github.com/ibmdb/node-ibm_db/issues/329
     * This can be removed once the issue is resolved.
     */
    if (os.platform == 'darwin') {
        exec('install_name_tool -change `pwd`/node_modules/ibm_db/installer/clidriver/lib/libdb2.dylib @loader_path/../../installer/clidriver/lib/libdb2.dylib node_modules/ibm_db/build/Release/odbc_bindings.node');
    }
    build(electronCfg)
    .then(() => build(cfg))
    .then(() => del('release'))
    .then(paths => {
        if (shouldBuildAll) {
            // build for all platforms
            const archs = ['ia32', 'x64'];
            const platforms = ['linux', 'win32', 'darwin'];

            platforms.forEach(plat => {
                archs.forEach(arch => {
                    pack(plat, arch, log(plat, arch));
                });
            });
        } else {
            // build for current platform only
            pack(os.platform(), os.arch(), log(os.platform(), os.arch()));
        }
    })
    .catch(err => {
        console.error(err);
    });
}

function pack(plat, arch, cb) {
    // there is no darwin ia32 electron
    if (plat === 'darwin' && arch === 'ia32') return;

    const iconObj = {
        icon: DEFAULT_OPTS.icon + (() => {
            let extension = '.png';
            if (plat === 'darwin') {
                extension = '.icns';
            } else if (plat === 'win32') {
                extension = '.ico';
            }
            return extension;
        })()
    };

    const opts = Object.assign({}, DEFAULT_OPTS, iconObj, {
        platform: plat,
        arch,
        prune: true,
        'appVersion': pkg.version,
        out: `release/${userFriendlyAppNames.plat[plat]}-${userFriendlyAppNames.arch[arch]}`
    });

    packager(opts, cb);
}

function log(plat, arch) {
    return (err, filepath) => {
        if (err) return console.error(err);
        console.log(`${plat}-${arch} finished! see release/${userFriendlyAppNames.plat[plat]}-${userFriendlyAppNames.arch[arch]}`);
    };
}
