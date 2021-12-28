#!/usr/bin/env bash

dev=""
if [ "$1" = "-d" ]; then
    dev=":dev"
fi

yarn run build:optimized$dev || exit 1

for i in lib style; do
    cp "./dist/tracim_frontend_lib.optimized.$i.js" "../frontend/dist/app/tracim_frontend_lib.optimized.$i.js" || exit 1
done

echo "Script ended at $(date +'%H:%M:%S')"
