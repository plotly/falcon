Test databases
--------------

This directory contains DockerFiles and deployment configurations for creating the test instances of following databases:

  * Apache Impala
  * Apache Spark
  * IBM DB2



Commands
========

To Create GKE Cluster:

```sh
gcloud container clusters create falcon-test-dbs  --zone us-central1-b --machine-type n1-standard-2 --num-nodes 3 --enable-autoupgrade
```

To create deployments for test databases:

```sh
kubectl apply -f deployment/
```
