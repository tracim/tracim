# ElasticSearch image with Ingest Plugin Enabled

This is a ElasticSearch docker image build to run properly with _Tracim_.

## Build Image

    docker build -t elasticsearch-ingest .

## Run Image

    docker run -d -p 9200:9200 -p 9300:9300 -v esdata:/usr/share/elasticsearch -v esconfig:/usr/share/elasticsearch/config -e "discovery.type=single-node" -e "cluster.routing.allocation.disk.threshold_enabled=false" elasticsearch-ingest
