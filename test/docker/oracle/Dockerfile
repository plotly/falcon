FROM wnameless/oracle-xe-11g:16.04

EXPOSE 1521

ADD https://raw.githubusercontent.com/plotly/datasets/master/2010_alcohol_consumption_by_country.csv /2010_alcohol_consumption_by_country.csv
COPY setup.sql /
COPY setup.ctl /
COPY setup.sh /docker-entrypoint-initdb.d/

ENV ORACLE_ENABLE_XDB true
