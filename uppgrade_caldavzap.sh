#!/usr/bin/env bash
read -p "Delete actual tracim/tracim/public/caldavzap folder? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    rm -r tracim/tracim/public/caldavzap
fi
git clone https://github.com/algoo/caldavzap.git tracim/tracim/public/caldavzap
rm -rf tracim/tracim/public/caldavzap/.git
