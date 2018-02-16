FROM docker.elastic.co/elasticsearch/elasticsearch:5.6.7

USER elasticsearch

COPY setup-v5.bash .
COPY test-types.elastic-2.4-types.ndjson .
COPY sample-data.test-type.ndjson .

RUN elasticsearch -d -Ediscovery.type=single-node -Expack.security.enabled=false && bash setup-v5.bash
