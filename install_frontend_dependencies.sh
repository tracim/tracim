#!/bin/bash

# shellcheck disable=SC1091
. bash_library.sh # source bash_library.sh

# install nodjs if not installed

(
  log "verify if nodjs is installed"
  dpkg -l | grep '^ii' | grep 'nodejs\s'

  if [ $? -eq 0 ]; then
    log "nodjs is installed"
  else
    log "install nodejs"
    sudo apt install curl
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt install -y nodejs
  fi
)


# install Tracim Lib

(
  log "cd frontend_lib"
  cd frontend_lib
  log "npm i"
  npm i
  log "sudo npm link"
  sudo npm link || exit
)

# install app Html Document

(
  log "cd frontend_app_html-document"
  cd frontend_app_html-document
  log "npm i"
  npm i
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib
)

# install app Thread

(
  log "cd frontend_app_thread"
  cd frontend_app_thread
  log "npm i"
  npm i
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib
)

# install app Workspace

(
  log "cd frontend_app_workspace"
  cd frontend_app_workspace
  log "npm i"
  npm i
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib
)

# install app Admin Workspace User

(
  log "cd frontend_app_admin_workspace_user"
  cd frontend_app_admin_workspace_user
  log "npm i"
  npm i
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib
)

# install Tracim Frontend

(
  log "cd frontend"
  cd frontend
  log "npm i"
  npm i
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib
)
