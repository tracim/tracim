# OpenSearch image with Ingest Plugin Enabled

This is a OpenSearch docker image build to run properly with _Tracim_.

## Build Image

The Dockerfile is in [/tools_docker/opensearch_ingest/](/tools_docker/opensearch_ingest/)

    docker build -t opensearch-ingest .

## Run Image

    docker run -d -p 9201:9201 -p 9301:9301 -v esdata:/usr/share/opensearch -v esconfig:/usr/share/opensearch/config -e "discovery.type=single-node" -e "cluster.routing.allocation.disk.threshold_enabled=false" opensearch-ingest
