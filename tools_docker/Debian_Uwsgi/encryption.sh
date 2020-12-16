#!/usr/bin/env bash

GOCRYPTFS_PREVIEW_STORAGE_DIR="/encrypted/preview"
TRACIM_PREVIEW_CACHE_DIR="/data/preview"
GOCRYPTFS_UPLOADED_FILES_STORAGE_DIR="/encrypted/uploaded"
GOCRYPTFS_PASSWORD_PATH="/encrypted/password.txt"
TRACIM_DEPOT_STORAGE_DIR="/data/uploaded"


encrypt_dir() {
    encrypted_dir=$1
    mounted_dir=$2
    passfile=$3
    if [ ! -d $encrypted_dir ]; then
        mkdir $encrypted_dir  || exit 1
        if [! -f "${encrypted_dir}/gocryptfs.conf" ]; then:
           gocryptfs -init --passfile $passfile $encrypted_dir  || exit 1
        fi
    fi
    if [ ! -d $mounted_dir ]; then
        mkdir $mounted_dir  || exit 1
    fi
    gocryptfs --passfile $passfile $encrypted_dir $mounted_dir  || exit 1
}


encrypt_dir $GOCRYPTFS_PREVIEW_STORAGE_DIR $TRACIM_PREVIEW_CACHE_DIR $GOCRYPTFS_PASSWORD_PATH
encrypt_dir $GOCRYPTFS_UPLOADED_FILES_STORAGE_DIR $TRACIM_DEPOT_STORAGE_DIR $GOCRYPTFS_PASSWORD_PATH
