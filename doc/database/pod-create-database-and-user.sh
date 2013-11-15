#!/bin/bash
POD_DB_USER='pod_master'
POD_DB_USER_PASSWORD='pod_master_password'
POD_DB_NAME='pod'

# DB_HOST='127.0.0.1'
# DB_PORT='5432'

BUILD_DB_SQL="
CREATE USER ${POD_DB_USER} WITH PASSWORD '${POD_DB_USER_PASSWORD}';
CREATE DATABASE ${POD_DB_NAME};
GRANT ALL PRIVILEGES ON DATABASE ${POD_DB_NAME} to ${POD_DB_USER};
"

if [ `whoami` != 'postgres' ]; then
  echo "This script is intended to be executed as postgres user."
  exit 1
fi

echo "About to create a new database and user:"
echo "- database: ${POD_DB_NAME}"
echo "- user:     ${POD_DB_USER}"
echo "- password: xxxxxx"
echo
echo "Sleeping 10 seconds."
echo "- stop process by CTRL+C if in doubt."
echo "..."
sleep 10

echo ${BUILD_DB_SQL} | psql
#  -h ${DB_HOST} -p ${DB_PORT}


# IF AN ERROR OCCURS, YOU CAn SIMPLY RESET YOUR POSTGRES SERVER 
# WITH THE FOLLOWING SQL COMMANDS (EXECUTED AS postgres USER):
#
# DROP DATABASE pod
# DROP OWNED BY pod_master;
# DROP USER pod_master;
#
# or more faster: 
#
# psql -c "DROP DATABASE pod;"
# psql -c "DROP OWNED BY pod_master;"
# psql -c "DROP USER pod_master;"

echo
echo "You can now init schema and data by running the following commands:"
echo
echo "psql -h 127.0.0.1 -U ${POD_DB_USER} -W ${POD_DB_NAME} < pod-schema-2013.11.15-15.54.45.sql"
echo "psql -h 127.0.0.1 -U ${POD_DB_USER} -W ${POD_DB_NAME} < pod-init-data-2013.11.15-15.54.45.sql"
echo 
echo "note that you'll be asked for the password"
