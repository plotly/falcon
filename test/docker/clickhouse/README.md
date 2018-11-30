The Dockerfile in this folder builds a Docker image that starts a ClickHouse server daemon and sets up a test database.

# License

This Dockerfile uses [yandex/clickhouse-server](https://hub.docker.com/r/yandex/clickhouse-server/) as a base image.

Please note that Yandex ClickHouse is licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0) and you may not use this except in compliance with the License.

# Usage

## Build

Run the command below in the folder where the Dockerfile is located:

```sh
docker build . -t falcon-clickhouse
```

## Run

Run the command below inside a terminal, to start an instance listening on ports 8123 and 9000:

```sh
docker run -ti -p 8123:8123 -p 9000:9000 falcon-clickhouse
```

To stop the container, just press `CTRL-C`.