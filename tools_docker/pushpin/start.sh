#!/bin/sh
teardown () {
    if [ -n "$ZURL_PID" ]; then kill "$ZURL_PID"; fi
    if [ -n "$PUSHPIN_PID" ]; then kill "$PUSHPIN_PID"; fi
    exit 0
}

# Starting zurl separately to use /etc/zurl.conf instead of /var/run/pushpin/zurl.conf
# So that zurl shares the same parameters with mongrel2.
mkdir -p /var/run/zurl
trap teardown HUP INT TERM
zurl --config=/etc/zurl.conf &
ZURL_PID=$!
pushpin --merge-output &
PUSHPIN_PID=$!
wait
