#!/bin/bash

BROWN='\033[0;33m'
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

if [ -z "${QUIET_BUILD+x}" ]; then
    export QUIET_BUILD=true
fi

if [ -z "${DISABLE_LINTING+x}" ]; then
    export DISABLE_LINTING=true
fi

function log {
    echo -e "${BROWN}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

function loggood {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

function logerror {
    echo -e "${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}

function build_app {
    app=$(basename "$1")
	cd "$1" || exit 1
    ./build_*.sh $dev || logerror "Failed building $app."
}

function build_app_with_success {
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
function run_with_lock {
    local x
    # this read waits until there is something to read
    read -u 3 -n 3 x && ((0==x)) || parallel_build_failure
    (
        ( "$@"; )

        # push the return code of the command to the semaphore
        printf '%.3d' $? >&3
    )&
}

##### #####

function build_apps {
    log "Building apps..."

    # Initialize parallel build
    if ! [ "$PARALLEL_BUILD" = 1 ]; then
        open_sem "$PARALLEL_BUILD"
    fi

    # Loop over the apps
    for app in "$DEFAULTDIR"/frontend_app_*; do
        if [ "$PARALLEL_BUILD" = 1 ]; then
            log "Building $app"
            build_app $app
        else
            run_with_lock build_app_with_success "$app"
        fi
    done

    # Loop over the apps
    if ! [ "$PARALLEL_BUILD" = 1 ]; then
        for app in "$DEFAULTDIR"/frontend_app_*; do
            if ! wait -n 1; then
                kill $(jobs -p)
                exit 1
            fi
        done
    fi
}

windoz=""
if [[ $1 = "-w" || $2 = "-w" ]]; then
    windoz="windoz"
fi

dev=""
if [[ $1 = "-d" || $2 = "-d" ]]; then
    dev="-d"
fi

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'yarn install'\n${BROWN}/!\ ${NC}"

if [ -z "${PARALLEL_BUILD+x}" ]; then
    PARALLEL_BUILD="$(which nproc > /dev/null && nproc --all || echo 1)"
elif [ "${PARALLEL_BUILD}" = "false" ] || [ "${PARALLEL_BUILD}" = "0" ] ; then
    PARALLEL_BUILD=1
fi

log "Number of parallel jobs for building apps: $PARALLEL_BUILD"

DEFAULTDIR=$(pwd)
export DEFAULTDIR

# create folder $DEFAULTDIR/frontend/dist/app/ if no exists
mkdir -p $DEFAULTDIR/frontend/dist/app/ || logerror "Failed to make directory $DEFAULTDIR/frontend/dist/app/"

# Tracim vendors
log "Building tracim_frontend_vendors"
cd "$DEFAULTDIR/frontend_vendors"
./build_vendors.sh && loggood "Built tracim_frontend_vendors successfully" || logerror "Could not build tracim_frontend_vendors"

# Tracim Lib
log "Building tracim_frontend_lib"
yarn workspace tracim_frontend_lib run buildtracimlib$windoz && loggood "Built tracim_frontend_vendors successfully" || logerror "Failed to build tracim_frontend_lib"

build_apps

# build the Frontend
log "Building the Tracim frontend"
yarn workspace tracim run build || logerror "Failed to build the Tracim frontend."

loggood "-- frontend build successful."
