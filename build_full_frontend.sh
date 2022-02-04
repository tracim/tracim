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

yarndev=""
shelldev=""
if [ "$1" = "-d" ]; then
    yarndev=":dev"
    shelldev="-d"
fi

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'yarn install'\n${BROWN}/!\ ${NC}"

DEFAULTDIR=$(pwd)
export DEFAULTDIR

# create folder $DEFAULTDIR/frontend/dist/app/ if no exists
mkdir -p $DEFAULTDIR/frontend/dist/app/ || logerror "Failed to make directory $DEFAULTDIR/frontend/dist/app/"

# Tracim frontend vendors
cd "$DEFAULTDIR/frontend_vendors"
./build_vendors.sh $shelldev && loggood "success" || logerror "Could not build tracim_frontend_vendors"

# Tracim frontend Lib as standalone
# required to support standalone build and because tracim_frontend_lib is in app's package.json
# INFO - CH - 2021-12-29 - It is currently only used to allow apps to import frontend_lib stylus files
# NOTE - RJ - 2020-08-20 - the absence of $yarndev is intentional
yarn workspace tracim_frontend_lib run build:standalone && loggood "success" || logerror "Could not build tracim_frontend_lib"

# Tracim frontend Lib as optimized
log "Building optimized tracim_frontend_lib"
cd "$DEFAULTDIR/frontend_lib"
./build_frontend_lib.sh $shelldev

for app in "$DEFAULTDIR"/frontend_app_*; do
	if [ -f "$app/.disabled-app" ]; then
		log "Skipping $app because of the existence of the .disabled-app file"
	else
		cd "$app" || exit 1
		./build_app.sh $shelldev || logerror "Failed building $app."
	fi
done

# Build Tracim frontend
log "building the Tracim frontend"
cd "$DEFAULTDIR/frontend"
./build_frontend.sh $shelldev || logerror "Failed building frontend."

loggood "-- frontend build successful."
