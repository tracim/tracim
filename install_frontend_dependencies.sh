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

##################################################################

# Check if not running with sudoers
if [ "$1" == "root" ]; then
    SUDO=""
    SUDOCURL=""
else
    SUDO="sudo"
    SUDOCURL="sudo -E"
fi

DEFAULTDIR=$(pwd)
export DEFAULTDIR
echo "This is DEFAULTDIR \"$DEFAULTDIR\""

# install npm and nodjs if not installed
log "verify if npm is installed"
npm -v
if [ $? -eq 0 ]; then
    loggood "npm \"$(npm -v)\" and node \"$(node -v)\" are installed"
else
    logerror "npm not installed"
    log "install npm with nodejs"
    $SUDO apt install -y curl && loggood "success" || logerror "some error"
    curl -sL https://deb.nodesource.com/setup_8.x | $SUDOCURL bash -
    $SUDO apt update
    $SUDO apt install -y nodejs && loggood "success" || logerror "some error"
    log "verify if nodejs 8.x is now installed"
    dpkg -l | grep '^ii' | grep 'nodejs\s' | grep '\s8.'
    if [ $? -eq 0 ]; then
        loggood "node \"$(node -v)\" is correctly installed"
        npm -v
        if [ $? -eq 0 ]; then
            loggood  "npm \"$(npm -v)\" is correctly installed"
        else
            logerror "npm is not installed - you use node \"$(node -v)\" - Please re-install manually your version of nodejs - tracim install stopped"
        exit 1
        fi
    else
        logerror "nodejs 8.x and npm are not installed - you use node \"$(node -v)\" - Please re-install manually your version of nodejs - tracim install stopped"
        exit 1
    fi
fi




# install Tracim Lib
log "cd $DEFAULTDIR/frontend_lib"
cd $DEFAULTDIR/frontend_lib  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "$USER npm link"
$SUDO npm link && loggood "success" || logerror "some error"


# install app Html Document
log "cd $DEFAULTDIR/frontend_app_html-document"
cd $DEFAULTDIR/frontend_app_html-document  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"


# install app Thread
log "cd $DEFAULTDIR/frontend_app_thread"
cd $DEFAULTDIR/frontend_app_thread  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"


# install app Workspace
log "cd $DEFAULTDIR/frontend_app_workspace"
cd $DEFAULTDIR/frontend_app_workspace  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"



# install app workspace advanced
log "cd $DEFAULTDIR/frontend_app_workspace_advanced"
cd $DEFAULTDIR/frontend_app_workspace_advanced  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"


# install app file
log "cd $DEFAULTDIR/frontend_app_file"
cd $DEFAULTDIR/frontend_app_file  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"


# install app Admin Workspace User
log "cd $DEFAULTDIR/frontend_app_admin_workspace_user"
cd $DEFAULTDIR/frontend_app_admin_workspace_user  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"


# install app Folder Advanced
log "cd $DEFAULTDIR/frontend_app_folder_advanced"
cd $DEFAULTDIR/frontend_app_folder_advanced  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"


# install Tracim Frontend
log "cd $DEFAULTDIR/frontend"
cd $DEFAULTDIR/frontend  || exit 1
log "npm i"
npm i && loggood "success" || logerror "some error"
log "npm link tracim_frontend_lib"
npm link tracim_frontend_lib && loggood "success" || logerror "some error"
log "check if configEnv.json exist"
if [ ! -f configEnv.json ]; then
    log "cp configEnv.json.sample configEnv.json ..."
    cp configEnv.json.sample configEnv.json && loggood "success" || logerror "some error"
else
    loggood "configEnv.json already exist"
fi

# Return to "$DEFAULTDIR/"
log "cd $DEFAULTDIR"
cd $DEFAULTDIR || exit 1
