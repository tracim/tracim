. bash_library.sh # source bash_library.sh

function install_backend_system_dep {
    log "install base debian-packaged-dep for backend..."
    sudo apt update
    sudo apt install -y python3 python3-venv python3-dev python3-pip
    sudo apt install -y redis-server

    log "install deps for dealing with most preview..."
    sudo apt install -y zlib1g-dev libjpeg-dev
    sudo apt install -y imagemagick libmagickwand-dev ghostscript
    sudo apt install -y libreoffice # most office documents file and text format
    sudo apt install -y inkscape # for .svg files.
}

function setup_pyenv {
   log "setup python3 env.."
   python3 -m venv env
   source env/bin/activate
}

function install_backend_python_packages {
    pip install --upgrade pip setuptools

    log "install tracim-backend (sqlite_backend)..."
    pip install -e ".[testing]"
}

function setup_config_file {
    log "configure tracim with default conf..."
    if [ ! -f development.ini ]; then
       log "generate missing development.ini ..."
       cp development.ini.sample development.ini
    fi

    if [ ! -f wsgidav.conf ]; then
       log "generate missing wsgidav.conf ..."
       cp wsgidav.conf.sample wsgidav.conf
    fi
}

function setup_db {
    result=$(alembic -c development.ini current)
    if [ $? -eq 0 ] && [ ! "$result" == '' ]; then
       log "check database migration..."
       alembic -c development.ini upgrade head
    else
       log "database seems missing, init it..."
       tracimcli db init
       alembic -c development.ini stamp head
    fi
}
