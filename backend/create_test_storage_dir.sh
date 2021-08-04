#!/usr/bin/env bash
# Create all test_storage_dir subtree needed for running test
DEFAULTDIR=$(realpath "${1-./test_storage_dir}")
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
}

function create_dir(){
    DIR_NAME=$1
    DIR_PATH=$2
    if [ ! -d "$DIR_PATH" ]; then
        log "create $DIR_NAME dir ..."
        mkdir $DIR_PATH && loggood "creation $DIR_NAME dir success" || logerror "failed to create $DIR_NAME dir ($DIR_PATH)"
    else
        loggood "$DIR_NAME dir ($DIR_PATH) already exist"
    fi
}

function create_require_dirs {
    log "create requires directories"
    create_dir "test_storage" $DEFAULTDIR
    create_dir "session" "$DEFAULTDIR/sessions"
    create_dir "sessions_data" "$DEFAULTDIR/sessions/sessions_data"
    create_dir "sessions_lock" "$DEFAULTDIR/sessions/sessions_lock"
    create_dir "depot" "$DEFAULTDIR/depot"
    create_dir "preview" "$DEFAULTDIR/previews"
    create_dir "radicale_storage" "$DEFAULTDIR/radicale_storage"
}

create_require_dirs
