The Dockerfile in this folder builds a Docker image that starts an instance of
Oracle Database 11g Express Edition with the logins `SYSTEM/oracle` and
`XDB/xdb`, and the sample database `consumption2010`.


# License

This Dockerfile uses
[wnameless/oracle-xe-11g](https://hub.docker.com/r/wnameless/oracle-xe-11g/) as
a base image.

Please, note that Oracle Database Express Edition is [licensed under the Oracle
Technology Network Developer License
Terms](http://www.oracle.com/technetwork/licenses/database-11g-express-license-459621.html).


# Usage


## Build

Run the command below in the folder where the Dockerfile is located:

```sh
docker build . -t falcon-test-oracle

```


## Run

Run the command below inside a terminal, to start an instance listening on port
1521:

```sh
docker run --rm -ti -p 1521:1521 falcon-test-oracle
```

To stop the container, just press `CTRL-C`.
