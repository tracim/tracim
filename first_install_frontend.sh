#!/bin/bash

windoz=""
if  [[ $1 = "-w" ]]; then
    windoz="windoz"
fi

function log {
    echo -e "\n>> $ $1\n"
}

log "cd frontend_lib"
cd frontend_lib
log "npm i"
npm i
log "npm link"
npm link
log "npm run buildtracimlib$windoz"
npm run buildtracimlib$windoz
cd -

log "cd frontend_app_html-document"
cd frontend_app_html-document
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
log "npm run build$windoz # for frontend_app_html-document"
npm run build$windoz
log "cp dist/html-document.app.js"
cp dist/html-document.app.js ../frontend/dist/app
cd -

log "cd frontend"
cd frontend
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
if [[ $1 = "-w" ]]; then
    log "npm run servdev # for frontend"
    npm run servdev
else
    log "npm run servdev-dashboard # for frontend"
    npm run servdev-dashboard
fi
