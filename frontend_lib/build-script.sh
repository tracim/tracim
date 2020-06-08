#!/usr/bin/env bash

export NODE_ENV=production
PRODFLAG=-p
CONFIG=webpack.config.js
PRINT_TIME=true

while [ "$1" != "" ]; do
    case "$1" in
        tracim)
            CONFIG=webpack.tracim.config.js
        ;;

        dev)
            export NODE_ENV=
            PRODFLAG=false
            build "$PRODFLAG" "$CONFIG" && print_time
        ;;

        buildwithextvendors-dev)
            build "" webpack.tracim.config.js && print_time
        ;;

        *)
            2>&1 echo "Unknown parameter $1"
            exit 1
    esac
    shift
done

if [ "$PRODFLAG" = "true" ]; then
    webpack-cli -p --config "$CONFIG" || exit 1
else
    webpack-cli --config "$CONFIG" || exit 1
fi

if [ "$CONFIG" = "webpack.tracim.config.js" ]; then
    for i in lib style; do
        cp "./dist/tracim_frontend_lib.tracim.$i.js" "../frontend/dist/app/tracim_frontend_lib.$i.js" || exit 1
    done
fi

if [ "$PRINT_TIME" = "true" ] && [ "$VERBOSE" != "false" ]; then
    echo Script ended at $(date +'%H:%M:%S')
fi
