#!/bin/bash

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
if [ "$1" = "-d" ]; then
    dev="-d"
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

build_app() {
    app=$(basename "$1")
	cd "$1" || exit 1
    ./build_*.sh $dev || logerror "Failed building $app."
}

build_app_with_success() {
    build_app "$1" && loggood "Built $1 successfully"
}

##### Functions to manage parallel builds. #####

# See https://stackoverflow.com/questions/6481005/how-to-obtain-the-number-of-cpus-cores-in-linux-from-the-command-line

# initialize a semaphore with a given number of tokens
function open_sem {
    tmppipe="$(mktemp -u)"
    mkfifo -m 600 "$tmppipe"
    exec 3<>"$tmppipe"
    rm "$tmppipe"
    local i=$1
    for((;i>0;i--)); do
        printf %s 000 >&3
    done
}

function parallel_build_failure {
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

wait_build() {
    if ! wait -n 1; then
        kill $(jobs -p)
        exit 1
    fi
}

##### #####

function build_apps {
    log "Building apps..."

    # Loop over the apps
    for app in "$DEFAULTDIR"/frontend_app_*; do
        if [ -f "$app/.disabled-app" ]; then
            log "Skipping $app because of the existence of the .disabled-app file"
        elif [ "$PARALLEL_BUILD" = 1 ]; then
            log "Building $app"
            build_app $app
        else
            run_with_lock build_app_with_success "$app"
        fi
    done

    # Loop over the apps
    if [ "$PARALLEL_BUILD" != 1 ]; then
        for app in "$DEFAULTDIR"/frontend_app_*; do
            if ! [ -f "$app/.disabled-app" ]; then
                wait_build
            fi
        done
    fi
}

build_tracim_lib() {
    yarn workspace tracim_frontend_lib run build && loggood "Built tracim_frontend_lib for unit tests" || logerror "Could not build tracim_frontend_lib"
}

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'yarn install'\n${BROWN}/!\ ${NC}"

if [ -z "${PARALLEL_BUILD+x}" ]; then
    PARALLEL_BUILD="$(which nproc > /dev/null && nproc --all || echo 1)"
elif [ "${PARALLEL_BUILD}" = "false" ] || [ "${PARALLEL_BUILD}" = "0" ] ; then
    PARALLEL_BUILD=1
fi

log "Number of parallel jobs for building apps: $PARALLEL_BUILD"

DEFAULTDIR=$(pwd)
export DEFAULTDIR

# create folder $DEFAULTDIR/frontend/dist/app/ if it does not exist
mkdir -p $DEFAULTDIR/frontend/dist/app/ || logerror "Failed to make directory $DEFAULTDIR/frontend/dist/app/"

log "Building tracim_frontend_lib for unit tests"

# Tracim Lib, for unit tests
if [ "$PARALLEL_BUILD" = 1 ]; then
    loggood "Building tracim_frontend_lib for unit tests"
    build_tracim_lib
else
    # initialize the parallel build
    open_sem "$PARALLEL_BUILD"
    run_with_lock build_tracim_lib
fi


# Tracim vendors
log "Building tracim_frontend_vendors"
cd "$DEFAULTDIR/frontend_vendors"
./build_vendors.sh && loggood "Built tracim_frontend_vendors successfully" || logerror "Could not build tracim_frontend_vendors"


# Tracim Lib for the browsers
log "Building tracim_frontend_lib for Tracim"
yarn workspace tracim_frontend_lib run buildUsingExternalVendors && loggood "Built tracim_frontend_lib for Tracim successfully" || logerror "Failed to build tracim_frontend_lib for Tracim"

if [ "$PARALLEL_BUILD" != 1 ]; then
    # We need to wait for the build of tracim_frontend_lib for unit tests to finish
    wait_build
fi

build_apps

loggood "-- frontend build successful."
