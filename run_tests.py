#!/usr/bin/env python -u
import contextlib
import subprocess
import os

@contextlib.contextmanager
def docker_services(services: str = ""):
    args = ["docker-compose", "up", "-d"]
    if services:
        args += services.split(" ")
    subprocess.check_call(args, cwd="backend")
    yield
    subprocess.check_call(["docker-compose", "down"], cwd="backend")

if __name__ == "__main__":

    # backend lint
    subprocess.check_call("flake8", cwd="backend")

    # backend python ??

    # backend db
    env = os.environ
    databases = ["sqlite", "postgresql", "mysql", "mariadb"]
    with docker_services():
        subprocess.check_call(["pytest"] + ["--database={}".format(db for db in databases)], cwd="backend")

# docker-compose down
# popd

# # frontend
# ./run_frontend_unit_test.sh

# # end-to-end
# ./build_full_frontend.sh
# pushd backend
# nohup pserve cypress_test.ini &
# nohup tracimcli caldav start &
# docker-compose up -d pushpin
# popd
# pushd functionnal_tests
# yarn run travis-cypress-run
# popd
# pushd backend
# docker-compose down
