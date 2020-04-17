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
}

windoz=""
if [[ $1 = "-w" || $2 = "-w" ]]; then
    windoz="windoz"
fi

dev=""
if [[ $1 = "-d" || $2 = "-d" ]]; then
    dev="-dev"
fi

log "building frontend_app_admin_workspace_user"
npm run build$dev$windoz  && loggood "success" || logerror "some error"
log "copying built file to frontend/"
cp dist/admin_workspace_user.app.js ../frontend/dist/app  && loggood "success" || logerror "some error"
log "copying en translation.json"
cp i18next.scanner/en/translation.json ../frontend/dist/app/admin_workspace_user_en_translation.json && loggood "success" || logerror "some error"
log "copying fr translation.json"
cp i18next.scanner/fr/translation.json ../frontend/dist/app/admin_workspace_user_fr_translation.json && loggood "success" || logerror "some error"
log "copying pt translation.json"
cp i18next.scanner/pt/translation.json ../frontend/dist/app/admin_workspace_user_pt_translation.json && loggood "success" || logerror "some error"
