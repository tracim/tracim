#!/bin/bash

BROWN='\033[0;33m'
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

if [ -z "${PARALLEL_BUILD+x}" ]; then
    PARALLEL_BUILD=true
fi

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

windoz=""
if [[ $1 = "-w" || $2 = "-w" ]]; then
    windoz="windoz"
fi

dev=""
if [[ $1 = "-d" || $2 = "-d" ]]; then
    dev="-d"
fi

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'yarn install'\n${BROWN}/!\ ${NC}"

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

log "Building apps..."
for app in "$DEFAULTDIR"/frontend_app_*; do
    if [ "$PARALLEL_BUILD" = "true" ]; then
        build_app $app && loggood "Built $app successfully" &
    else
        log "Building $app"
        build_app $app
    fi
done

if [ "$PARALLEL_BUILD" = "true" ]; then
    for app in "$DEFAULTDIR"/frontend_app_*; do
        if ! wait -n 1; then
            kill $(jobs -p)
            exit 1
        fi
    done
fi

# build the Frontend
log "Building the Tracim frontend"
yarn workspace tracim run build || logerror "Failed to build the Tracim frontend."

loggood "-- frontend build successful."
