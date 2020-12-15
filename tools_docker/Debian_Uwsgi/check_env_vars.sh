#!/usr/bin/env bash

# Ensure DATABASE_TYPE is set
if ! [ -n "$DATABASE_TYPE" ]; then
    echo "You must set DATABASE_TYPE environment variable"
    exit 1
fi

if ! [ "$DATABASE_TYPE" = sqlite ]; then
    # Ensure DATABASE_USER is set
    if ! [ -n "$DATABASE_USER" ]; then
        echo "You must set DATABASE_USER environment variable"
        exit 1
    fi

    # Ensure DATABASE_PASSWORD is set
    if ! [ -n "$DATABASE_PASSWORD" ]; then
        echo "You must set DATABASE_PASSWORD environment variable"
        exit 1
    fi

    # Ensure DATABASE_HOST is set
    if ! [ -n "$DATABASE_HOST" ]; then
        echo "You must set DATABASE_HOST environment variable"
        exit 1
    fi

    # Ensure DATABASE_NAME is set
    if ! [ -n "$DATABASE_NAME" ]; then
        echo "You must set DATABASE_NAME environment variable"
        exit 1
    fi

    # Ensure DATABASE_TYPE value
    case "$DATABASE_TYPE" in
        postgresql|mysql|sqlite) ;;
        *) echo "DATABASE_TYPE environment variable must be one of these: \
    postgresql, mysql, sqlite" ;;
    esac
fi

if [ "$ENABLE_GOCRYPTFS_ENCRYPTION" = "1" ]; then
    if ! [ -n "GOCRYPTFS_PASSWORD_PATH"]; then
        echo "You must set GOCRYPTFS_PASSWORD_PATH environment variable"
        exit 1
    fi
    if ! [ -n "$GOCRYPTFS_PREVIEW_STORAGE_DIR"]; then
        echo "You must set GOCRYPTFS_PREVIEW_STORAGE_DIR environment variable"
        exit 1
    fi
    if ! [ -n "$GOCRYPTFS_UPLOADED_FILES_STORAGE_DIR"]; then
        echo "You must set GOCRYPTFS_UPLOADED_FILES_STORAGE_DIR environment variable"
        exit 1
    fi
    if ! [ -n "$TRACIM_PREVIEW_CACHE_DIR"]; then
        echo "You must set TRACIM_PREVIEW_CACHE_DIR environment variable"
        exit 1
    fi
    if ! [ -n "$TRACIM_DEPOT_STORAGE_DIR"]; then
        echo "You must set TRACIM_DEPOT_STORAGE_DIR environment variable"
        exit 1
    fi
fi
