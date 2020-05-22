#!/bin/bash
cd "$(dirname "$0")"; exec ../frontend/build_app.sh admin_workspace_user "$@"
