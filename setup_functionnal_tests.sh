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
if [ $PARAM1 == "root" ]; then
    PREFIX=""
else
    PREFIX=sudo
fi


# install nodjs if not installed
log "Verify if nodjs is installed."
dpkg -l | grep '^ii' | grep 'nodejs\s'

if [ $? -eq 0 ]; then
    loggood "nodejs is installed."
else
    log "Install nodejs"
    $PREFIX apt update
    $PREFIX apt install -y curl && loggood "success" || logerror "some error"
    curl -sL https://deb.nodesource.com/setup_8.x | $PREFIX -E bash -
    $PREFIX apt install -y nodejs && loggood "success" || logerror "some error"
    loggood "nodejs is now installed."
fi


# install Cypress
log "Go to functionnal_tests subdir.."
cd  functionnal_tests || exit 1
CURRENTDIR=$(pwd)
loggood "Your are now here: \"$CURRENTDIR\""
log "Check if package.json exist."
if [ ! -f package.json ]; then
    log "package.json not exist => run npm init"
    npm init -y && loggood "success" || logerror "some error"
    loggood "npm init finished => package.json is now created."
else
    loggood "package.json exist."
fi
log "Install cypress."
$PREFIX apt update && loggood "success" || logerror "some error"
$PREFIX apt install -y xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 && loggood "success" || logerror "some error"
npm install cypress --save-dev && loggood "success" || logerror "some error"
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

