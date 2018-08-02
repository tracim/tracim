#!/bin/bash

. bash_library.sh # source bash_library.sh

# install Tracim Lib

log "cd frontend_lib"
cd frontend_lib
log "npm i"
npm i
log "sudo npm link"
sudo npm link
cd -

# install app Html Document

log "cd frontend_app_html-document"
cd frontend_app_html-document
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
cd -

# install app Thread

log "cd frontend_app_thread"
cd frontend_app_thread
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
cd -

# install app Workspace

log "cd frontend_app_workspace"
cd frontend_app_workspace
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
cd -


# install app Admin Workspace User

log "cd frontend_app_admin_workspace_user"
cd frontend_app_admin_workspace_user
log "npm i"
npm i
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib
cd -

# install Tracim Frontend

log "cd frontend"
cd frontend
log "npm i"
npm i
cd -
