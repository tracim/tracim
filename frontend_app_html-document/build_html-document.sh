#!/bin/bash

. ../bash_library.sh # source bash_library.sh

windoz=""
if [[ $1 = "-w" ]]; then
    windoz="windoz"
fi

log "npm run build$windoz"
npm run build$windoz
log "cp dist/html-document.app.js ../frontend/dist/app"
cp dist/html-document.app.js ../frontend/dist/app
log "cp i18next.scanner/en/translation.json ../frontend/dist/app/html-document_en_translation.json"
cp i18next.scanner/en/translation.json ../frontend/dist/app/html-document_en_translation.json
log "cp i18next.scanner/fr/translation.json ../frontend/dist/app/html-document_fr_translation.json"
cp i18next.scanner/fr/translation.json ../frontend/dist/app/html-document_fr_translation.json
