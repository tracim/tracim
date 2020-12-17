#!/usr/bin/env bash
function check_param(){
    name=$1
    value=$2
    if ! [ -n "$value" ]; then
        echo "You must set $name environment variable"
        exit 1
    fi
}
# Ensure DATABASE_TYPE is set
check_param "DATABASE_TYPE" $DATABASE_TYPE
if ! [ "$DATABASE_TYPE" = sqlite ]; then
    # Ensure DATABASE_USER is set
    check_param "DATABASE_USER" $DATABASE_USER
    check_param "DATABASE_PASSWORD" $DATABASE_PASSWORD
    check_param "DATABASE_HOST" $DATABASE_HOST
    check_param "DATABASE_NAME" $DATABASE_NAME
    # Ensure DATABASE_TYPE value
    case "$DATABASE_TYPE" in
        postgresql|mysql|sqlite) ;;
        *) echo "DATABASE_TYPE environment variable must be one of these: \
    postgresql, mysql, sqlite" ;;
    esac
fi

if [ "$ENABLE_GOCRYPTFS_ENCRYPTION" = "1" ]; then
    check_param "GOCRYPTFS_PASSWORD_PATH" $GOCRYPTFS_PASSWORD_PATH
    check_param "GOCRYPTFS_PREVIEW_STORAGE_DIR" $GOCRYPTFS_PREVIEW_STORAGE_DIR
    check_param "GOCRYPTFS_UPLOADED_FILES_STORAGE_DIR" $GOCRYPTFS_UPLOADED_FILES_STORAGE_DIR
    check_param "TRACIM_PREVIEW_CACHE_DIR" $TRACIM_PREVIEW_CACHE_DIR
    check_param "TRACIM_DEPOT_STORAGE_DIR" $TRACIM_DEPOT_STORAGE_DIR
fi
