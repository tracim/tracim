#!/usr/bin/env sh

stop_and_remove_container() {
    container_name="$1"
    docker container stop "$container_name"
    docker container rm "$container_name"
}
stop_and_remove_container tracim.test
stop_and_remove_container elasticsearch.test
stop_and_remove_container collabora.test
