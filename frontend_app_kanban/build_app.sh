#!/bin/bash

# Main in bottom

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

function log {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

function loggood {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

function logerror {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}


dev=""
only_utils=""

while [ "$#" -gt 0 ]; do
    case "$1" in
        -d|--development) dev=":dev" ;;
        -u|--only-utils) only_utils="--only-utils" ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

log "creating debug file if not already exists"
cp -u src/debug.js.sample src/debug.js
log "creating default props file for unit tests"
cp src/debug.js.sample test/fixture/defaultProps.js

if [ "$only_utils" != "--only-utils" ]; then
    log "building frontend_app_kanban"
    yarn run build:optimized$dev  && loggood "success" || logerror "some error"
    log "copying built kanban to frontend/"
    cp dist/kanban.app.optimized.js ../frontend/dist/app/kanban.app.optimized.js && loggood "success" || logerror "some error"
fi

for lang in en fr pt de; do
    cp i18next.scanner/${lang}/translation.json ../frontend/dist/app/kanban_${lang}_translation.json && loggood "success" || logerror "some error"
done
