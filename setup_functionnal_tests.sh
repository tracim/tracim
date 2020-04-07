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
log "Checking whether npm is installed"
npm -v
if [ $? -eq 0 ]; then
    loggood "npm \"$(npm -v)\" and node \"$(node -v)\" are installed"
else
    logerror "npm not installed"
    log "install npm with nodejs"
    $SUDO apt install -y curl && loggood "install curl success" || logerror "failed to install curl"
    curl -sL https://deb.nodesource.com/setup_10.x | $SUDOCURL bash -
    $SUDO apt update
    $SUDO apt install -y nodejs && loggood "install nodejs success" || logerror "failed to install nodejs"
    log "Checking whether nodejs 10.x is now installed"
    dpkg -l | grep '^ii' | grep 'nodejs\s' | grep '\s10.'
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
        logerror "nodejs 10.x and npm are not installed - you use node \"$(node -v)\" - Please re-install manually your version of nodejs - tracim install stopped"
        exit 1
    fi
fi


# install Cypress
log "Entering the functionnal_tests directory..."
cd  functionnal_tests || exit 1
CURRENTDIR=$(pwd)
loggood "Current directory: '$CURRENTDIR'"
log "Installing Cypress."
$SUDO apt update && loggood "success" || logerror "some error"
$SUDO apt install -y xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 && loggood "success" || logerror "some error"
npm install && loggood "success" || logerror "some error"
loggood "Cypress is now installed."


# modify cypress.json
log "Checking whether cypress.json exists."
if [ ! -f cypress.json ]; then
    log "cypress.json does not exist => copying from cypress.json.sample"
    cp cypress.json.sample cypress.json && loggood "success" || logerror "some error"
    log "Writing path to cypress.json"
    SUBDIR=$(pwd)
    sed -i "s|{path_test_file}|$SUBDIR/cypress_test|g" cypress.json && loggood "success" || logerror "some error"
    loggood "Path is now configured."
else
    log "cypress.json exists => checking whether integrationFolder has the path."
    if grep -q "\"integrationFolder\"\:\s\"{path_test_file}\"" cypress.json ; then
        log "No. Writing the path in cypress.json"
        SUBDIR=$(pwd)
        sed -i "s|{path_test_file}|$SUBDIR|g" cypress.json && loggood "success" || logerror "some error"
        loggood "Path is now configured."
    else
        loggood "Yes. Manually change if necessary."
    fi
fi
