# Plotly Database Connector
<p align="center">
<img src="https://raw.githubusercontent.com/plotly/plotly-database-connector/master/app/app.ico">
</p>

The Plotly database connector is a cross-platform desktop application that connects [Plotly 2.0](https://plot.ly/alpha/workspace) to your database.

![](http://g.recordit.co/LqhQcEcwti.gif)

Plotly 2.0 makes HTTP requests from the local web browser directly to this database connector app. This database connector runs as a server on localhost and forwards queries from the Plotly 2.0 web-application to the database that connect to. Requests are made client-side, so you don't need to open up the connector or your database to the world, you just need to be able to access it from the machine that is running this connector app.

[Learn more in our online documentation](http://help.plot.ly/database-connectors/) or just give it a try in [Plotly 2.0](https://plot.ly/alpha/workspace).


### Develop and Contribute

Note that this section targets contributers and those who wish to set up and run the server themselves. If you're interested in using the distributed App, [download the latest release.](https://github.com/plotly/plotly-database-connector/releases)

##### Installation
Start by cloning the repo via git:

```bash
git clone https://github.com/plotly/electron-sql-connector your-project-name
```

And then install dependencies.

```bash
$ cd your-project-name && npm install
```

*Note: requires a node version >= 4 and an npm version >= 2.*

##### Run as Electron App
Run the app with
```bash
$ npm run build
$ npm run start
```

##### Run as Headless Server
Modify app's settings to your requirements.
If it does not exist, create a  file at `{your-home-directory}/.plotly/connector/settings.yaml`.
The file may take the following attributes and their respeective default values, (ensure to use the correct YAML syntax)

*Note: If you are an on-prem user, ensure that you have modified the `PLOTLY_API_DOMAIN` value to your on-prem Plotly base domain (such as `PLOTLY_API_DOMAIN: 'api-plotly.your-company-name.com`).

```
HEADLESS: false
STORAGE_PATH: 'os.homedir()/.plotly/connector'
PLOTLY_API_DOMAIN: 'api.plot.ly'
CONNECTOR_HTTPS_DOMAIN: 'connector.plot.ly'
CORS_ALLOWED_ORIGINS: 
    - 'https://plot.ly'
    - 'https://stage.plot.ly'
    - 'https://local.plot.ly'
PORT: 9494
KEY_FILE: '/ssl/certs/server/privkey.pem'
CSR_FILE: '/ssl/certs/server/fullchain.pem'
APP_DIRECTORY: `${__dirname}/../`
LOG_TO_STDOUT: false
```

Run the app with
```bash
$ npm run build-headless
$ node ./dist/headless-bundle.js
```

##### Developing
Run the app in dev mode with
```bash
$ npm run dev
```

### Testing

Note: Currently access to remote databases is required to run local tests. These connections are not committed to git at the moment. Contact us if you require running tests locally.

```bash
$ npm run build
$ npm run test-unit-all
```

### Contact

- Alexandre - alexandres@plot.ly

### Credit

This app is built with Electron, React, Redux, and Sequelize.
Originally forked from [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate).

### License

Code released under the MIT © [License](https://github.com/plotly/plotly-sql-connector/blob/master/LICENSE)
