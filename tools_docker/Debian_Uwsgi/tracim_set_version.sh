#!/bin/sh
set -e
tracim_version=$1

echo "Setting TRACIM version to ${tracim_version}"
sed -i "s/version\s*=\s*0000.00.00/version = v${tracim_version}/" /tracim/backend/setup.cfg
sed -i "s/\"tracim_app_version\": \"v0000.00.00\"/\"tracim_app_version\": \"v${tracim_version}\"/" /tracim/frontend/src/version.json
