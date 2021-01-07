#!/bin/bash
set -e

show_help () {
    cat <<EOF
Usage: $0 [--database=(sqlite|postgresql|mysql|mariadb)] dev|(cypress (open|run))
$0
    Run the Tracim backend for development purposes
$0 cypress open
    Run the Tracim backend for functional tests then launch Cypress in a GUI
$0 cypress run
    Run the Tracim backend for functional tests then launch the full Cypress test suite in the terminal
EOF
}

database_type="sqlite"
while :; do
    case $1 in
        -h|--help)
            show_help
            exit
            ;;
        -d=?*|--database=?*)
            # Delete everything up to "=" and assign the remainder.
            database_type=${1#*=}
            ;;
        -?*)
            echo "Unknown option $1"
            exit 1
            ;;
        *)
            break
            ;;
    esac
    shift
done

script_dir=$(realpath "$(dirname "$0")")
backend_pid=
cypress_arg="$2"
mode="$1"
export DATABASE_NAME="tracim"
database_dir="$script_dir/backend"
database_service=


if [ -z "$mode" ]; then
    mode="dev"
fi
if [ "$mode" != "cypress" ] && [ "$mode" != "dev" ]; then
   echo "Unknown mode '$mode' Possible modes are 'cypress' or 'dev'"
   exit 1
fi

if [ "$mode" = "cypress" ]; then
    if [ -z "$cypress_arg" ]; then
        echo "cypress mode needs an argument, ('open' or 'run')"
        exit 1
    fi
    if [ "$database_type" != "sqlite" ]; then
        echo "cypress mode only supports sqlite currently"
        exit 1
    fi
    # Run tracim with a specified sqlite database as cypress resets db using a file copy
    export DATABASE_NAME="tracim_cypress"
    database_dir="/tmp"
fi

echo "Database type: '$database_type'"
case "$database_type" in
    sqlite)
        export TRACIM_SQLALCHEMY__URL="$database_type:///$database_dir/${DATABASE_NAME}.sqlite"
        sleep=
        ;;
    postgresql)
        export TRACIM_SQLALCHEMY__URL="$database_type://user:secret@localhost:5432/${DATABASE_NAME}?client_encoding=utf8"
        database_service=$database_type
        sleep=2
        ;;
    mariadb)
        export TRACIM_SQLALCHEMY__URL="mysql+pymysql://user:secret@localhost:3307/${DATABASE_NAME}"
        database_service=$database_type
        sleep=2
        ;;
    mysql)
        export TRACIM_SQLALCHEMY__URL="mysql+pymysql://user:secret@localhost:3306/${DATABASE_NAME}"
        database_service=$database_type
        sleep=2
        ;;
    *)
        echo "Unknown database type $database_type"
        exit 1
        ;;
esac

teardown () {
    kill $backend_pid
}

pushd "$script_dir/backend"
# Use comparison with "-z" as we want to check empty strings
if [ -z "$VIRTUAL_ENV" ] && [ -z "$NO_VIRTUAL_ENV" ]; then
    . "$script_dir/backend/env/bin/activate"
fi

docker-compose up -d pushpin "$database_service"
if [ -n "$sleep" ]; then
    sleep $sleep
fi
if [ "$mode" = "cypress" ]; then
    tracimcli db delete --force || true
    tracimcli db init || true
    cp /tmp/${DATABASE_NAME}.sqlite /tmp/${DATABASE_NAME}.sqlite.tmp
    pserve development.ini > /tmp/${DATABASE_NAME}.log 2>&1 &
    backend_pid=$!
    trap teardown HUP INT TERM
    popd
    pushd "$script_dir/functionnal_tests"
    yarn run "cypress-$cypress_arg"
    teardown
else
    # NOTE: by default the mysql/mariadb do save their database in a tmpfs.
    # disabling this for manual tests/dev in order to retain the database between launches
    export TMPFS_DIR=/tmp
    tracimcli db init || true
    pserve development.ini
fi
