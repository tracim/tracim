#!/bin/bash

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
NC='\033[0m' # No Color

function log {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} >> $ $1${NC}\n"
}
