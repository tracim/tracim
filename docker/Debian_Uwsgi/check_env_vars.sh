#!/usr/bin/env bash

# Ensure DATABASE_TYPE is set
if ! [ -n "$DATABASE_TYPE" ]; then
    echo "You must set DATABASE_TYPE environment variable"
    exit 1
fi

# Ensure DATABASE_TYPE value
case "$DATABASE_TYPE" in
    postgresql|mysql|sqlite) ;;
    *) echo "DATABASE_TYPE environment variable must be one of these: \
postgresql, mysql, sqlite" ;;
esac

# MySQL case
if [ "$DATABASE_TYPE" = mysql ] ; then
    #
fi
