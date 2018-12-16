FROM codingtony/impala

# Copy test-db scripts:
COPY bin/* /bin/
RUN chmod +x /bin/setup_database.sh;
RUN chmod +x /bin/setup_test_db.sql;

EXPOSE 9000 50010 50020 50070 50075 21000 21050 25000 25010 25020

CMD /start.sh && /bin/setup_database.sh;
