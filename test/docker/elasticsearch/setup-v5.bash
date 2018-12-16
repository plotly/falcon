#!/usr/bin/env sh

until $(curl --output /dev/null --silent --head --fail http://localhost:9200); do
  echo -e -n '.'
  sleep 2.5
done

#CURL_FLAGS="--output /dev/null --silent --head --fail -S"

echo -e "\n\nCreate index test-types"
curl $CURL_FLAGS -XPUT localhost:9200/test-types -H 'Content-Type: application/json' -d '{
  "mappings" : {
    "elastic-2.4-types" : {
      "properties" : {
        "boolean" : {
          "type" : "boolean"
        },
        "date" : {
          "type" : "date",
          "format" : "strict_date_optional_time||epoch_millis"
        },
        "double" : {
          "type" : "double"
        },
        "geo_point-1" : {
          "type" : "geo_point"
        },
        "geo_point-2" : {
          "type" : "geo_point"
        },
        "geo_point-3" : {
          "type" : "geo_point"
        },
        "integer" : {
          "type" : "integer"
        },
        "ip" : {
          "type" : "ip"
        },
        "string-1" : {
          "type" : "string"
        },
        "string-2" : {
          "type" : "string"
        },
        "token" : {
          "type" : "token_count",
          "analyzer" : "standard"
        }
      }
    }
  }
}'


echo -e "\n\nCreate index plotly_datasets"
curl $CURL_FLAGS -XPUT localhost:9200/plotly_datasets -H 'Content-Type: application/json' -d '{
  "mappings" : {
    "ebola_2014" : {
      "properties" : {
        "Country" : {
          "type" : "string"
        },
        "Lat" : {
          "type" : "float"
        },
        "Lon" : {
          "type" : "float"
        },
        "Month" : {
          "type" : "integer"
        },
        "Value" : {
          "type" : "float"
        },
        "Year" : {
          "type" : "integer"
        },
        "index" : {
          "type" : "integer"
        }
      }
    },
    "consumer_complaints" : {
      "properties" : {
        "Company" : {
          "type" : "string"
        },
        "Company response" : {
          "type" : "string"
        },
        "Complaint ID" : {
          "type" : "integer"
        },
        "Consumer disputed?" : {
          "type" : "string"
        },
        "Date received" : {
          "type" : "date",
          "format" : "strict_date_optional_time"
        },
        "Date sent to company" : {
          "type" : "date",
          "format" : "strict_date_optional_time"
        },
        "Issue" : {
          "type" : "string"
        },
        "Product" : {
          "type" : "string"
        },
        "State" : {
          "type" : "string"
        },
        "Sub-issue" : {
          "type" : "string"
        },
        "Sub-product" : {
          "type" : "string"
        },
        "Timely response?" : {
          "type" : "string"
        },
        "ZIP code" : {
          "type" : "integer"
        }
      }
    }
  }
}'


echo -e "\n\nCreate index live-data"
curl $CURL_FLAGS -XPUT localhost:9200/live-data -H 'Content-Type: application/json' -d '{
  "mappings" : {
    "test-type" : {
      "properties" : {
        "boolean" : {
          "type" : "boolean"
        },
        "date" : {
          "type" : "date",
          "format" : "strict_date_optional_time||epoch_millis"
        },
        "double" : {
          "type" : "double"
        },
        "geo_point-1" : {
          "type" : "geo_point"
        },
        "geo_point-2" : {
          "type" : "geo_point"
        },
        "geo_point-3" : {
          "type" : "geo_point"
        },
        "integer" : {
          "type" : "integer"
        },
        "ip" : {
          "type" : "ip"
        },
        "string-1" : {
          "type" : "string"
        },
        "string-2" : {
          "type" : "string"
        },
        "token" : {
          "type" : "token_count",
          "analyzer" : "standard"
        }
      }
    }
  }
}'

echo -e "\n\nCreate index sample-data"
curl $CURL_FLAGS -XPUT localhost:9200/sample-data -H 'Content-Type: application/json' -d '{
  "mappings" : {
    "test-scroll" : {
      "properties" : {
        "fifth" : {
          "type" : "float"
        },
        "first" : {
          "type" : "float"
        },
        "fourth" : {
          "type" : "float"
        },
        "second" : {
          "type" : "float"
        },
        "third" : {
          "type" : "float"
        }
      }
    },
    "test-type" : {
      "properties" : {
        "my-boolean-1" : {
          "type" : "boolean"
        },
        "my-boolean-2" : {
          "type" : "boolean"
        },
        "my-date-1" : {
          "type" : "date",
          "format" : "strict_date_optional_time||epoch_millis"
        },
        "my-date-2" : {
          "type" : "date",
          "format" : "strict_date_optional_time||epoch_millis"
        },
        "my-geo-point-1" : {
          "type" : "geo_point"
        },
        "my-geo-point-2" : {
          "type" : "geo_point"
        },
        "my-number-1" : {
          "type" : "long"
        },
        "my-number-2" : {
          "type" : "long"
        },
        "my-string-1" : {
          "type" : "string"
        },
        "my-string-2" : {
          "type" : "string"
        }
      }
    },
    "test-ranges" : {
      "properties" : {
        "Date" : {
          "type" : "date",
          "format" : "strict_date_optional_time||epoch_millis"
        },
        "Float" : {
          "type" : "float"
        },
        "Integer" : {
          "type" : "integer"
        },
        "Ipv4" : {
          "type" : "ip"
        },
        "String" : {
          "type" : "string"
        }
      }
    }
  }
}'

echo -e "\n\nCreate index test-scroll"
curl $CURL_FLAGS -XPUT localhost:9200/test-scroll -H 'Content-Type: application/json' -d '{
  "settings": {
    "index": {
      "max_result_window": 200001
    }
  },
  "mappings" : {
    "200k" : {
      "properties" : {
        "Column 1" : {
          "type" : "double"
        },
        "Column 2" : {
          "type" : "double"
        },
        "Column 3" : {
          "type" : "double"
        },
        "Column 4" : {
          "type" : "double"
        }
      }
    }
  }
}'

echo -e "\n\nIndex documents into test-types/elastic-2.4-types"
curl $CURL_FLAGS -XPOST -H 'Content-Type: application/json' localhost:9200/_bulk --data-binary "@test-types.elastic-2.4-types.ndjson"

echo -e "\n\nIndex documents into sample-data/test-type"
curl $CURL_FLAGS -XPOST -H 'Content-Type: application/json' localhost:9200/_bulk --data-binary "@sample-data.test-type.ndjson"

echo -e "\n\nIndex documents into test-scroll/200k"
TARGET=test-scroll.200k.ndjson
rm -f $TARGET
for i in $(seq 1 200000)
do
  echo {\"index\":{\"_id\":\"$i\"}} >> $TARGET
  echo {\"Column 4\":$i.4,\"Column 2\":$i.2,\"Column 3\":$i.3,\"Column 1\":$i.1} >> $TARGET
done
CURL_FLAGS="--output /dev/null --silent --fail -S"
curl $CURL_FLAGS -XPOST -H 'Content-Type: application/json' localhost:9200/test-scroll/200k/_bulk --data-binary "@$TARGET"
rm -f $TARGET


function getTestScrollCount {
  curl --silent http://localhost:9200/_cat/indices |  awk '/test-scroll/{print $7}'
}

until [[ $(getTestScrollCount) == 200000 ]] ; do
  echo -e -n '.'
  sleep 2.5
done

