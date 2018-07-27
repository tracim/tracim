#!/bin/bash

. bash_library.sh # source bash_library.sh

log "cd frontend_lib"
cd frontend_lib
log "npm i"
npm i
log "sudo npm link"
sudo npm link
cd -

log "cd frontend_app_html-document"
cd frontend_app_html-document
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
cd -

log "cd frontend"
cd frontend
log "npm i"
npm i
cd -
