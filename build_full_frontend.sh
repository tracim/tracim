#!/bin/bash

# shellcheck disable=SC1091
. bash_library.sh # source bash_library.sh

windoz=""
if  [[ $1 = "-w" ]]; then
    windoz="windoz"
fi

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'npm install'\n${BROWN}/!\ ${NC}"

# create folder frontend/dist/app/ if no exists
if [ ! -d "frontend/dist/app/" ]; then
  log "mkdir frontend/dist/app/"
  mkdir frontend/dist/app/ && loggood "success" || logerror "some error"
fi

# Tracim Lib
(
  log "cd frontend_lib"
  cd frontend_lib || exit
  log "build frontend_lib"
  npm run buildtracimlib$windoz && loggood "success" || logerror "some error"
)


# app Html Document
(
  log "cd frontend_app_html-document"
  cd frontend_app_html-document || exit
  ./build_html-document.sh
)


# app Thread
(
  log "cd frontend_app_thread"
  cd frontend_app_thread || exit
  ./build_thread.sh
)


# app Workspace
(
  log "cd frontend_app_workspace"
  cd frontend_app_workspace || exit
  ./build_workspace.sh
)

# app Admin Workspace User
(
  log "cd frontend_app_admin_workspace_user"
  cd frontend_app_admin_workspace_user || exit
  ./build_admin_workspace_user.sh
)

# app File
(
  log "cd frontend_app_file"
  cd frontend_app_file || exit
  ./build_file.sh
)

# build Tracim
(
  log "cd frontend"
  cd frontend || exit
  log "build Tracim"
  npm run build && loggood "success" || logerror "some error"
)

loggood "-- frontend build successful."
