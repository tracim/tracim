#!/bin/sh
teardown () {
    if [ -n "$ZURL_PID" ]; then kill "$ZURL_PID"; fi
}

mkdir -p /var/run/zurl
trap teardown HUP INT TERM
zurl --config=/etc/zurl.conf &
ZURL_PID=$!
pushpin --merge-output
