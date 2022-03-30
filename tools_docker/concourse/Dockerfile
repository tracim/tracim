# This image should be built from the root of tracim repository, e.g.:
# docker build -f tools_docker/concourse/Dockerfile -t algooci/tracim:latest .
FROM debian:bullseye AS base_install

# HOME, used by pyenv scripts
ENV HOME=/root
# Tracim needs UTF-8 to properly work
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8

COPY . tracim
WORKDIR /tracim
RUN \
    ./concourse/scripts/install_backend_packages && \
    # needed to install different python versions
    ./concourse/scripts/install_pyenv

FROM base_install AS main
    # tested python versions

RUN \
    ./concourse/scripts/install_backend_python 3.6.14 3.7.11 3.8.11 3.9.6 && \
    # frontend dependencies
    ./install_frontend_dependencies.sh root && \
    # cypress
    ./setup_functionnal_tests.sh root && \
    # docker & docker-compose
    ./concourse/scripts/install_docker
