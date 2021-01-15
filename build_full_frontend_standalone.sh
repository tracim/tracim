#!/bin/bash

# Main in bottom

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

log() {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
}

loggood() {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
}

logerror() {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}

dev=""
if [ "$1" = "dev" ]; then
    dev="-dev"
fi

echo -e "\n${BROWN}/!\ ${NC}this script does not run 'yarn install'\n${BROWN}/!\ ${NC}"

DEFAULTDIR=$(pwd)
export DEFAULTDIR

# create folder $DEFAULTDIR/frontend/dist/app/ if no exists
mkdir -p $DEFAULTDIR/frontend/dist/app/ || logerror "Failed to make directory $DEFAULTDIR/frontend/dist/app/"

log "Building tracim_frontend_lib for tests"
yarn workspace tracim_frontend_lib run build$dev && loggood "success" || logerror "Could not build tracim_frontend_lib"


cd "$DEFAULTDIR/frontend_app_file" || exit
log "Building standalone tracim_frontend_file"
rm -f /dist/file.app.standalone.js
rm -f ../frontend/dist/app/file.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_file"
yarn run build$dev
cp dist/file.app.standalone.js ../frontend/dist/app/file.app.standalone.js || logerror "Error: could not cp app tracim_frontend_file"


cd "$DEFAULTDIR/frontend_app_html-document" || exit
log "Building standalone tracim_frontend_html-document"
rm -f /dist/html-document.app.standalone.js
rm -f ../frontend/dist/app/html-document.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app html-document"
yarn run build$dev
cp dist/html-document.app.standalone.js ../frontend/dist/app/html-document.app.standalone.js || logerror "Error: could not cp app html-document"


cd "$DEFAULTDIR/frontend_app_thread" || exit
log "Building standalone tracim_frontend_thread"
rm -f /dist/thread.app.standalone.js
rm -f ../frontend/dist/app/thread.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_thread"
yarn run build$dev
cp dist/thread.app.standalone.js ../frontend/dist/app/thread.app.standalone.js || logerror "Error: could not cp app tracim_frontend_thread"


cd "$DEFAULTDIR/frontend_app_collaborative_document_edition" || exit
log "Building standalone tracim_frontend_collaborative_document_edition"
rm -f /dist/collaborative_document_edition.app.standalone.js
rm -f ../frontend/dist/app/collaborative_document_edition.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_collaborative_document_edition"
yarn run build$dev
cp dist/collaborative_document_edition.app.standalone.js ../frontend/dist/app/collaborative_document_edition.app.standalone.js || logerror "Error: could not cp app tracim_frontend_collaborative_document_edition"


cd "$DEFAULTDIR/frontend_app_folder_advanced" || exit
log "Building standalone tracim_frontend_folder_advanced"
rm -f /dist/folder.app.standalone.js
rm -f ../frontend/dist/app/folder.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_folder_advanced"
yarn run build$dev
cp dist/folder.app.standalone.js ../frontend/dist/app/folder.app.standalone.js || logerror "Error: could not cp app tracim_frontend_folder_advanced"


cd "$DEFAULTDIR/frontend_app_share_folder_advanced" || exit
log "Building standalone tracim_frontend_share_folder_advanced"
rm -f /dist/share_folder.app.standalone.js
rm -f ../frontend/dist/app/share_folder.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_share_folder_advanced"
yarn run build$dev
cp dist/share_folder.app.standalone.js ../frontend/dist/app/share_folder.app.standalone.js || logerror "Error: could not cp app tracim_frontend_share_folder_advanced"


cd "$DEFAULTDIR/frontend_app_workspace" || exit
log "Building standalone tracim_frontend_workspace"
rm -f /dist/workspace.app.standalone.js
rm -f ../frontend/dist/app/workspace.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_workspace"
yarn run build$dev
cp dist/workspace.app.standalone.js ../frontend/dist/app/workspace.app.standalone.js || logerror "Error: could not cp app tracim_frontend_workspace"


cd "$DEFAULTDIR/frontend_app_workspace_advanced" || exit
log "Building standalone tracim_frontend_workspace_advanced"
rm -f /dist/workspace_advanced.app.standalone.js
rm -f ../frontend/dist/app/workspace_advanced.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_workspace_advanced"
yarn run build$dev
cp dist/workspace_advanced.app.standalone.js ../frontend/dist/app/workspace_advanced.app.standalone.js || logerror "Error: could not cp app tracim_frontend_workspace_advanced"


cd "$DEFAULTDIR/frontend_app_admin_workspace_user" || exit
log "Building standalone tracim_frontend_admin_workspace_user"
rm -f /dist/admin_workspace_user.app.standalone.js
rm -f ../frontend/dist/app/admin_workspace_user.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_admin_workspace_user"
yarn run build$dev
cp dist/admin_workspace_user.app.standalone.js ../frontend/dist/app/admin_workspace_user.app.standalone.js || logerror "Error: could not cp app tracim_frontend_admin_workspace_user"


cd "$DEFAULTDIR/frontend_app_agenda" || exit
log "Building standalone tracim_frontend_agenda"
rm -f /dist/agenda.app.standalone.js
rm -f ../frontend/dist/app/agenda.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_agenda"
yarn run build$dev
cp dist/agenda.app.standalone.js ../frontend/dist/app/agenda.app.standalone.js || logerror "Error: could not cp app tracim_frontend_agenda"


cd "$DEFAULTDIR/frontend_app_collaborative_document_edition" || exit
log "Building standalone tracim_frontend_collaborative_document_edition"
rm -f /dist/collaborative_document_edition.app.standalone.js
rm -f ../frontend/dist/app/collaborative_document_edition.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_collaborative_document_edition"
yarn run build$dev
cp dist/collaborative_document_edition.app.standalone.js ../frontend/dist/app/collaborative_document_edition.app.standalone.js || logerror "Error: could not cp app tracim_frontend_collaborative_document_edition"


cd "$DEFAULTDIR/frontend_app_gallery" || exit
log "Building standalone tracim_frontend_gallery"
rm -f /dist/gallery.app.standalone.js
rm -f ../frontend/dist/app/gallery.app.standalone.js
cp --update ./src/debug.js.sample ./src/debug.js || logerror "Error: could cp debug.js.sample in app tracim_frontend_gallery"
yarn run build$dev
cp dist/gallery.app.standalone.js ../frontend/dist/app/gallery.app.standalone.js || logerror "Error: could not cp app tracim_frontend_gallery"

# build Tracim
log "building the Tracim frontend"
yarn workspace tracim run build$dev && loggood "success" || logerror "Could not build the Tracim frontend."

loggood "-- frontend build successful."
