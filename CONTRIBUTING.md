# Contribute

Note that this section targets contributors and those who wish to set up and run the server themselves.

If you're interested in using the distributed App, [download the latest release.](https://github.com/plotly/plotly-database-connector/releases)

## Install

Start by cloning the repo via git:

```bash
git clone https://github.com/plotly/electron-sql-connector your-project-name
```

And then install dependencies.

```bash
$ cd your-project-name && npm install
```

*Note: requires a node version >= 4 and an npm version >= 2.*

## Run as Electron App
Run the app with
```bash
$ npm run build
$ npm run start
```

## Run as a Server

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

The database connector runs as a server by default as part of [Plotly On-Premise](https://plot.ly/products/on-premise). On Plotly On-Premise, every user who has access to the on-premise server also has access to the database connector, no extra installation or SSL configuration is necessary. If you would like to try out Plotly On-Premise at your company, please [get in touch with our team](https://plotly.typeform.com/to/seG7Vb), we'd love to help you out.

## Run as a docker image

See the [Dockerfile](https://github.com/plotly/plotly-database-connector/blob/master/Dockerfile) for more information.

## Developing

Run the electron app in dev mode with
```bash
$ npm run dev
```

Run watchers for the electron main process and web bundle.
```bash
$ npm run watch-main
```

```bash
$ npm run watch-web
```


Or, develop using the headless server by running watchers on headless and web bundles
```bash
$ npm run watch-headless
```

```bash
$ npm run watch-web
```

as well as hot-relaoding the updated server side bundle with nodemon
(`npm install -g nodemon` if you do not have it already)
```bash
$ nodemon ./dist/headless-bundle.js
```

## Testing

There are unit tests for the nodejs backend and integration tests to test the flow of the app.

Run unit tests:
```bash
$ npm run build
$ npm run test-unit-all
```

Run integration tests:
```bash
$ npm run build
$ npm run test-e2e
```

## Builds and Releases

- Linux builds are created at the end of CircleCI tests
- Windows 32bit and 64bit builds are created in AppVeyoer tests
- Mac builds are created on an available mac laptop

Releases are uploaded to https://github.com/plotly/plotly-database-connector/releases
