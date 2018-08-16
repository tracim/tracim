#!/bin/bash
. bash_library.sh # source bash_library.sh
. backend_lib.sh # source backend_lib.sh

install_backend_system_deb

log "go to backend subdir.."
cd backend || exit 1;


install_backend_system_dep
setup_pyenv
install_backend_python_packages
setup_config_file
setup_db

log "backend of tracim was correctly set-up."