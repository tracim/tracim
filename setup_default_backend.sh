#!/bin/bash

script_dir=$(realpath $(dirname "$0"))
DEFAULTDIR=${DEFAULTDIR:-$script_dir}

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
        log "Creating the $DIR_NAME folder..."
        mkdir $DIR_PATH && loggood "Successfully created the $DIR_NAME folder" || logerror "Failed to create the $DIR_NAME folder ($DIR_PATH)"
    else
        loggood "Folder $DIR_NAME ($DIR_PATH) already exists"
    fi
}
# Function for backend

function install_backend_system_dep {
    log "Installing system package dependencies for the backend..."
    system_package_dir="$script_dir/system_packages/debian/"
    $SUDO apt update
    if [ -z "$IGNORE_FULL_PREVIEW_GENERATOR" ]; then
        log "add optional preview dependencies to the list of package to install..."
        PACKAGE_LIST=$(cat "${system_package_dir}/build_backend_packages.list" "${system_package_dir}/run_backend_packages.list" "${system_package_dir}/optional_preview_packages.list")
    else
        PACKAGE_LIST=$(cat "${system_package_dir}/build_backend_packages.list" "${system_package_dir}/run_backend_packages.list")
    fi
    $SUDO apt install -y $PACKAGE_LIST && loggood "$PACKAGE correctly installed" || logerror "failed to install $PACKAGE"
}

function setup_pyenv {
   log "Setting up the python3 virtual environment..."
   python3 -m venv env && loggood "Successfully created the python3 virtual environment" || logerror "Failed to setup the python3 virtual environment"
   source env/bin/activate && loggood "python3 env activated" || logerror "Failed to activate the python3 virtual environment"
}

function install_backend_python_packages {
    log "Installing pip and setuptools..."
    pip install -r "requirements-build.txt" && loggood "Successfully installed pip and setuptools" || logerror "Failed to install pip and setuptools"
    log "Installing dependencies from requirements.txt..."
    pip install -r "requirements.txt" && loggood "Successfully installed the dependencies in requirements.txt" || logerror "Failed to install dependencies in requirements.txt"
    if [ -z "$IGNORE_FULL_PREVIEW_GENERATOR" ]; then
        log "Installing all preview dependencies from requirements-full-preview-generator.txt"
        pip install -r "requirements-full-preview-generator.txt"  && loggood "Successfully installed the dependencies in requirements-full-preview-generator.txt" || logerror "Failed to install dependencies in requirements-full-preview-generator.txt"
    fi
    log "Installing the Tracim backend (sqlite_backend)..."
    pip install -e "." && loggood "Successfully installed the Tracim backend (sqlite_backend)" || logerror "Failed to install the Tracim backend (sqlite_backend)"
}

function setup_config_file {
    log "Configuring Tracim with the default configuration..."
    if [ ! -f development.ini ]; then
        log "Creating development.ini ..."
        cp development.ini.sample development.ini && loggood "Successfully created the default configuration" || logerror "Failed to copy the default configuration file"
    else
        loggood "development.ini already exists"
    fi

    if [ ! -d ../frontend/dist/assets/branding ]; then
        log "Creating default branding folder ..."
        cp -r ../frontend/dist/assets/branding.sample ../frontend/dist/assets/branding && loggood "Successfully created default branding folder" || logerror "Failed to create default branding folder"
    else
        loggood "branding folder already exists"
    fi

    if [ -d "$DEFAULTDIR/backend/sessions_data/" ]; then
        log "Removing folder 'sessions_data' in '$DEFAULTDIR/backend'"
        rm -R $DEFAULTDIR/backend/sessions_data/ && loggood "Successfully removed the sessions_data folder" || logerror "Failed to remove the sessions_data folder"
    else
        loggood "The sessions_data folder does not exist"
    fi

    if [ -d "$DEFAULTDIR/backend/sessions_lock/" ]; then
        log "Remove folder 'sessions_lock' in '$DEFAULTDIR/backend'"
        rm -R $DEFAULTDIR/backend/sessions_lock/ && loggood "Successfully removed the sessions_lock folder" || logerror "Failed to remove the sessions_lock folder"
    else
        loggood "The sessions_lock folder does not exist"
    fi
}


function create_require_dirs {
    log "Creating the required folders…"
    create_dir "sessions_data" "$DEFAULTDIR/backend/sessions_data"
    create_dir "sessions_lock" "$DEFAULTDIR/backend/sessions_lock"
    create_dir "depot" "$DEFAULTDIR/backend/depot"
    create_dir "preview" "$DEFAULTDIR/backend/previews"
    create_dir "radicale_storage" "$DEFAULTDIR/backend/radicale_storage"
}

function setup_db {
    log "Checking whether the database exists..."
    result=$(alembic -c development.ini current)
    if [ $? -eq 0 ] && [ ! "$result" == '' ]; then
       loggood "The database exists, migrating the database..."
       alembic -c development.ini upgrade head && loggood "Successfully ran alembic upgrade head" || logerror "Failed to run alembic upgrade head"
    else
       log "The database seems missing, initializing it..."
       tracimcli db init && loggood "Successfully initialized the database" || logerror "Failed to initialize the database"
    fi
}

function install_npm_and_nodejs {
    log "Checking whether npm is installed"

    NPM_VERSION="$(npm -v 2> /dev/null)"

    if [ "$?" = "0" ]; then
        loggood "npm $NPM_VERSION is installed"
    else
        if [ -n "$IGNORE_APT_INSTALL" ]; then
            log "npm not installed. Please install it."
            exit 1
        fi

        log "Installing npm..."
        $SUDO apt update
        $SUDO apt install -y curl && loggood "Successfully installed curl" || logerror "Failed to install curl"
        curl -sL https://deb.nodesource.com/setup_14.x | $SUDOCURL bash -
        $SUDO apt update
        $SUDO apt install -y nodejs && loggood "Successfully installed nodejs" || logerror "Failed to install nodejs"

        log "Checking whether Node 14+ is installed..."
        NODE_MAJOR_VERSION=$(node -v | sed -E 's/v([0-9]+)\..+/\1/g')
        if [ $? = "0" ]; then
            if  [ "$NODE_MAJOR_VERSION" -ge "14" ] ; then
                loggood "Node $NODE_MAJOR_VERSION is correctly installed"

                NPM_VERSION="$(npm -v 2> /dev/null)"

                if [ "$?" = "0" ]; then
                    loggood  "npm $NPM_VERSION is correctly installed"
                else
                    logerror "npm is not installed. Please install it"
                fi
            else
                logerror "Your version of Node ($(node -v)) is too old. Please upgrade it"
            fi
        fi
    fi
}

function translate_email {
    log "Installing i18next-conv to translate emails..."
    $SUDO npm install "i18next-conv@<8" -g && loggood "Successfully installed i18next-conv" || logerror "Failed to install i18next-conv"
    log "Translating emails..."
    ./update_i18n_json_file.sh || exit 1
}

############################################

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    SUDO=""
    SUDOCURL=""
else
    SUDO="sudo"
    SUDOCURL="sudo -E"
fi

install_npm_and_nodejs
cd "$script_dir/backend"  || exit 1
if [ -z "$IGNORE_APT_INSTALL" ]; then
    install_backend_system_dep
fi
if [ -z "$DONT_GENERATE_PYENV" ]; then
    setup_pyenv
fi
install_backend_python_packages
setup_config_file
create_require_dirs
setup_db
translate_email
