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

function create_dir(){
    DIR_NAME=$1
    DIR_PATH=$2
    if [ ! -d "$DIR_PATH" ]; then
        log "create $DIR_NAME dir ..."
        mkdir $DIR_PATH && loggood "creation $DIR_NAME dir success" || logerror "failed to create $DIR_NAME dir ($DIR_PATH)"
    else
        loggood "$DIR_NAME dir ($DIR_PATH) already exist"
    fi
}
# Function for backend

function install_backend_system_dep {
    log "install base debian-packaged-dep for backend..."
    $SUDO apt update
    PACKAGE_LIST='python3 python3-venv python3-dev python3-pip zlib1g-dev libjpeg-dev imagemagick libmagickwand-dev libpq-dev ghostscript libfile-mimeinfo-perl poppler-utils libimage-exiftool-perl qpdf libldap2-dev libsasl2-dev libreoffice inkscape ufraw-batch ffmpeg'
    $SUDO apt install -y $PACKAGE_LIST && loggood "$PACKAGE correctly installed" || logerror "failed to install $PACKAGE"
}

function setup_pyenv {
   log "setup python3 env and activate it.."
   python3 -m venv env && loggood "setup python3 env successfull" || logerror "failed to setup python3 env"
   source env/bin/activate && loggood "python3 env activated" || logerror "failed to activate python3 env"
}

function install_backend_python_packages {
    log "install pip and setuptools"
    pip install -r "requirements-build.txt" && loggood "install pip and setuptools success" || logerror "failed to install pip and setuptools"
    log "install dependencies from requirements.txt"
    pip install -r "requirements.txt" && loggood "install requirements.txt success" || logerror "failed to install requirements.txt"
    log "install tracim-backend (sqlite_backend)..."
    pip install -e "." && loggood "install tracim-backend (sqlite_backend) success" || logerror "failed to install tracim-backend (sqlite_backend)"
}

function setup_config_file {
    log "configure tracim with default conf..."
    if [ ! -f development.ini ]; then
        log "generate missing development.ini ..."
        cp development.ini.sample development.ini && loggood "copy default conf file success" || logerror "failed to copy default conf file"
    else
        loggood "development.ini exist"
    fi

    if [ ! -f ../color.json ]; then
        log "generate missing color.json ..."
        cp ../color.json.sample ../color.json && loggood "copy default color file success" || logerror "failed to copy default color file"
    else
        loggood "color.json exist"
    fi

    if [ -d "$DEFAULTDIR/backend/sessions_data/" ]; then
        log "remove folder \"sessions_data\" in \"$DEFAULTDIR/backend\" if exist"
        rm -R $DEFAULTDIR/backend/sessions_data/ && loggood "remove sessions_data folder success" || logerror "failed to remove sessions_data folder"
    else
        loggood "sessions_data folder not exist"
    fi

    if [ -d "$DEFAULTDIR/backend/sessions_lock/" ]; then
        log "remove folder \"sessions_lock\" in \"$DEFAULTDIR/backend\" if exist"
        rm -R $DEFAULTDIR/backend/sessions_lock/ && loggood "remove sessions_lock folder success" || logerror "failed to remove sessions_lock folder"
    else
        loggood "sessions_lock folder not exist"
    fi
}


function create_require_dirs {
    log "create requires directories"
    create_dir "sessions_data" "$DEFAULTDIR/backend/sessions_data"
    create_dir "sessions_lock" "$DEFAULTDIR/backend/sessions_lock"
    create_dir "depot" "$DEFAULTDIR/backend/depot"
    create_dir "preview" "$DEFAULTDIR/backend/previews"
    create_dir "radicale_storage" "$DEFAULTDIR/backend/radicale_storage"
}

function setup_db {
    log "check if database exist"
    result=$(alembic -c development.ini current)
    if [ $? -eq 0 ] && [ ! "$result" == '' ]; then
       loggood "database exist"
       log "database migration..."
       alembic -c development.ini upgrade head && loggood "alembic upgrade head success" || logerror "alembic upgrade head failed"
    else
       log "database seems missing, init it..."
       tracimcli db init && loggood "db init success" || logerror "db init error"
       alembic -c development.ini stamp head && loggood "alembic stamp head success" || logerror "alembic stamp head failed"
    fi
}

function install_npm_and_nodejs {
    log "verify if npm is installed"
    npm -v
    if [ $? -eq 0 ]; then
        loggood "npm \"$(npm -v)\" and node \"$(node -v)\" are installed"
    else
        log "npm not installed. Installing npm with nodejs"
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
            fi
        else
            logerror "nodejs 10.x and npm are not installed - you use node \"$(node -v)\" - Please re-install manually your version of nodejs - tracim install stopped"
        fi
    fi
}

function translate_email {
    log "install i18next-conv to translate email"
    $SUDO npm install "i18next-conv@<8" -g && loggood "install i18next-conv success" || logerror "failed to install i18next-conv"
    log "translate email"
    ./update_i18n_json_file.sh && loggood "translate email success" || logerror "failed to translate email"
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
create_require_dirs
setup_db
translate_email

# Return to "$DEFAULTDIR/"
log "cd $DEFAULTDIR"
cd $DEFAULTDIR || exit 1
