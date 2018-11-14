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

# Function for backend

function install_backend_system_dep {
    log "install base debian-packaged-dep for backend..."
    $SUDO apt update
    $SUDO apt install -y python3 python3-venv python3-dev python3-pip && loggood "success" || logerror "some error"
    $SUDO apt install -y redis-server && loggood "success" || logerror "some error"

    log "install deps for dealing with most preview..."
    $SUDO apt install -y zlib1g-dev libjpeg-dev && loggood "success" || logerror "some error"
    $SUDO apt install -y imagemagick libmagickwand-dev ghostscript libfile-mimeinfo-perl poppler-utils libimage-exiftool-perl && loggood "success" || logerror "some error"
    $SUDO apt install -y libreoffice && loggood "success" || logerror "some error" # most office documents file and text format
    $SUDO apt install -y inkscape && loggood "success" || logerror "some error" # for .svg files.
}

function setup_pyenv {
   log "setup python3 env.."
   python3 -m venv env && loggood "success" || logerror "some error"
   source env/bin/activate && loggood "success" || logerror "some error"
}

function install_backend_python_packages {
    log "install pip and setuptools"
    pip install --upgrade pip setuptools && loggood "success" || logerror "some error"
    log "install dependencies from requirements.txt"
    pip install -r "requirements.txt" && loggood "success" || logerror "some error"
    log "install tracim-backend (sqlite_backend)..."
    pip install -e ".[testing]" && loggood "success" || logerror "some error"
}

function setup_config_file {
    log "configure tracim with default conf..."
    if [ ! -f development.ini ]; then
       log "generate missing development.ini ..."
       cp development.ini.sample development.ini && loggood "success" || logerror "some error"
    fi

    if [ ! -f wsgidav.conf ]; then
       log "generate missing wsgidav.conf ..."
       cp wsgidav.conf.sample wsgidav.conf && loggood "success" || logerror "some error"
    fi

    if [ ! -f ../color.json ]; then
       log "generate missing color.json ..."
       cp ../color.json.sample ../color.json && loggood "success" || logerror "some error"
    fi

    if [ -d "$DEFAULTDIR/backend/sessions_data/" ]; then
        log "remove folder \"sessions_data\" in \"$DEFAULTDIR/backend\" if exist"
        rm -R $DEFAULTDIR/backend/sessions_data/ && loggood "success" || logerror "some error"
    fi

    if [ -d "$DEFAULTDIR/backend/sessions_lock/" ]; then
        log "remove folder \"sessions_lock\" in \"$DEFAULTDIR/backend\" if exist"
        rm -R $DEFAULTDIR/backend/sessions_lock/ && loggood "success" || logerror "some error"
    fi
}

function setup_db {
    log "check if bdd exist"
    result=$(alembic -c development.ini current)
    if [ $? -eq 0 ] && [ ! "$result" == '' ]; then
       log "check database migration..."
       alembic -c development.ini upgrade head && loggood "success" || logerror "some error"
    else
       log "database seems missing, init it..."
       tracimcli db init && loggood "success" || logerror "some error"
       alembic -c development.ini stamp head && loggood "success" || logerror "some error"
    fi
}

function install_npm_and_nodejs {
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
}

function translate_email {
    log "translate email"
    $SUDO npm install i18next-conv -g && loggood "success" || logerror "some error"
    ./update_i18n_json_file.sh
}

############################################

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
echo "This is DEFAULTDIR of tracim_v2 => \"$DEFAULTDIR\""

install_npm_and_nodejs
log "go to backend subdir.."
cd $DEFAULTDIR/backend  || exit 1
install_backend_system_dep
setup_pyenv
install_backend_python_packages
setup_config_file
setup_db
translate_email
loggood "backend of tracim was correctly set-up."


# Return to "$DEFAULTDIR/"
log "cd $DEFAULTDIR"
cd $DEFAULTDIR || exit 1

