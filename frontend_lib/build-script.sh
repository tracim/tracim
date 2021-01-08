#!/usr/bin/env bash

export NODE_ENV=production
PRODUCTION=true
CONFIG=webpack.config.js

while [ "$1" != "" ]; do
    case "$1" in
        optimized)
            CONFIG=webpack.optimized.config.js
        ;;

        dev)
            PRODUCTION=false
        ;;

        *)
            >&2 echo "Unknown parameter $1"
            exit 1
    esac
    shift
done

if [ "$PRODUCTION" = "true" ]; then
    devext=""
    NODE_ENV=production webpack-cli --config "$CONFIG" || exit 1
else
    devext=".dev"
    NODE_ENV=development webpack-cli --config "$CONFIG" || exit 1
fi

if [ "$CONFIG" = "webpack.optimized.config.js" ]; then
    for i in lib style; do
        cp "./dist/tracim_frontend_lib.tracim.$i$devext.js" "../frontend/dist/app/tracim_frontend_lib.$i.js" || exit 1
    done
fi

echo "Script ended at $(date +'%H:%M:%S')"
