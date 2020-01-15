#!/usr/bin/env bash
# Create all test_storage_dir subtree needed for running test
DEFAULTDIR="./test_storage_dir"
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

function create_require_dirs {
      log "create requires directories"
   if [ ! -d "$DEFAULTDIR/" ]; then
     log "create test_storage_dir data dir ..."
     mkdir "$DEFAULTDIR" && loggood "creation test_storage_dir dir success" || logerror "failed to create session data dir"
   fi
    if [ ! -d "$DEFAULTDIR/sessions/" ]; then
     log "create session dir ..."
     mkdir "$DEFAULTDIR/sessions/" && loggood "creation session dir success" || logerror "failed to create session data dir"
   fi
   if [ ! -d "$DEFAULTDIR/sessions/sessions_data/" ]; then
     log "create session data dir ..."
     mkdir "$DEFAULTDIR/sessions/sessions_data/" && loggood "creation session data dir success" || logerror "failed to create session data dir"
   fi
   if [ ! -d "$DEFAULTDIR/sessions/sessions_lock/" ]; then
     log "create session lock dir ..."
     mkdir "$DEFAULTDIR/sessions/sessions_lock/" && loggood "creation session lock dir success" || logerror "failed to create session lock dir"
   fi
   if [ ! -d "$DEFAULTDIR/depot/" ]; then
     log "create depot dir ..."
     mkdir "$DEFAULTDIR/depot/" && loggood "creation depot dir success" || logerror "failed to create depot dir"
   fi
   if [ ! -d "$DEFAULTDIR/previews/" ]; then
     log "create preview dir ..."
     mkdir "$DEFAULTDIR/previews/" && loggood "creation preview dir success" || logerror "failed to create preview dir"
   fi
   if [ ! -d $DEFAULTDIR/radicale_storage ]; then
     log "create radicale storage dir ..."
     mkdir $DEFAULTDIR/radicale_storage && loggood "creation radicale storage dir success" || logerror "failed to create radicale storage dir"
   fi
}

create_require_dirs
