#!/bin/bash

script_dir=$(dirname $0)
backend_pid=""

if [ "$1" == "cypress" ] && [ "z$2" == "z" ]; then
    echo "Usage: $0 cypress (open|run)"
    exit 1
fi

teardown () {
    kill $backend_pid
}

pushd $script_dir/backend
if [ "z$VIRTUAL_ENV" = "z" ] && [ "z$NO_VIRTUAL_ENV" = "z" ]; then
    . ./env/bin/activate
fi

docker-compose up -d pushpin
if [ "$1" = "cypress" ]; then
    export TRACIM_SQLALCHEMY__URL="sqlite:////tmp/tracim_cypress.sqlite"
    tracimcli db delete --force
    tracimcli db init
    cp /tmp/tracim_cypress.sqlite /tmp/tracim_cypress.sqlite.tmp
    pserve development.ini > /tmp/tracim_cypress.log 2>&1 &
    backend_pid=$!
    trap teardown HUP INT TERM
    popd
    pushd $script_dir/functionnal_tests
    yarn run cypress-$2
    teardown
else
    tracimcli db init
    pserve development.ini
fi
