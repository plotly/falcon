# Contribute

Note that this section targets contributors and those who wish to set up and run the server themselves.

If you're interested in using the distributed App, [download the latest release.](https://github.com/plotly/falcon-sql-client/releases)


## Prerequisites

Falcon development requires node v8 and yarn v1. Some connectors (e.g. the
Oracle connector) have additional requirements (see further below the section on
testing).


## Install

```sh
$ git clone https://github.com/plotly/falcon-sql-client falcon-sql-client
$ cd falcon-sql-client
$ yarn install
```


## Build and Run the Electron App

First, build the native dependencies against Electron:
```sh
$ yarn run rebuild:modules:electron
```

Then:

```sh
$ yarn run build
$ yarn run start
```


## Build and Run the Web App

If, last time, Falcon was built as an Electron app, then the native modules need
rebuilding against Node:
```sh
$ yarn run rebuild:modules:node
```

To build and run the web app:
```sh
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


## Run as a Docker Container

Build and run the docker image:
```
$ yarn run docker:falcon:build
$ PLOTLY_CONNECTOR_AUTH_ENABLED=false yarn run docker:falcon:start
```

The web app will be accessible in your browser at `http://localhost:9494`.

See the [Dockerfile](https://github.com/plotly/falcon-sql-client/blob/master/Dockerfile) for more information.


## Developing

*([TODO] This section needs updating)*

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

Then, view the app in the electron window with:

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

Falcon is tested in three ways:

- backend tests: stored under `test/backend` and run by `yarn run test-unit-all`
- frontend tests: stored under `test/app` and run by `yarn run test-jest`
- integration tests: stored in `test/integration_test.js` and run by `yarn run test-e2e`

In some cases, we also provide `Dockerfile`s to build containers with a sample
database for testing. These can be found under `test/docker`.


### IBM DB2 Test Database

In folder `test/docker/ibmdb2`, we provide a `Dockerfile` to setup an IBM DB2
Express database for testing.

To build the docker image, run `yarn run docker:db2:build`.

And to start the docker container, run `yarn run docker:db2:start`.

More details can be found in `test/docker/ibmdb2/README.md`.


### Oracle Test Database

In folder `test/docker/oracle`, we provide a `Dockerfile` to setup an Oracle
Express database for testing.

To build the docker image, run `yarn run docker:oracle:build`.

And to start the docker container, run `yarn run docker:oracle:start`.

More details can be found in `test/docker/oracle/README.md`.


#### Installation of Oracle Client Libraries

Unlike IBM DB2's case and as of this writing, the Oracle bindings for Node.js,
[oracledb](https://www.npmjs.com/package/oracledb), are incomplete and users are
required to create an account on
[Oracle](https://login.oracle.com/mysso/signon.jsp) before downloading the
missing Oracle Client libraries.

The installation procedure is very well documented
[here](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md#instructions).

The procedure for Ubuntu:

1. Install requirements: `sudo apt-get -qq update && sudo apt-get --no-install-recommends -qq install alien bc libaio1`
2. Create an account on [Oracle](https://login.oracle.com/mysso/signon.jsp)
3. Download the Oracle Instant Client from [here](http://download.oracle.com/otn/linux/oracle11g/xe/oracle-xe-11.2.0-1.0.x86_64.rpm.zip)
4. Unzip `rpm` package: `unzip oracle-xe-11.2.0-1.0.x86_64.rpm.zip`
5. Convert `rpm` package into `deb`: `alien oracle-xe-11.2.0-1.0.x86_64.rpm`
6. Install `deb` package: `sudo dpkg -i oracle-instantclient12.2-basiclite_12.2.0.1.0-2_amd64.deb`


#### Running the Unit Tests for Oracle Connector

First, open a terminal and start the container that runs test Oracle database:
```sh
$ yarn run docker:oracle:start
```
and wait until the message `Ready` is shown.

Then, open another terminal and run:
```sh
$ export LD_LIBRARY_PATH=/usr/lib/oracle/12.2/client64/lib:$LD_LIBRARY_PATH
$ yarn run test-unit-oracle
```


## Builds and Releases

- Update package.json with the new semver version
- Linux builds are created in [CircleCI tests](https://circleci.com/gh/plotly/falcon-sql-client/tree/master) under the latest master build -> Artifacts -> release.zip
- Windows 64bit builds are created in [AppVeyor tests](https://ci.appveyor.com/project/AppVeyorDashAdmin/falcon-sql-client)  under Latest Build -> Artifacts -> release.zip
- Mac builds are created in TravisCI tests and automatically hosted on [amazon](https://s3.console.aws.amazon.com/s3/buckets/falcon-travis-artifacts/plotly/falcon-sql-client/?region=us-east-1&tab=overview). Select the latest build (largest number *note:* the folders are not necessarily sequential) -> release.zip

Builds are uploaded to https://github.com/plotly/falcon-sql-client/releases.


## Troubleshooting

Falcon keeps stores its configuration and logs in a folder under the user's home
directory:
- `%USERPROFILE%\.plotly\connector` (in Windows)
- `~/.plotly/connector` (in Mac and Linux)

While developing a new connector, a common issue is that Falcon's configuration
gets corrupted. This often leads to a failure at start up. Until we address this
issue in more user-friendly manner (issue #342), the solution is to delete
Falcon's configuration folder.

In Windows:
```sh
rmdir /s %USERPROFILE%\.plotly\connector
```

In Mac and Linux:
```sh
rm -rf ~/.plotly/connector/
```
