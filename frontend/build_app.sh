#!/usr/bin/env bash

RED='\033[1;31m'

APP_NAME=$1

logerror() {
    >&2 echo -e "\n${RED}[$(date +'%H:%M:%S')] $ App $APP_NAME - $1${NC}"
    exit 1
}

if [ -z "${APP_NAME+x}" ]; then
    APP_NAME="(missing app name)"
    logerror "Please give the name of an app in parameter"
fi

shift

dev=""
devext=""
if [ "$1" = "-d" ]; then
    dev="-dev"
    devext=".dev"
fi

if ! pwd | grep frontend_app | grep "$APP_NAME" > /dev/null; then
    logerror "This script must be run from the app's directory (pwd: $(pwd))"
fi

if [ -f src/debug.js.sample ]; then
    cp src/debug.js.sample src/debug.js || logerror "Could not copy the debug file"
fi

yarn run buildwithextvendors$dev || logerror "Build failed"

cp dist/$APP_NAME.app$devext.js ../frontend/dist/app/$APP_NAME.app.js || logerror "Failed copying the app"

for lang in en fr pt; do
    if [ -f "i18next.scanner/${lang}/translation.json" ]; then
        cp "i18next.scanner/${lang}/translation.json" "../frontend/dist/app/${APP_NAME}_${lang}_translation.json" || logerror "Failed copying translation ${lang}"
    fi
done
