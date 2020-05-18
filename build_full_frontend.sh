#!/bin/bash

# Main in bottom

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

log() {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

loggood() {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

logerror() {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}

windoz=""
if [ "$1" = "-w" ] || [ "$2" = "-w" ]; then
    windoz="windoz"
fi

dev=""
if [ "$1" = "-d" ] || [ "$2" = "-d" ]; then
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
./build_vendors.sh && loggood "success" || logerror "Could not build tracim_frontend_vendors"


# Tracim Lib Bundle
log "Building tracim_frontend_lib"
yarn workspace tracim_frontend_lib run build$windoz && loggood "success" || logerror "Could not build tracim_frontend_lib"

# Tracim Lib for the browsers
log "Building tracim_frontend_lib for Tracim"
yarn workspace tracim_frontend_lib run tracimbuild$windoz && loggood "success" || logerror "Could not build tracim_frontend_lib for Tracim"

for app in "$DEFAULTDIR"/frontend_app_*; do
	if [ -f "$app/.disabled-app" ]; then
		log "Skipping $app because of the existence of the .disabled-app file"
	else
		cd "$app" || exit 1
		./build_*.sh $dev || logerror "Failed building $app."
	fi
done

# build Tracim
log "building the Tracim frontend"
yarn workspace tracim run tracimbuild && loggood "success" || logerror "Could not build the Tracim frontend."

loggood "-- frontend build successful."
