#!/bin/bash

# Main in bottom

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

function log {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

function loggood {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

function logerror {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}


dev=""
if [ "$1" = "-d" ]; then
    dev="-dev"
fi

for lang in $(ls i18next.scanner); do
    log "copying ${lang}/translation.json"
    cp i18next.scanner/"${lang}"/translation.json ../frontend/dist/app/custom-form_"${lang}"_translation.json && loggood "success" || logerror "some error"
done
