# Contribute

Note that this section targets contributors and those who wish to set up and run the server themselves.

If you're interested in using the distributed App, [download the latest release.](https://github.com/plotly/plotly-database-connector/releases)

## Install

Start by cloning the repo via git:

```bash
git clone https://github.com/plotly/plotly-database-connector plotly-database-connector
```

And then install dependencies with **yarn**.

```bash
$ cd plotly-database-connector && yarn install
```

*Note: See package.json for the version of node that is required*

## Run as an Electron App
Run the app with
```bash
$ yarn run build
$ yarn run start
```

## Run as a Server

Build and run the app:
```bash
$ yarn run build-headless
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

Run watchers for the electron main process, the web bundle (the front-end), and the headless-bundle:
```bash
$ yarn run watch-main
```

```bash
$ yarn run watch-web
```

```bash
$ yarn run watch-headless
```

Then, view the the app in the electron window with

```bash
$ yarn run dev
```

and in your web browser by visiting http://localhost:9494

## Testing

There are unit tests for the nodejs backend and integration tests to test the flow of the app.

Run unit tests:
```bash
$ yarn run build
$ yarn run test-unit-all
```

Run integration tests:
```bash
$ yarn run build
$ yarn run test-e2e
```

## Builds and Releases

- Update package.json with the new semver version
- Linux builds are created at the end of CircleCI tests (under Artifacts)
- Windows 32bit and 64bit builds are created in AppVeyor tests (under Artifacts)
- Mac builds are created on any available Mac laptop - run `yarn run package` and zip the resulting build

Releases are uploaded to https://github.com/plotly/plotly-database-connector/releases
