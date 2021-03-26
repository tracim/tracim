#!/bin/bash

# Main in bottom

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

function log {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

function loggood {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

function logerror {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
}

##################################################################

for filename in ./tracim_backend/locale/*/ ; do
    basename=$(basename "$filename")

    i18next-conv -l $filename -s tracim_backend/locale/$basename/LC_MESSAGES/tracim_backend.po -t tracim_backend/locale/$basename/backend.json && loggood "Successfully translated $filename" || logerror "Failed to translate $filename"
done
