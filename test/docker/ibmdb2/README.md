The Dockerfile in this folder builds a Docker image that starts an instance of
IBM DB2 Express-C with an admin user (db2inst1), a SELECT-only user (db2user1),
and a database (sample).


# License

This Dockerfile uses
[ibmcom/db2express-c](https://hub.docker.com/r/ibmcom/db2express-c/) as a base
image.

Please, note that IBM DB2 Express-C is [licensed under the IBM International
License Agreement for Non-Warranted
Programs](http://www-03.ibm.com/software/sla/sladb.nsf/displaylis/5DF1EE126832D3F185257DAB0064BEFA?OpenDocument),
which does not permit further distribution. And therefore, it does not permit
the distribution of images built using this Dockerfile.


# Usage


## Build

Run the command below in the folder where the Dockerfile is located (This
command may take several minutes to complete):

```sh
docker build . -t pdc-db2 --build-arg LICENSE=accept --build-arg DB2INST1_PASSWORD=<password for user db2inst1> --build-arg DB2USER1_PASSWORD=<password for user db2user1> --no-cache

```

Note that to run the command above is necessary to:

- accept [the IBM International License Agreement for Non-Warranted
  Programs](http://www-03.ibm.com/software/sla/sladb.nsf/displaylis/5DF1EE126832D3F185257DAB0064BEFA?OpenDocument)
  by setting `LICENSE` to `accept`.

- set the admin's password by setting `DB2INST1_PASSWORD`

- set the SELECT-only user's password by setting `DB2USER_PASSWORD`



## Run

Run the command below inside a terminal, to start an instance listening on port
50000:

```sh
docker run -ti -p 50000:50000 pdc-db2
```

To stop the container, just press `CTRL-C`.
