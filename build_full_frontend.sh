#!/bin/bash

. bash_library.sh # source bash_library.sh

windoz=""
if  [[ $1 = "-w" ]]; then
    windoz="windoz"
fi

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'npm install'\n${BROWN}/!\ ${NC}it also assumes your webpack dev server of frontend is running"

# Tracim Lib

log "cd frontend_lib"
cd frontend_lib
log "npm run buildtracimlib$windoz"
npm run buildtracimlib$windoz
cd -

# app Html Document

log "cd frontend_app_html-document"
cd frontend_app_html-document

log "npm run build$windoz # for frontend_app_html-document"
npm run build$windoz

log "cp dist/html-document.app.js"
cp dist/html-document.app.js ../frontend/dist/app

log "cp i18next.scanner/en/translation.json ../frontend/dist/app/tml-document_en_translation.json"
cp i18next.scanner/en/translation.json ../frontend/dist/app/html-document_en_translation.json

log "cp i18next.scanner/fr/translation.json ../frontend/dist/app/html-document_fr_translation.json"
cp i18next.scanner/fr/translation.json ../frontend/dist/app/html-document_fr_translation.json
cd -

# app Thread

log "cd frontend_app_thread"
cd frontend_app_thread

log "npm run build$windoz # for frontend_app_thread"
npm run build$windoz

log "cp dist/thread.app.js"
cp dist/thread.app.js ../frontend/dist/app

log "cp i18next.scanner/en/translation.json ../frontend/dist/app/thread_en_translation.json"
cp i18next.scanner/en/translation.json ../frontend/dist/app/thread_en_translation.json

log "cp i18next.scanner/fr/translation.json ../frontend/dist/app/thread_fr_translation.json"
cp i18next.scanner/fr/translation.json ../frontend/dist/app/thread_fr_translation.json
cd -

# app Admin Workspace User

log "cd frontend_app_admin_workspace_user"
cd frontend_app_admin_workspace_user

log "npm run build$windoz # for frontend_app_thread"
npm run build$windoz

log "cp dist/admin_workspace_user.app.js"
cp dist/admin_workspace_user.app.js ../frontend/dist/app

log "cp i18next.scanner/en/translation.json ../frontend/dist/app/admin_workspace_user_en_translation.json"
cp i18next.scanner/en/translation.json ../frontend/dist/app/admin_workspace_user_en_translation.json

log "cp i18next.scanner/fr/translation.json ../frontend/dist/app/admin_workspace_user_fr_translation.json"
cp i18next.scanner/fr/translation.json ../frontend/dist/app/admin_workspace_user_fr_translation.json
cd -
