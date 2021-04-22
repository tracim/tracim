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
    exit 1
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

if [ -z "${IGNORE_APT_INSTALL+x}" ]; then
    log "Installing the packages needed to run Cypress."

    $SUDO apt update && \
        $SUDO apt install -y xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 || logerror "Could not install the Cypress dependencies"
fi

log "cd functionnal_tests"
cd functionnal_tests || logerror "Could not change directory."

# modify cypress.json
log "Checking whether cypress.json exists."
if [ ! -s cypress.json ]; then
    log "cypress.json does not exist or is empty. Copying from cypress.json.sample."
    cp cypress.json.sample cypress.json && loggood "success" || logerror "some error"
fi
