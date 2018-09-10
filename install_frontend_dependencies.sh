#!/bin/bash

# shellcheck disable=SC1091
#. bash_library.sh # source bash_library.sh

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

##################################################################

# Check if not running with sudoers
if [ $PARAM1 == "root" ]; then
    PREFIX=""
    PREFIXCURL=""
else
    PREFIX="sudo"
    PREFIXCURL="sudo -E"
fi

DEFAULTDIR=$(pwd)

# install nodjs if not installed
log "verify if nodjs is installed"
dpkg -l | grep '^ii' | grep 'nodejs\s'

if [ $? -eq 0 ]; then
    loggood "nodjs is installed"
else
    log "install nodejs"
    $PREFIX apt install -y curl && loggood "success" || logerror "some error"
    curl -sL https://deb.nodesource.com/setup_8.x | $PREFIXCURL bash -
    $PREFIX apt install -y nodejs && loggood "success" || logerror "some error"
fi


# install Tracim Lib
log "cd $DEFAULTDIR/frontend_lib"
cd $DEFAULTDIR/frontend_lib  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "$USER npm link"
$PREFIX npm link && loggood "success" || logerror "some error"
log "build-translation"
npm run build-translation && loggood "success" || logerror "some error"


# install app Html Document
log "cd $DEFAULTDIR/frontend_app_html-document"
cd $DEFAULTDIR/frontend_app_html-document  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"
log "build-translation"
npm run build-translation && loggood "success" || logerror "some error"


# install app Thread
log "cd $DEFAULTDIR/frontend_app_thread"
cd $DEFAULTDIR/frontend_app_thread  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"
log "build-translation"
npm run build-translation && loggood "success" || logerror "some error"


# install app Workspace
log "cd $DEFAULTDIR/frontend_app_workspace"
cd $DEFAULTDIR/frontend_app_workspace  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"
log "build-translation"
npm run build-translation && loggood "success" || logerror "some error"


# install app Admin Workspace User
log "cd $DEFAULTDIR/frontend_app_admin_workspace_user"
cd $DEFAULTDIR/frontend_app_admin_workspace_user  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"
log "build-translation"
npm run build-translation && loggood "success" || logerror "some error"


# install app file
log "cd $DEFAULTDIR/frontend_app_file"
cd $DEFAULTDIR/frontend_app_file  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"
log "build-translation"
npm run build-translation && loggood "success" || logerror "some error"


# install Tracim Frontend
log "cd $DEFAULTDIR/frontend"
cd $DEFAULTDIR/frontend  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"
log "cp configEnv.json.sample configEnv.json"
cp configEnv.json.sample configEnv.json && loggood "success" || logerror "some error"
log "build-translation"
npm run build-translation && loggood "success" || logerror "some error"


# Return to "$DEFAULTDIR/"
log "cd $DEFAULTDIR"
cd $DEFAULTDIR || exit 1
