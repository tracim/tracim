#!/bin/bash
set -eu
# Main in bottom

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

DESIRED_YARN_VERSION=3.2

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

SUDO="sudo"
SUDOCURL="sudo -E"

if ! [ -z ${1+x} ]; then
    if [ "$1" == "root" ]; then
        SUDO=""
        SUDOCURL=""
    elif [ "$1" == "-h" ] || [ "$1" == "--help" ] || [ "$1" == "help" ]; then
        echo "This script installs the dependencies of the frontend."
        echo "It installs node and yarn using the APT debian package manager" \
             "if they are not already installed."
        echo "It also checks that the installed version of node is version 14."
        echo "It then configures yarn and run yarn install to install the node modules used by the frontend."
        echo
        echo "Usage: $0 [root]"
        echo
        echo "Pass parameter 'root' if you are root and don't want to use" \
             "to install debian packages."
        exit
    fi
fi

test_node_version() {
    node_version=$(node -v | cut -d. -f1 | sed 's/v//g')
    if [ "$node_version" -gt 13 ]; then
        loggood "Node $(node -v) is installed."
    else
        logerror "Node is installed but the version is $(node -v) instead of version 14. Please install this version."
        exit 1
    fi
}

debian_install_curl() {
    if ! curl -V > /dev/null 2>&1; then
        log "Curl is not installed, installing curl…"
        $SUDO apt-get update && \
            $SUDO apt-get install -y curl && \
            loggood "Curl was installed successfully." || \
            logerror "Failed to install curl."
    fi
}

debian_install() {
    apt_install=""
    install_node_package=""
    install_yarn_package=""

    log "Checking whether Yarn is installed…"
    if which yarn > /dev/null 2>&1; then
        loggood "Yarn is installed."
    else
        log "Yarn is not installed. Adding its repository."

        debian_install_curl

        curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | $SUDO apt-key add -
        echo "deb https://dl.yarnpkg.com/debian/ stable main" | $SUDO tee /etc/apt/sources.list.d/yarn.list

        log "We will install yarn."
        apt_install=true
        install_yarn_package=yarn
    fi

    log "Checking whether Node v14+ is installed…"
    if node -v > /dev/null 2>&1; then
        test_node_version
    else
        log "Node is not installed."

        debian_install_curl

        log "Installing the node repository…"
        curl -sL https://deb.nodesource.com/setup_14.x | $SUDOCURL bash - && \
            loggood "The node repository was successfully installed." || \
            logerror "Failed to install node repository. Please install Node v14+ manually."

        log "We will install node."
        apt_install=true
        install_node_package=nodejs
    fi

    if [ "$apt_install" != "" ]; then
        log "Installing $install_node_package $install_yarn_package…"

        if [ "$install_node_package" = "" ]; then
            # if install_node_package is not empty,
            # deb.nodesource.com/setup_14.x already updated the repository

            $SUDO apt-get update || logerror "Failed updating the repositories."
        fi

        $SUDO apt-get install -y $install_node_package $install_yarn_package && \
            loggood "Dependencies successfully installed." || \
            logerror "Failed to install some dependencies."
    fi
}

setup_yarn() {
    yarn_version="$(yarn -v)"
    node_major_version=$(node -v | cut -d. -f1 | sed 's/v//g')
    node_minor_version=$(node -v | cut -d. -f2)

    if [[ "$yarn_version" != "$DESIRED_YARN_VERSION"* ]]; then
        log "Yarn is installed but doesn't match the desired version. Trying to update…"

        if ! command -v corepack &> /dev/null
        then
            log "Installing corepack…"
            if [ "$node_major_version" -lt 16 ]; then
                log "Node < 16.x, installing corepack…"
                npm i -g corepack
            else
                if [ "$node_minor_version" -lt 10 ]; then
                    log "Node < 16.10.x, installing corepack…"
                    npm i -g corepack
                fi
            fi
        fi

        log "Enabling corepack…"
        corepack enable

        # NOTE - MP - 2022-04-22 - Support for ranges got removed, so we have to update to an exact version.
        log "Updating yarn to version $DESIRED_YARN_VERSION.0…"

        yarn set version $DESIRED_YARN_VERSION.0

        yarn_version="$(yarn -v)"
        if [[ "$yarn_version" != "$DESIRED_YARN_VERSION"* ]]; then
            logerror "We expected Yarn 3.2.0, we got $yarn_version."
        fi
    fi

    loggood "Yarn version: $yarn_version"

    if ! grep -F 'nodeLinker: node-modules' .yarnrc.yml > /dev/null; then
        log "Setting yarn nodeLinker to node-modules mode."
        echo 'nodeLinker: node-modules' >> .yarnrc.yml
    fi
}

setup_config() {
    log "Checking whether configEnv.json exists.."

    if [ ! -f frontend/configEnv.json ]; then
        log "cp frontend/configEnv.json.sample frontend/configEnv.json ..."
        cp frontend/configEnv.json.sample frontend/configEnv.json && \
            loggood "ok" || \
            logerror "Failed to copy the configuration."
    else
        log "configEnv.json already exists."
    fi
}

yarn_install() {
    log "Running yarn install…"
    yarn install
}

debian_install                && \
test_node_version > /dev/null && \
setup_yarn                    && \
setup_config                  && \
yarn_install                  && \
    loggood "Frontend dependencies are correctly installed." || \
    logerror "Something went wrong while installing the frontend dependencies."
