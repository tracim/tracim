#!/usr/bin/env bash

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

TRACIM_USER='www-data'

function log {
    if [ "$DEBUG" = "1" ]; then
        echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
    fi
}

function loggood {
    if [ "$DEBUG" = "1" ]; then
        echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
    fi
}

function logerror {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}


function as_user {
    su $TRACIM_USER -s "/bin/bash" -c "$1"
}
function encrypt_dir() {
    encrypted_dir=$1
    mounted_dir=$2
    passfile=$3
    if [ ! -d "$encrypted_dir" ]; then
        mkdir "$encrypted_dir"  || exit 1
        chown $TRACIM_USER:$TRACIM_USER "$encrypted_dir"
        chmod 775 "$encrypted_dir"
    fi
    if [ ! -d "$mounted_dir" ]; then
        mkdir "$mounted_dir"  || exit 1
        chown $TRACIM_USER:$TRACIM_USER "$mounted_dir"
        chmod 775 "$mounted_dir"
    fi
    if [ ! -f "${encrypted_dir}/gocryptfs.conf" ]; then
        log "initialize encrypted dir in $encrypted_dir"
        as_user "gocryptfs -init -q --nosyslog --passfile '$passfile' '$encrypted_dir'"
        loggood "initialized encrypted_dir dir in $encrypted_dir"
    fi
    log "mount encrypted dir $encrypted_dir at $mounted_dir"
    as_user "gocryptfs -q --nosyslog --passfile '$passfile' '$encrypted_dir' '$mounted_dir'"
    loggood "mounted encrypted dir $encrypted_dir at $mounted_dir"
}
chown $TRACIM_USER:$TRACIM_USER $GOCRYPTFS_PASSWORD_PATH
chmod 400 $GOCRYPTFS_PASSWORD_PATH

encrypt_dir "$GOCRYPTFS_UPLOADED_FILES_STORAGE_DIR" "$TRACIM_DEPOT_STORAGE_DIR" "$GOCRYPTFS_PASSWORD_PATH"
encrypt_dir "$GOCRYPTFS_PREVIEW_STORAGE_DIR" "$TRACIM_PREVIEW_CACHE_DIR" "$GOCRYPTFS_PASSWORD_PATH"
