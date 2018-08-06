#!/bin/bash

. ../bash_library.sh # source bash_library.sh

windoz=""
if [[ $1 = "-w" ]]; then
    windoz="windoz"
fi

log "build frontend_app_admin_workspace_user"
npm run build$windoz
log "copying built file to frontend/"
cp dist/admin_workspace_user.app.js ../frontend/dist/app
log "copying en translation.json"
cp i18next.scanner/en/translation.json ../frontend/dist/app/admin_workspace_user_en_translation.json
log "copying fr translation.json"
cp i18next.scanner/fr/translation.json ../frontend/dist/app/admin_workspace_user_fr_translation.json
