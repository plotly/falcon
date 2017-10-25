
The Dockerfile in this folder builds a Docker image that starts the hadoop components, spark daemons, sets up a test database and runs apache-livy server.

This Dockerfile uses
[sequenceiq/hadoop-ubuntu](https://hub.docker.com/r/sequenceiq/hadoop-ubuntu/) as a base
image.

## Build

Run the command below in the folder where the Dockerfile is located (This
command may take several minutes to complete):

```sh
docker build . -t falcon-spark

```


## Run

Run the command below inside a terminal, to start an instance listening on port 8998:

```sh
docker run -ti -p 8998:8998 falcon-spark
```

Visit http://localhost:8998 to check the status of running livy server and information about running sessions.
To stop the container, just press `CTRL-C`.
