#!/bin/sh
set -e
tracim_version=$1
container_dir=$2

echo "Setting TRACIM version to ${tracim_version}"
sed -i "s|^version = 0000.00.00|version = v${tracim_version}|g" ${container_dir}/backend/setup.cfg
sed -i "s|\"tracim_app_version\": \"v0000.00.00\"|\"tracim_app_version\": \"v${tracim_version}\"|g" ${container_dir}/frontend/src/version.json
