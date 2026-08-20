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

# Each app's mocha output is easy to read on its own, but with ~15 apps
# running one after another, finding which specific tests failed means
# scrolling back through all of it. Tee every app's output to its own log so
# a single aggregated "list of failed tests" can be printed at the very end.
logdir=$(mktemp -d)
failed_projects=()

for project in "$DEFAULTDIR/frontend_lib" "$DEFAULTDIR/frontend" "$DEFAULTDIR"/frontend_app*; do
    if ! [ -f "$project/.disabled-app" ]; then
        cd "$project" || exit 1
        projectlog="$logdir/$(basename "$project").log"
        yarn run test 2>&1 | tee "$projectlog"
        if [ "${PIPESTATUS[0]}" -eq 0 ]; then
            loggood "success"
        else
            logerror "Unit tests failed in $project"
            STATUS=1
            failed_projects+=("$project")
        fi
    fi
done

if [ "${#failed_projects[@]}" -gt 0 ]; then
    logerror "===== FAILED TESTS SUMMARY ====="
    for project in "${failed_projects[@]}"; do
        projectlog="$logdir/$(basename "$project").log"
        echo -e "\n${RED}$project${NC}"
        # Mocha prints failures as numbered blocks, e.g.:
        #   1) Suite
        #        test name:
        #      AssertionError: ...
        #       at ...
        # Keep the numbered header/title lines plus the one-line error, drop
        # the stack trace lines ("  at ..."). Colors are stripped first since
        # mocha emits ANSI codes at the start of these lines even when piped.
        sed -E 's/\x1b\[[0-9;]*m//g' "$projectlog" | awk '
            /^  [0-9]+\)/ { inblock=1 }
            inblock && /^ *at / { inblock=0; next }
            inblock { print }
        '
    done
fi

rm -rf "$logdir"

exit "$STATUS"
