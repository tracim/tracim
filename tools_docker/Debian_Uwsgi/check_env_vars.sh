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
