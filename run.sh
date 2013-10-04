#!/bin/bash

OLD_PATH=`pwd`

ROOT_FOLDER=/home/daccorsi/sources/protos/pboard

cd ${ROOT_FOLDER}
source tg2env/bin/activate
cd ${ROOT_FOLDER}/pboard/
gearbox serve -c development.ini --reload
cd ${OLD_PATH}

