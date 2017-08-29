FROM sequenceiq/spark:1.6.0

COPY "create_hive_tables.py" "/create_hive_tables.py"
COPY "livy_python_requirements.txt" "/requirements.txt"

COPY "setup_database.sh" "/setup_database.sh"
COPY "setup_livy.sh" "/setup_livy.sh"

# Setup sample database
RUN chmod +x /create_hive_tables.py
RUN chmod +x /setup_database.sh
RUN chmod +x /setup_livy.sh

RUN /setup_database.sh; exit 0
RUN /setup_livy.sh; exit 0

EXPOSE 8998
