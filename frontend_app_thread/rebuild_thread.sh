#!/bin/bash

. ../bash_library.sh # source bash_library.sh

windoz=""
if  [[ $1 = "-w" ]]; then
    windoz="windoz"
fi

log "npm run build$windoz"
npm run build$windoz
log "cp dist/thread.app.js ../frontend/dist/app"
cp dist/thread.app.js ../frontend/dist/app
