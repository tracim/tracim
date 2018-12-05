#!/bin/bash

# Main in bottom

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

function log {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

function loggood {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

function logerror {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
}

windoz=""
if [[ $1 = "-w" || $2 = "-w" ]]; then
    windoz="windoz"
fi

dev=""
if [[ $1 = "-d" || $2 = "-d" ]]; then
    dev="-d"
fi

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'npm install'\n${BROWN}/!\ ${NC}"

DEFAULTDIR=$(pwd)
export DEFAULTDIR
echo "This is DEFAULTDIR \"$DEFAULTDIR\""

# create folder $DEFAULTDIR/frontend/dist/app/ if no exists
mkdir -p $DEFAULTDIR/frontend/dist/app/ && loggood "success" || logerror "some error"


# Tracim Lib
log "cd $DEFAULTDIR/frontend_lib"
cd $DEFAULTDIR/frontend_lib || exit 1
log "build frontend_lib"
npm run buildtracimlib$windoz && loggood "success" || logerror "some error"


# app Html Document
log "cd $DEFAULTDIR/frontend_app_html-document"
cd $DEFAULTDIR/frontend_app_html-document || exit 1
./build_html-document.sh $dev


# app Thread
log "cd $DEFAULTDIR/frontend_app_thread"
cd $DEFAULTDIR/frontend_app_thread || exit 1
./build_thread.sh $dev


# app Workspace
log "cd $DEFAULTDIR/frontend_app_workspace"
cd $DEFAULTDIR/frontend_app_workspace || exit 1
./build_workspace.sh $dev


# app Workspace Advanced
log "cd $DEFAULTDIR/frontend_app_workspace_advanced"
cd $DEFAULTDIR/frontend_app_workspace_advanced || exit 1
./build_workspace_advanced.sh $dev


# app File
log "cd $DEFAULTDIR/frontend_app_file"
cd $DEFAULTDIR/frontend_app_file || exit 1
./build_file.sh $dev


# app Admin Workspace User
log "cd $DEFAULTDIR/frontend_app_admin_workspace_user"
cd $DEFAULTDIR/frontend_app_admin_workspace_user || exit 1
./build_admin_workspace_user.sh $dev


# app Folder Advanced
log "cd $DEFAULTDIR/frontend_app_folder_advanced"
cd $DEFAULTDIR/frontend_app_folder_advanced || exit 1
./build_folder.sh $dev


# build Tracim
log "cd $DEFAULTDIR/frontend"
cd $DEFAULTDIR/frontend || exit 1
log "build Tracim"
npm run build && loggood "success" || logerror "some error"


loggood "-- frontend build successful."

# Return to "$DEFAULTDIR/"
log "cd $DEFAULTDIR"
cd $DEFAULTDIR || exit 1