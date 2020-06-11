#!/bin/bash

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'yarn install'\n${BROWN}/!\ ${NC}"

BROWN='\033[0;33m'
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

if [ -z "${VERBOSE+x}" ]; then
    export VERBOSE=false
fi

if [ -z "${LINTING+x}" ]; then
    export LINTING=false
fi

dev=""
appdev=""
if [ "$1" = "-d" ]; then
    dev="-dev"
    appdev="-d"
fi

log() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

loggood() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

logerror() {
    echo -e "${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}

build_tracim_lib() {
    yarn workspace tracim_frontend_lib run build$dev && loggood "Built tracim_frontend_lib for unit tests" || logerror "Could not build tracim_frontend_lib"
}

build_frontend() {
    log "Building the frontend"
    yarn workspace tracim run buildwithextvendors$dev || logerror "Could not build the frontend"
}

parallel_build_lib() {
    log "Building tracim_frontend_lib for unit tests"
    if [ "$PARALLEL_BUILD" = 1 ]; then
        build_tracim_lib
    else
        run_with_lock build_tracim_lib
    fi
}

wait_for_lib_build_to_end() {
    if [ "$PARALLEL_BUILD" != 1 ]; then
        # We need to wait for the build of tracim_frontend_lib for unit tests to finish
        wait_build
    fi
}

build_vendors() {
    # Tracim vendors
    log "Building tracim_frontend_vendors"
    frontend_vendors/build_vendors.sh && loggood "Built tracim_frontend_vendors successfully" || logerror "Could not build tracim_frontend_vendors"
    # RJ - 2020-06-11 - we do not build the vendors in development mode by default
    # even if -d was passed to this script, since it produce a huge file that is slow to load in the browser.
    # If you ever need to debug something in the vendors, go to the frontend_vendors directory and run ./build_vendors.sh -d
}

build_lib_using_externals() {
    # Tracim Lib for the browsers
    log "Building tracim_frontend_lib for Tracim"
    yarn workspace tracim_frontend_lib run buildwithextvendors$dev && loggood "Built tracim_frontend_lib for Tracim successfully" || logerror "Failed to build tracim_frontend_lib for Tracim"
}

build_app() {
    "$1"/build_*.sh $appdev || logerror "Failed building $1."
}

build_app_with_success() {
    build_app "$1" && loggood "Built $1 successfully"
}

##### Functions to manage parallel builds. #####

init_parallel() {
    if [ -z "${PARALLEL_BUILD+x}" ]; then
        # See https://stackoverflow.com/questions/6481005/how-to-obtain-the-number-of-cpus-cores-in-linux-from-the-command-line
        PARALLEL_BUILD="$(which nproc > /dev/null && nproc --all || echo 1)"
        open_sem "$PARALLEL_BUILD"
    elif [ "${PARALLEL_BUILD}" = "false" ] || [ "${PARALLEL_BUILD}" = "0" ] ; then
        PARALLEL_BUILD=1
    fi

    log "Number of parallel jobs for building apps: $PARALLEL_BUILD"
}

# initialize a semaphore with a given number of tokens
open_sem() {
    tmppipe="$(mktemp -u)"
    mkfifo -m 600 "$tmppipe"
    exec 3<>"$tmppipe"
    rm "$tmppipe"
    local i=$1
    while [ $i -gt 0 ]; do
        printf %s 000 >&3
        ((i=i-1))
    done
}

parallel_build_failure() {
    kill $(jobs -p)
    wait
    exit 1
}

# run the given command asynchronously and pop/push tokens
run_with_lock() {
    local x
    # this read waits until there is something to read
    read -u 3 -n 3 x && ((0==x)) || parallel_build_failure
    (
        ( "$@"; )

        # push the return code of the command to the semaphore
        printf '%.3d' $? >&3
    )&
}

stop() {
    kill $(jobs -p)
    exit 1
}

wait_build() {
    if ! wait -n 1; then
        stop
    fi
}

##### #####

build_apps() {
    log "Building apps..."

    # Loop over the apps
    for app in frontend_app_*; do
        if [ -f "$app/.disabled-app" ]; then
            log "Skipping $app because of the existence of the .disabled-app file"
        elif [ "$PARALLEL_BUILD" = 1 ]; then
            log "Building $app"
            build_app "$app"
        else
            run_with_lock build_app_with_success "$app"
        fi
    done

    # Loop over the apps
    if [ "$PARALLEL_BUILD" != 1 ]; then
        for app in frontend_app_*; do
            if ! [ -f "$app/.disabled-app" ]; then
                wait_build
            fi
        done
    fi
}

cd "$(dirname "$0")"

mkdir -p "frontend/dist/app" || logerror "Failed to make directory frontend/dist/app/"

trap stop SIGINT SIGTERM

init_parallel
parallel_build_lib
build_vendors
build_lib_using_externals
wait_for_lib_build_to_end
build_apps
build_frontend

loggood "-- frontend build successful."
