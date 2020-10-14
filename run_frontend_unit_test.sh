#!/bin/bash

# Main in bottom

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color
STATUS=0

function log {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

function loggood {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

function logerror {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
}

DEFAULTDIR=$(pwd)
export DEFAULTDIR
echo "This is DEFAULTDIR \"$DEFAULTDIR\""

for project in "$DEFAULTDIR/frontend_lib" "$DEFAULTDIR/frontend" "$DEFAULTDIR"/frontend_app*; do
    if ! [ -f "$project/.disabled-app" ]; then
        cd "$project" || exit 1
        yarn run lint || { logerror "There are linting errors in $project"; STATUS=1; }
        yarn run test && loggood "success" || { logerror "Unit tests failed in $project"; STATUS=1; }
    fi
done

exit "$STATUS"
