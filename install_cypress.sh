#!/bin/bash
. bash_library.sh # source bash_library.sh

# install nodjs if not installed

(
  log "verify if nodjs is installed"
  dpkg -l | grep '^ii' | grep 'nodejs\s'

  if [ $? -eq 0 ]; then
    log "nodjs is installed"
  else
    log "install nodejs"
    sudo apt install curl
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt install -y nodejs
  fi
)

# install Cypress

(
  log "go to functionnal_tests subdir.."
  cd  functionnal_tests || exit 1;
  log "check if package.json exist"
  if [ ! -f package.json ]; then
    log "run npm init"
    npm init -y
  fi
  log "install cypress"
  npm install cypress --save-dev
)

