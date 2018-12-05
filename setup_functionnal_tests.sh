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


# install Cypress
log "Go to functionnal_tests subdir.."
cd  functionnal_tests || exit 1
CURRENTDIR=$(pwd)
loggood "Your are now here: \"$CURRENTDIR\""
log "Install cypress."
$SUDO apt update && loggood "success" || logerror "some error"
$SUDO apt install -y xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 && loggood "success" || logerror "some error"
npm install && loggood "success" || logerror "some error"
loggood "Cypress is now installed."


# modify cypress.json
log "Check if cypress.json exist."
if [ ! -f cypress.json ]; then
    log "cypress.json not exist => copy from cypress.json.sample"
    cp cypress.json.sample cypress.json && loggood "success" || logerror "some error"
    loggood "cypress.json is now available."
    log "Write path in cypress.json"
    SUBDIR=$(pwd)
    sed -i "s|{path_test_file}|$SUBDIR/cypress_test|g" cypress.json && loggood "success" || logerror "some error"
    loggood "Path is now configured."
else
    log "cypress.json exist => check if integrationFolder have path."
    if grep -q "\"integrationFolder\"\:\s\"{path_test_file}\"" cypress.json ; then
        log "No path => write path in cypress.json"
        SUBDIR=$(pwd)
        sed -i "s|{path_test_file}|$SUBDIR|g" cypress.json && loggood "success" || logerror "some error"
        loggood "Path is now configured."
    else
        loggood "Path exist. Modify manualy if necessary."
    fi
fi

