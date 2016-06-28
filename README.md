# Plotly Database Connector

The Plotly database connector is a cross-platform desktop application that connects [Plotly 2.0](https://plot.ly/alpha/workspace) to your database.

![](http://i.imgur.com/Agd1Uat.gif)

Plotly 2.0 makes HTTP requests from the local web browser directly to this database connector app. This database connector runs as a server on localhost and forwards queries from the Plotly 2.0 web-application to the database that connect to. Requests are made client-side, so you don't need to open up the connector or your database to the world, you just need to be able to access it from the machine that is running this connector app.

[Learn more in our online documentation](help.plot.ly/database-connectors/).

## Development

This app is built with Electron, React, Redux, and Sequelize.  This was

Originally forked from [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate).


### Installation

clone the repo via git:

```bash
git clone https://github.com/plotly/electron-sql-connector your-project-name
```

And then install dependencies.

```bash
$ cd your-project-name && npm run install
```

Run this two commands __simultaneously__ in different console tabs.

```bash
$ npm run hot-server
$ npm run start-hot
```

or run two servers with one command

```bash
$ npm run dev
```

*Note: requires a node version >= 4 and an npm version >= 2.*

### Externals

If you use any 3rd party libraries which can't be built with webpack, you must list them in your `webpack.config.base.js`：

```javascript
externals: [
  // put your node 3rd party libraries which can't be built with webpack here (mysql, mongodb, and so on..)
]
```

You can find those lines in the file.


### CSS Modules

This boilerplate out of the box is configured to use [css-modules](https://github.com/css-modules/css-modules).

All `.css` file extensions will use css-modules unless it has `.global.css`.

If you need global styles, stylesheets with `.global.css` will not go through the
css-modules loader. e.g. `app.global.css`


### Packaging

```bash
$ npm run package
```

To package apps for all platforms:

```bash
$ npm run package-all
```

#### Options

- --name, -n: Application name (default: ElectronReact)
- --version, -v: Electron version (default: latest version)
- --asar, -a: [asar](https://github.com/atom/asar) support (default: false)
- --icon, -i: Application icon
- --all: pack for all platforms

Use `electron-packager` to pack your app with `--all` options for darwin (osx), linux and win32 (windows) platform. After build, you will find them in `release` folder. Otherwise, you will only find one for your os.

`test`, `tools`, `release` folder and devDependencies in `package.json` will be ignored by default.

#### Default Ignore modules

We add some module's `peerDependencies` to ignore option as default for application size reduction.

- `babel-core` is required by `babel-loader` and its size is ~19 MB
- `node-libs-browser` is required by `webpack` and its size is ~3MB.

> **Note:** If you want to use any above modules in runtime, for example: `require('babel/register')`, you should move them from `devDependencies` to `dependencies`.

#### Building windows apps from non-windows platforms

Please checkout [Building windows apps from non-windows platforms](https://github.com/maxogden/electron-packager#building-windows-apps-from-non-windows-platforms).

#### How hot-reloading works on Electron

We use [webpack-target-electron-renderer](https://github.com/chentsulin/webpack-target-electron-renderer) to provide a build target for electron renderer process. Read more information [here](https://github.com/chentsulin/webpack-target-electron-renderer#how-this-module-works).

> Note: webpack >= 1.12.15 has built-in support for `electron-main` and `electron-renderer` targets.

## License
Code released under the MIT © [License](Code released under the [MIT license](https://github.com/plotly/plotly-sql-connector/blob/master/LICENSE)
