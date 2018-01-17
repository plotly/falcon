# Contribute

Note that this section targets contributors and those who wish to set up and run the server themselves.

If you're interested in using the distributed App, [download the latest release.](https://github.com/plotly/falcon-sql-client/releases)

## Prerequisites
It is recommended to use node v6.12 with the latest electron-builder

## Install

Start by cloning the repo via git:

```bash
git clone https://github.com/plotly/falcon-sql-client falcon-sql-client
```

And then install dependencies with **yarn**.

```bash
$ cd falcon-sql-client
$ yarn install
$ yarn run rebuild:modules:electron
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
$ yarn install
$ yarn run heroku-postbuild
$ yarn run start-headless
```

Build (after it was already built for electron desktop) and run the app:
```bash
$ yarn run rebuild:modules:node
$ yarn run heroku-postbuild
$ yarn run start-headless
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

Build and run the docker image:
```
$ yarn run docker:falcon:build
$ PLOTLY_CONNECTOR_AUTH_ENABLED=false yarn run docker:falcon:start
```

The web app will be accessible in your browser at `http://localhost:9494`.

See the [Dockerfile](https://github.com/plotly/falcon-sql-client/blob/master/Dockerfile) for more information.

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

Then, view the the app in the electron window with:

```bash
$ yarn run dev
```

If you need to fully start over and rebuild the electron app, try:
```
$ yarn install
$ yarn run rebuild:modules:electron
$ rm -rf dist
$ yarn run build
$ yarn start
```

and in your web browser by visiting http://localhost:9494

## Testing

There are unit tests for the nodejs backend and integration tests to test the flow of the app.

Run unit tests:
```bash
$ yarn run test-unit-all
```

Run integration tests:
```bash
$ yarn run test-e2e
```

## Builds and Releases

- Update package.json with the new semver version
- Linux builds are created in [CircleCI tests](https://circleci.com/gh/plotly/falcon-sql-client/tree/master) under the latest master build -> Artifacts -> release.zip
- Windows 64bit builds are created in [AppVeyor tests](https://ci.appveyor.com/project/AppVeyorDashAdmin/falcon-sql-client)  under Latest Build -> Artifacts -> release.zip
- Mac builds are created in TravisCI tests and automatically hosted on [amazon](https://s3.console.aws.amazon.com/s3/buckets/falcon-travis-artifacts/plotly/falcon-sql-client/?region=us-east-1&tab=overview). Select the latest build (largest number *note:* the folders are not necessarily sequential) -> release.zip

Builds are uploaded to https://github.com/plotly/falcon-sql-client/releases.

## Troubleshooting
The Falcon Configuration information is installed in the user's home directory.
For example Unix and Mac (~/.plotly/connector) and for Windows (%userprofile%\.plotly\connector\).  If you have tried the install
process and the app is still not running, this may be related to some corrupted 
configuration files.  You can try removing the existing configuration files and then 
restarting the build process

```bash
rm -rf ~/.plotly/connector/
```