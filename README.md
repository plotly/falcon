# Plotly Database Connector

The Plotly database connector is a cross-platform desktop application that connects [Plotly 2.0](https://plot.ly/alpha/workspace) to your database.

![](http://g.recordit.co/NHyqNZEj2i.gif)
![](http://g.recordit.co/BAyBgt0iRb.gif)

Plotly 2.0 makes HTTP requests from the local web browser directly to this database connector app. This database connector runs as a server on localhost and forwards queries from the Plotly 2.0 web-application to the database that connect to. Requests are made client-side, so you don't need to open up the connector or your database to the world, you just need to be able to access it from the machine that is running this connector app.

[Learn more in our online documentation](http://help.plot.ly/database-connectors/) or just give it a try in [Plotly 2.0](https://plot.ly/alpha/workspace).


#### Contact
- Chris - chris@plot.ly
- Alexandre - alexandres@plot.ly

## Development

This app is built with Electron, React, Redux, and Sequelize.

Originally forked from [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate).


#### Installation for Development

These instructions are for developing the code. If you're interested in just running and using the App, [download the latest release.](https://github.com/plotly/plotly-database-connector/releases)


For development, start by cloning the repo via git:

```bash
git clone https://github.com/plotly/electron-sql-connector your-project-name
```

And then install dependencies.

```bash
$ cd your-project-name && npm install
```

Run the app with
```bash
$ npm run dev
```

*Note: requires a node version >= 4 and an npm version >= 2.*

### Testing

Note: Currently access to remote databases is required to run local tests. These connections are not committed to git at the moment. Contact us if you require running tests locally.

```bash
$ npm run build
$ npm run local-test-e2e
```

## License
Code released under the MIT © [License](https://github.com/plotly/plotly-sql-connector/blob/master/LICENSE)
