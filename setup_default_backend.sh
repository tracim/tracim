#!/usr/bin/bash
. bash_library.sh # source bash_library.sh

log "install base debian-packaged-dep for backend..."
sudo apt update
sudo apt install python3 python3-venv python3-dev python3-pip
sudo apt install redis-server

log "install deps for dealing with most preview..."
sudo apt install zlib1g-dev libjpeg-dev
sudo apt install imagemagick libmagickwand-dev ghostscript
sudo apt install libreoffice # most office documents file and text format
sudo apt install inkscape # for .svg files.

log "go to backend subdir.."
cd backend || exit 1;

log "setup python3 env.."
python3 -m venv env
source env/bin/activate
pip install --upgrade pip setuptools

log "install tracim-backend (sqlite_backend)..."
pip install -e ".[testing]"


log "configure tracim with default conf..."
cp development.ini.sample development.ini
cp wsgidav.conf.sample wsgidav.conf
tracimcli db init

log "backend of tracim was correctly set-up."