#!/bin/bash

OLD_PATH=`pwd`

POD_BIN_PATH=`dirname $0`
POD_INSTALL_PATH=`dirname ${POD_BIN_PATH}`
POD_INSTALL_FULL_PATH=`realpath ${POD_INSTALL_PATH}`

ROOT_FOLDER=${POD_INSTALL_FULL_PATH}

cd ${ROOT_FOLDER}
source tg2env/bin/activate
cd ${ROOT_FOLDER}/pod/
gearbox serve -c development.ini --reload --debug
cd ${OLD_PATH}

