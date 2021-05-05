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

log "build frontend_app_custom-form"
yarn run buildoptimized$dev && loggood "success" || logerror "some error"
log "copying built file to frontend/"
cp dist/custom-form.app.js ../frontend/dist/app/custom-form.app.js && loggood "success" || logerror "some error"
log "copying en translation.json"
cp i18next.scanner/en/translation.json ../frontend/dist/app/custom-form_en_translation.json && loggood "success" || logerror "some error"
log "copying fr translation.json"
cp i18next.scanner/fr/translation.json ../frontend/dist/app/custom-form_fr_translation.json && loggood "success" || logerror "some error"
log "copying de translation.json"
cp i18next.scanner/de/translation.json ../frontend/dist/app/custom-form_de_translation.json && loggood "success" || logerror "some error"
