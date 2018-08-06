#!/bin/bash

# shellcheck disable=SC1091
. bash_library.sh # source bash_library.sh

windoz=""
if  [[ $1 = "-w" ]]; then
    windoz="windoz"
fi

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'npm install'\n${BROWN}/!\ ${NC}it also assumes your webpack dev server of frontend is running"

# Tracim Lib
log "build frontend_lib"
(
  cd frontend_lib || exit
  npm run buildtracimlib$windoz
)


# app Html Document
log "build frontend_app_html-document"
(
  cd frontend_app_html-document || exit
  npm run build$windoz
)

log "copying built file to frontend/"
cp frontend_app_html-document/dist/html-document.app.js frontend/dist/app/

log "copying en translation.json"
cp frontend_app_html-document/i18next.scanner/en/translation.json frontend/dist/app/html-document_en_translation.json

log "copying fr translation.json"
cp frontend_app_html-document/i18next.scanner/fr/translation.json frontend/dist/app/html-document_fr_translation.json


# app Thread
log "build frontend_app_thread"
(
  cd frontend_app_thread || exit
  npm run build$windoz
)

log "copying built file to frontend/"
cp frontend_app_thread/dist/thread.app.js frontend/dist/app/

log "copying Thread en translation.json"
cp frontend_app_thread/i18next.scanner/en/translation.json frontend/dist/app/thread_en_translation.json

log "copying Thread fr translation.json"
cp frontend_app_thread/i18next.scanner/fr/translation.json frontend/dist/app/thread_fr_translation.json


# app Workspace
log "build frontend_app_workspace"
(
  cd frontend_app_workspace || exit
  npm run build$windoz
)

log "copying built file to frontend/"
cp frontend_app_workspace/dist/workspace.app.js frontend/dist/app/

log "copying Thread en translation.json"
cp frontend_app_workspace/i18next.scanner/en/translation.json frontend/dist/app/workspace_en_translation.json

log "copying Thread fr translation.json"
cp frontend_app_workspace/i18next.scanner/fr/translation.json frontend/dist/app/workspace_fr_translation.json

# app Admin Workspace User
log "build frontend_app_admin_workspace_user"
(
  cd frontend_app_admin_workspace_user || exit
  npm run build$windoz
)

log "copying built file to frontend/"
cp frontend_app_admin_workspace_user/dist/admin_workspace_user.app.js frontend/dist/app/

log "copying Thread en translation.json"
cp frontend_app_admin_workspace_user/i18next.scanner/en/translation.json frontend/dist/app/admin_workspace_user_en_translation.json

log "copying Thread fr translation.json"
cp frontend_app_admin_workspace_user/i18next.scanner/fr/translation.json frontend/dist/app/admin_workspace_user_fr_translation.json

log "frontend fully built"
