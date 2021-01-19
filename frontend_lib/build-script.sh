#!/usr/bin/env bash

CONFIG=webpack.config.js
BUILD_MODE=production

while [ "$1" != "" ]; do
    case "$1" in
        optimized)
            CONFIG=webpack.optimized.config.js
        ;;

        dev)
            BUILD_MODE=development
        ;;

        *)
            >&2 echo "Unknown parameter $1"
            exit 1
    esac
    shift
done

NODE_ENV="$BUILD_MODE" webpack-cli --config "$CONFIG" || exit 1

if [ $CONFIG = "webpack.optimized.config.js" ]; then
    for i in lib style; do
        cp "./dist/tracim_frontend_lib.optimized.$i.js" "../frontend/dist/app/tracim_frontend_lib.$i.js" || exit 1
    done
fi

echo "Script ended at $(date +'%H:%M:%S')"
