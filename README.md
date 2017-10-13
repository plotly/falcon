# Falcon SQL Client
<p align="center">
<img src="https://raw.githubusercontent.com/plotly/falcon-sql-client/master/app/app.ico">
</p>

> Plotly Database Connector for https://plot.ly/create. Connect your database and query your data to use in your charts.

The Falcon SQL Client is a cross-platform desktop application that connects the [Plotly 2.0 Visualization Platform](https://plot.ly/create) to your database.

![Screencast of the falcon sql client](http://g.recordit.co/LqhQcEcwti.gif)

Plotly 2.0 makes HTTP requests from the local web browser directly to the Falcon app. This database connector runs as a server on localhost and forwards queries from the Plotly 2.0 web-application to the database that connect to. Requests are made client-side, so you don't need to open up the connector or your database to the world, you just need to be able to access it from the machine that is running this connector app.

[Learn more in our online documentation](http://help.plot.ly/database-connectors/) or just give it a try in [Plotly 2.0](https://plot.ly/create/?upload=sql).

## Feature Requests

[Contact us](https://plot.ly/products/consulting-and-oem/) for feature additions, support, training, consulting, and more.

## Contribute

See [CONTRIBUTING.md](https://github.com/plotly/falcon-sql-client/blob/master/CONTRIBUTING.md).
You can also [contact us](https://plot.ly/products/consulting-and-oem/) if you would like a specific feature added.

We want to encourage a warm, welcoming, and safe environment for contributing to this project. See the [code of conduct](CODE_OF_CONDUCT.md) for more information.

## Contact

- Maintainer: Chris - chris@plot.ly
- Feature requests and consulting: https://plot.ly/products/consulting-and-oem/
- Security reports: https://help.plot.ly/security/

## Credit

This app is built with Electron, React, Redux, and Sequelize.
Originally forked from [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate).

## License

Code released under the MIT © [License](https://github.com/plotly/falcon-sql-client/blob/master/LICENSE).
