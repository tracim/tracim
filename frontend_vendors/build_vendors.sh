#!/bin/bash

# Main in bottom

RED='\033[1;31m'
NC='\033[0m' # No Color

function loggood {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

function logerror {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}


dev=""
devext=""
if [ "$1" = "-d" ]; then
    dev="-dev"
    devext=".dev"
fi

cd "$(dirname "$0")"
yarn run build$dev || logerror "Failed to build the vendor bundle"
cp dist/tracim_frontend_vendors$devext.js ../frontend/dist/app/tracim_frontend_vendors.js  || logerror "Failed to copy the vendor bundle"
