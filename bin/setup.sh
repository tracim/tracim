#!/bin/bash

POD_BIN_PATH=`dirname $0`
POD_INSTALL_PATH=`dirname ${POD_BIN_PATH}`
POD_INSTALL_FULL_PATH=`realpath ${POD_INSTALL_PATH}`

echo $POD_BIN_PATH
echo $POD_INSTALL_PATH
echo $POD_INSTALL_FULL_PATH

OLD_PATH=`pwd`


cd ${POD_INSTALL_FULL_PATH}
# virtualenv tg2env
echo
echo "-------------------------"
echo "- initializes virtualenv"
echo "-------------------------"
echo "-> path:        tg2env/"
echo "-> interpreter: python3"
echo
echo
virtualenv -p /usr/bin/python3 tg2env

echo
echo
echo "-------------------------"
echo "- activates virtualenv"
echo "-------------------------"
source tg2env/bin/activate
echo
echo

echo
echo
echo "-------------------------"
echo "- installing turbogears"
echo "-------------------------"
pip install -f http://tg.gy/230 tg.devtools

echo
echo

echo
echo
echo "-------------------------"
echo "- setup project"
echo "-------------------------"
cd pboard/
python setup.py develop
echo
echo

echo
echo
echo "-------------------------"
echo "- install dependencies"
echo "-------------------------"
echo "-> psycopg2"
echo "-> pillow"
pip install psycopg2
pip install pillow
echo
echo

cd ${OLD_PATH}
