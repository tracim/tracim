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
    PACKAGE_LIST='python3 python3-venv python3-dev python3-pip redis-server zlib1g-dev libjpeg-dev imagemagick libmagickwand-dev libpq-dev ghostscript libfile-mimeinfo-perl poppler-utils libimage-exiftool-perl qpdf libldap2-dev libsasl2-dev libreoffice inkscape'
    for PACKAGE in $PACKAGE_LIST
    do
        $SUDO apt install -y $PACKAGE && loggood "$PACKAGE correctly installed" || logerror "failed to install $PACKAGE"
    done
}

function setup_pyenv {
   log "setup python3 env.."
   python3 -m venv env && loggood "setup python3 env successfull" || logerror "problem to setup python3 env"
   source env/bin/activate && loggood "python3 env activated" || logerror "problem to activate python3 env"
}

function install_backend_python_packages {
    log "install pip and setuptools"
    pip install --upgrade pip setuptools && loggood "install success" || logerror "install error"
    log "install dependencies from requirements.txt"
    pip install -r "requirements.txt" && loggood "install success" || logerror "install error"
    log "install tracim-backend (sqlite_backend)..."
    pip install -e ".[testing]" && loggood "install success" || logerror "install error"
}

function setup_config_file {
    log "configure tracim with default conf..."
    if [ ! -f development.ini ]; then
       log "generate missing development.ini ..."
       cp development.ini.sample development.ini && loggood "copy file success" || logerror "copy file error"
    fi

    if [ ! -f ../color.json ]; then
       log "generate missing color.json ..."
       cp ../color.json.sample ../color.json && loggood "copy file success" || logerror "copy file error"
    fi

    if [ -d "$DEFAULTDIR/backend/sessions_data/" ]; then
        log "remove folder \"sessions_data\" in \"$DEFAULTDIR/backend\" if exist"
        rm -R $DEFAULTDIR/backend/sessions_data/ && loggood "remove success" || logerror "remove error"
    fi

    if [ -d "$DEFAULTDIR/backend/sessions_lock/" ]; then
        log "remove folder \"sessions_lock\" in \"$DEFAULTDIR/backend\" if exist"
        rm -R $DEFAULTDIR/backend/sessions_lock/ && loggood "remove success" || logerror "remove error"
    fi
}

function setup_db {
    log "check if bdd exist"
    result=$(alembic -c development.ini current)
    if [ $? -eq 0 ] && [ ! "$result" == '' ]; then
       log "check database migration..."
       alembic -c development.ini upgrade head && loggood "alembic upgrade success" || logerror "alembic upgrade error"
    else
       log "database seems missing, init it..."
       tracimcli db init && loggood "db init success" || logerror "db init error"
       alembic -c development.ini stamp head && loggood "alembic stamp success" || logerror "alembic stamp error"
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
        $SUDO apt install -y curl && loggood "install curl success" || logerror "error to install curl"
        curl -sL https://deb.nodesource.com/setup_8.x | $SUDOCURL bash -
        $SUDO apt update
        $SUDO apt install -y nodejs && loggood "install nodejs success" || logerror "error to install nodejs"
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
    $SUDO npm install i18next-conv -g && loggood "install i18next-conv success" || logerror "error to install i18next-conv"
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
echo "DEFAULTDIR of tracim => \"$DEFAULTDIR\""

install_npm_and_nodejs
log "go to backend subdir.."
cd $DEFAULTDIR/backend  || exit 1
install_backend_system_dep
setup_pyenv
install_backend_python_packages
setup_config_file
setup_db
translate_email

# Return to "$DEFAULTDIR/"
log "cd $DEFAULTDIR"
cd $DEFAULTDIR || exit 1

