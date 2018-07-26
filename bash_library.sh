#!/bin/bash

BROWN='\033[0;33m'
NC='\033[0m' # No Color

function log {
    echo -e "\n${BROWN}>> $ $1${NC}\n"
}
