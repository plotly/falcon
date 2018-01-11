FROM sequenceiq/hadoop-ubuntu:2.6.0

# Get latest java:
COPY bin/setup_java.sh /setup_java.sh
RUN chmod +x /setup_java.sh;
RUN /setup_java.sh;
ENV JAVA_HOME=/usr/lib/jvm/java-8-oracle/jre

# Get hive:
ARG HIVE_VERSION=2.2.0
RUN wget http://www-eu.apache.org/dist/hive/hive-$HIVE_VERSION/apache-hive-$HIVE_VERSION-bin.tar.gz && \
tar -xzvf apache-hive-$HIVE_VERSION-bin.tar.gz && \
mv apache-hive-$HIVE_VERSION-bin hive;

ENV HIVE_HOME=/hive \
    PATH=/hive/bin:$PATH \
    HIVE_CONF_DIR=/hive/conf/

COPY conf/* $HIVE_CONF_DIR
COPY conf/my.cnf /etc/

# Install mysql as hive metastore
COPY setup_mysql.sh /setup_mysql.sh
RUN chmod +x /setup_mysql.sh;
RUN /setup_mysql.sh;
# RUN /hive/bin/schematool -dbType mysql -initSchema -verbose;

# Install spark
RUN curl -s http://apache.stu.edu.tw/spark/spark-2.2.0/spark-2.2.0-bin-hadoop2.6.tgz >| spark-2.2.0.tgz
RUN tar -xvf  spark-2.2.0.tgz -C /usr/local/ && cd /usr/local && ln -s spark-2.2.0-bin-hadoop2.6 spark

ENV SPARK_JAR=hdfs:///spark/spark-assembly-2.2.0-hadoop2.6.0.jar \
    SPARK_HOME=/usr/local/spark \
    SPARK_HIVE=true \
    PATH=$PATH:/usr/local/spark/bin \
    PYTHONPATH=/usr/local/spark/python/:$PYTHONPATH \
    PYTHONPATH=/usr/local/spark/python/lib/py4j-0.8.2.1-src.zip:$PYTHONPATH

RUN cp -r $HIVE_HOME/lib/mysql.jar $SPARK_HOME/jars/
COPY conf/* $SPARK_HOME/conf/
COPY bin/* /bin/

# Setup Livy
RUN chmod +x /bin/setup_livy.sh;
RUN /bin/setup_livy.sh;
COPY conf/livy.conf /livy/conf/

# Workaround for mysql
RUN echo "skip-grant-tables" | tee -a /etc/my.cnf && service mysql restart; exit 0;

EXPOSE 8998

ENTRYPOINT /etc/bootstrap.sh && service mysql start && chmod +x /bin/setup_database.sh && sync && /bin/setup_database.sh && /livy/bin/livy-server;
