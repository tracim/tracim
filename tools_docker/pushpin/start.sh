#!/bin/sh
trap 'kill $PUSHPIN_PID; exit 0' HUP INT TERM
pushpin --merge-output &
PUSHPIN_PID=$!
wait
