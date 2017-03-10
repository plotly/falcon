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

##### Run on a Server

Build and run the app:
```bash
$ npm run build-headless
$ node ./dist/headless-bundle.js
```

Visit the app in your web browser at `http://localhost:9494`.

Note that the API requests to the connector are not authenticated. Only run the app as a server on trusted networks, do not run the app on public networks.

By default, the connector app will connect to Plotly Cloud. If you would like to connect the app to your private [Plotly On-Premise](https://plot.ly/products/on-premise) server, then modify the app's settings in `~/.plotly/connector/settings.yaml` with:

```
PLOTLY_API_DOMAIN: 'plotly.your-company.com'
CORS_ALLOWED_ORIGINS: 
    - 'https://plotly.your-company.com'
```

If you have issued an SSL certificate for your app, modify your `settings.yaml` file to include the location of the cert and its key:
```
KEY_FILE: '/ssl/certs/server/privkey.pem'
CSR_FILE: '/ssl/certs/server/fullchain.pem'
```

The database connector runs as a server by default as part of [Plotly On-Premise](https://plot.ly/products/on-premise). On Plotly On-Premise, every user who has access to the on-premise server also has access to the database connector, no extra installation or SSL configuration is necessary. If you would like to try out Plotly On-Premise at your company, please [get in touch with our team](https://plotly.typeform.com/to/seG7Vb), we'd love to help you out.

##### Run as a docker image

See the [Dockerfile](https://github.com/plotly/plotly-database-connector/blob/master/Dockerfile) for more information.

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
