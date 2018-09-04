#!/bin/bash

# shellcheck disable=SC1091
. bash_library.sh # source bash_library.sh

# install nodjs if not installed

(
  log "verify if nodjs is installed"
  dpkg -l | grep '^ii' | grep 'nodejs\s'

  if [ $? -eq 0 ]; then
    loggood "nodjs is installed"
  else
    log "install nodejs"
    sudo apt install -y curl && loggood "success" || logerror "some error"
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt install -y nodejs && loggood "success" || logerror "some error"
  fi
)


# install Tracim Lib

(
  log "cd frontend_lib"
  cd frontend_lib
  log "npm i"
  npm i && loggood "success" || logerror "some error"
  log "sudo npm link"
  sudo npm link && loggood "success" || logerror "some error"
  log "build-translation"
  npm run build-translation && loggood "success" || logerror "some error"
)

# install app Html Document

(
  log "cd frontend_app_html-document"
  cd frontend_app_html-document
  log "npm i"
  npm i && loggood "success" || logerror "some error"
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib && loggood "success" || logerror "some error"
  log "build-translation"
  npm run build-translation && loggood "success" || logerror "some error"
)

# install app Thread

(
  log "cd frontend_app_thread"
  cd frontend_app_thread
  log "npm i"
  npm i && loggood "success" || logerror "some error"
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib && loggood "success" || logerror "some error"
  log "build-translation"
  npm run build-translation && loggood "success" || logerror "some error"
)

# install app Workspace

(
  log "cd frontend_app_workspace"
  cd frontend_app_workspace
  log "npm i"
  npm i && loggood "success" || logerror "some error"
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib && loggood "success" || logerror "some error"
  log "build-translation"
  npm run build-translation && loggood "success" || logerror "some error"
)

# install app Admin Workspace User

(
  log "cd frontend_app_admin_workspace_user"
  cd frontend_app_admin_workspace_user
  log "npm i"
  npm i && loggood "success" || logerror "some error"
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib && loggood "success" || logerror "some error"
  log "build-translation"
  npm run build-translation && loggood "success" || logerror "some error"
)

# install Tracim Frontend

(
  log "cd frontend"
  cd frontend
  log "npm i"
  npm i && loggood "success" || logerror "some error"
  log "npm link tracim_frontend_lib"
  npm link tracim_frontend_lib && loggood "success" || logerror "some error"
  log "cp configEnv.json.sample configEnv.json"
  cp configEnv.json.sample configEnv.json && loggood "success" || logerror "some error"
  log "build-translation"
  npm run build-translation && loggood "success" || logerror "some error"
)
