#!/bin/bash

for filename in ./tracim_backend/locale/*/ ; do
    basename=$(basename "$filename")

    i18next-conv -l $filename -s tracim_backend/locale/$basename/LC_MESSAGES/tracim_backend.po -t tracim_backend/locale/$basename/backend.json
done