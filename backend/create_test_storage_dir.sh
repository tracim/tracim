#!/usr/bin/env bash
# Create all test_storage_dir subtree needed for running test
TEST_STORAGE_DIR_NAME="test_storage_dir"
ORIGIN="."

mkdir $ORIGIN/$TEST_STORAGE_DIR_NAME
mkdir $ORIGIN/$TEST_STORAGE_DIR_NAME/depot
mkdir $ORIGIN/$TEST_STORAGE_DIR_NAME/previews
mkdir $ORIGIN/$TEST_STORAGE_DIR_NAME/radicale_storage
mkdir $ORIGIN/$TEST_STORAGE_DIR_NAME/sessions
mkdir $ORIGIN/$TEST_STORAGE_DIR_NAME/sessions/sessions_data
mkdir $ORIGIN/$TEST_STORAGE_DIR_NAME/sessions/sessions_lock
