#!/usr/bin/env bash

dev=""
if [ "$1" = "-d" ]; then
    dev=":dev"
fi

function log {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

yarn run build:optimized$dev || exit 1

log "creating webpack dev server index.dev.js if not exists"
cp -u src/index.dev.js.sample src/index.dev.js

for i in lib style; do
    cp "./dist/tracim_frontend_lib.optimized.$i.js" "../frontend/dist/app/tracim_frontend_lib.optimized.$i.js" || exit 1
done

echo "Script ended at $(date +'%H:%M:%S')"
