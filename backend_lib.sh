. bash_library.sh # source bash_library.sh

function install_backend_system_dep {
    log "install base debian-packaged-dep for backend..."
    sudo apt update
    sudo apt install -y python3 python3-venv python3-dev python3-pip && loggood "success" || logerror "some error"
    sudo apt install -y redis-server && loggood "success" || logerror "some error"

    log "install deps for dealing with most preview..."
    sudo apt install -y zlib1g-dev libjpeg-dev && loggood "success" || logerror "some error"
    sudo apt install -y imagemagick libmagickwand-dev ghostscript && loggood "success" || logerror "some error"
    sudo apt install -y libreoffice && loggood "success" || logerror "some error" # most office documents file and text format
    sudo apt install -y inkscape && loggood "success" || logerror "some error" # for .svg files.
}

function setup_pyenv {
   log "setup python3 env.."
   python3 -m venv env && loggood "success" || logerror "some error"
   source env/bin/activate
}

function install_backend_python_packages {
    pip install --upgrade pip setuptools && loggood "success" || logerror "some error"

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
}

function setup_db {
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
