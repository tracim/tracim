#!/usr/bin/env bash
DOC_DIR="/tmp/doc"
TRACIM_DIR=$PWD
PYTHON_ENV_DIR=$TRACIM_DIR/backend/env

mkdir $DOC_DIR
cd $DOC_DIR || exit 1
$PYTHON_ENV_DIR/bin/sphinx-quickstart -p "Tracim Backend" -a "Algoo" -v "2.5" -q --ext-autodoc --ext-viewcode . --sep
cd source || exit 2
cp $TRACIM_DIR/backend/generate_hookspec_sphinx_rst_doc.py .
$PYTHON_ENV_DIR/bin/python generate_hookspec_sphinx_rst_doc.py
sed -i '/   :caption: Contents:/s/$/\n\n   hookspecs\n/' index.rst
cp $TRACIM_DIR/backend/doc/hello_world_plugin.py .
cd ..
make latexpdf
make epub
make html
