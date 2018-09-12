#!/bin/bash

# shellcheck disable=SC1091
. ../bash_library.sh # source bash_library.sh

windoz=""
if [[ $1 = "-w" ]]; then
    windoz="windoz"
fi

log "build frontend_app_workspace_advanced"
npm run build$windoz && loggood "success" || logerror "some error"
log "copying built file to frontend/"
cp dist/workspace_advanced.app.js ../frontend/dist/app && loggood "success" || logerror "some error"
log "copying en translation.json"
cp i18next.scanner/en/translation.json ../frontend/dist/app/workspace_advanced_en_translation.json && loggood "success" || logerror "some error"
log "copying fr translation.json"
cp i18next.scanner/fr/translation.json ../frontend/dist/app/workspace_advanced_fr_translation.json && loggood "success" || logerror "some error"
