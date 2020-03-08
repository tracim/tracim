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

if ! npm -v > /dev/null; then
    log "npm not installed"
    log "install npm with nodejs"
    $SUDO apt install -y curl && loggood "install curl success" || logerror "failed to install curl"
    curl -sL https://deb.nodesource.com/setup_10.x | $SUDOCURL bash -
    $SUDO apt update
    $SUDO apt install -y nodejs && loggood "install nodejs success" || logerror "failed to install nodejs"
    log "verify if nodejs 10.x is now installed"
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

log "merging dependencies"
python3 mergefrontenddeps.py || logerror "Unable to merge the frontend dependencies. Please fix any conflict."
cd "$DEFAULTDIR/.frontend-apps-node-modules"
log "installing dependencies"
rm -f "node_modules/tracim_frontend_lib"
npm i --loglevel warn && loggood "success" || logerror "some error"

for project in "$DEFAULTDIR"/frontend_app_* "$DEFAULTDIR/frontend" "$DEFAULTDIR/frontend_lib"; do
	if ! [ -L "$project/node_modules" ]; then
		cd "$project"
		rm -rf "node_modules" # If it is a regular directory
		ln -s "../.frontend-apps-node-modules/node_modules"	 || exit 1
	fi
done


# Link the frontend Lib
if ! [ -e $DEFAULTDIR/.frontend-apps-node-modules/node_modules/tracim_frontend_lib ]; then
	cd "$DEFAULTDIR/.frontend-apps-node-modules/node_modules/"
	ln -s "../../frontend_lib" "tracim_frontend_lib"
fi

# Install the Tracim Frontend
log "cd $DEFAULTDIR/frontend"
cd $DEFAULTDIR/frontend  || exit 1
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
