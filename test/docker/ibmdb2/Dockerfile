FROM ibmcom/db2express-c:latest

ARG DB2USER1_PASSWORD
ARG DB2INST1_PASSWORD
ARG LICENSE

COPY "build.sh" "/build.sh"

RUN curl https://raw.githubusercontent.com/plotly/datasets/master/2010_alcohol_consumption_by_country.csv -o /2010_alcohol_consumption_by_country.csv

# Install DB2 Express-C
RUN /entrypoint.sh "true"

# Setup sample database
RUN /build.sh

# Start database instance
ENTRYPOINT su - db2inst1 -c db2start && (while true; do sleep 1000; done)

EXPOSE 50000
