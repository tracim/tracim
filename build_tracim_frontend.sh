#!/usr/bin/env bash
function log {
    echo ""
    echo ">> $ $1"
    echo ""
}

log "cd frontend_lib"
cd frontend_lib
log "npm i"
npm i
log "npm link"
npm link
log "npm run buildtracimlib"
npm run buildtracimlib
cd -

log "cd frontend_app_html-document"
cd frontend_app_html-document
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
log "npm run build # for frontend_app_html-document"
npm run build
log "cp dist/html-document.app.js"
cp dist/html-document.app.js ../frontend/dist/app
cd -

log "cd frontend"
cd frontend
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
log "npm run servdev-dashboard # for frontend"
npm run servdev-dashboard
