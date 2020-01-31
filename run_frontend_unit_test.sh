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

cd $DEFAULTDIR/frontend_lib || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_html-document || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_file || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_collaborative_document_edition || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_thread || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_folder_advanced || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_workspace || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_workspace_advanced || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_agenda || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_gallery || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

cd $DEFAULTDIR/frontend_app_admin_workspace_user || exit 1
npm run test && loggood "success" || (logerror "some error" && STATUS=1)

log "cd $DEFAULTDIR"
cd $DEFAULTDIR || exit 1

if [ "$STATUS" == 0 ]; then
	exit 0
else
	exit 1
fi
