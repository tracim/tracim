#!/bin/bash
. bash_library.sh # source bash_library.sh

# install nodjs if not installed

(
  log "Verify if nodjs is installed."
  dpkg -l | grep '^ii' | grep 'nodejs\s'

  if [ $? -eq 0 ]; then
    loggood "nodejs is installed."
  else
    log "Install nodejs"
    sudo apt update
    sudo apt install -y curl
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt install -y nodejs
    loggood "nodejs is now installed."
  fi
)

# install Cypress
log "Go to functionnal_tests subdir.."
cd  functionnal_tests || exit 1;
(
  ACTUALDIR=$(pwd)
  loggood "Your are now here: \"$ACTUALDIR\""
  log "Check if package.json exist."
  if [ ! -f package.json ]; then
    log "package.json not exist => run npm init"
    npm init -y
    loggood "npm init finished => package.json is now created."
  else
    loggood "package.json exist."
  fi
  log "Install cypress."
  sudo apt update
  sudo apt install -y xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 
  npm install cypress --save-dev
  loggood "Cypress is now installed."
)

# modify cypress.json

(
  log "Check if cypress.json exist."
  if [ ! -f cypress.json ]; then
    log "cypress.json not exist => copy from cypress.json.sample"
    cp cypress.json.sample cypress.json
    loggood "cypress.json is now available."
    log "Write path in cypress.json"
    SUBDIR=$(pwd)
    sed -i "s|{path_test_file}|$SUBDIR/cypress_test|g" cypress.json
    loggood "Path is now configured."
  else
  log "cypress.json exist => check if integrationFolder have path."
    if grep -q "\"integrationFolder\"\:\s\"{path_test_file}\"" cypress.json ; then
      log "No path => write path in cypress.json"
      SUBDIR=$(pwd)
      sed -i "s|{path_test_file}|$SUBDIR|g" cypress.json
      loggood "Path is now configured."
    else
      loggood "Path exist. Modify manualy if necessary."
    fi
  fi
)
