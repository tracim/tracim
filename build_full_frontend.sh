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
  mkdir frontend/dist/app/ && loggood "success" || logerror "some error"
fi

# Tracim Lib
(
  log "build frontend_lib"
  cd frontend_lib || exit
  npm run buildtracimlib$windoz && loggood "success" || logerror "some error"
)


# app Html Document
(
  cd frontend_app_html-document || exit
  ./build_html-document.sh
)


# app Thread
(
  cd frontend_app_thread || exit
  ./build_thread.sh
)


# app Workspace
(
  cd frontend_app_workspace || exit
  ./build_workspace.sh
)

# app Admin Workspace User
(
  cd frontend_app_admin_workspace_user || exit
  ./build_admin_workspace_user.sh
)

# build Tracim
(
  cd frontend || exit
  npm run build && loggood "success" || logerror "some error"
)

loggood "-- frontend build successful."
