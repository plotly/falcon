The Dockerfile in this folder builds a Docker image that starts the hadoop components, impala daemons
and sets up a test database.

This Dockerfile uses
[codingtony/docker-impala](https://hub.docker.com/r/codingtony/impala/) as a base
image.

# Usage


## Build

Run the command below in the folder where the Dockerfile is located (This
command may take several minutes to complete):

```sh
docker build . -t falcon-impala

```


## Run

Run the command below inside a terminal, to start an instance listening on ports
25000 and 21000:

```sh
docker run -ti -p 25000:25000 -p 21000:21000 falcon-impala
```

Visit http://localhost:25000 to check the status of running impala daemons.
To stop the container, just press `CTRL-C`.
