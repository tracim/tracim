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
    # INFO - CH - 2025-04-09 - Remove generated files related to wasm libraries for
    # frontend_app_file/src/component/PointCloudViewer/PointCloudViewer.jsx
    rm ../frontend/dist/app/*.module.wasm
    rm ../frontend/dist/app/node_modules_web-e57_e57_js.file.app.optimized.js
    rm ../frontend/dist/app/vendors-node_modules_three_examples_jsm_controls_OrbitControls_js.file.app.optimized.js
    rm dist/*.module.wasm
    rm dist/node_modules_web-e57_e57_js.file.app.optimized.js
    rm dist/vendors-node_modules_three_examples_jsm_controls_OrbitControls_js.file.app.optimized.js

    log "building frontend_app_file"
    yarn run build:optimized$dev  && loggood "success" || logerror "some error"
    log "copying built file to frontend/"
    cp dist/file.app.optimized.js ../frontend/dist/app/file.app.optimized.js && loggood "success" || logerror "some error"

    cp dist/*.module.wasm ../frontend/dist/app/
    cp dist/node_modules_web-e57_e57_js.file.app.optimized.js ../frontend/dist/app/
    cp dist/vendors-node_modules_three_examples_jsm_controls_OrbitControls_js.file.app.optimized.js ../frontend/dist/app/
fi

for lang in $(ls i18next.scanner); do
    log "copying ${lang}/translation.json"
    cp i18next.scanner/"${lang}"/translation.json ../frontend/dist/app/file_"${lang}"_translation.json && loggood "success" || logerror "some error"
done
