#!/bin/bash
user="root"
command="npm install \
&& gulp prod"
echo "############################################################################"
echo "############################################################################"
echo "## "
echo "## UPDATE ----------"
echo "## "
echo "##" `date` Execute as $user: $command
echo "## "
echo "## "
echo "############################################################################"
if ! command -v npm >/dev/null; then
  echo ""
  echo "/!\ npm doesn't seem to be installed. Aborting."
  echo ""
  exit 1
fi
sudo -u $user -- bash -c "$command"
