# This image should be built from the root of tracim repository, e.g.:
# docker build -f tools_docker/concourse/Dockerfile -t algooci/tracim:latest .
FROM debian:trixie AS base_install

# HOME, used by pyenv scripts
ENV HOME=/root
# Tracim needs UTF-8 to properly work
ENV LANG=C.UTF-8
ENV LANGUAGE=C.UTF-8
ENV LC_ALL=C.UTF-8

COPY . tracim
WORKDIR /tracim
RUN \
    ./concourse/scripts/install_backend_packages && \
    # needed to install different python versions \
    ./concourse/scripts/install_pyenv

FROM base_install AS main

# HACK - PGO - 2026-08-19
# Chromium version used to run Cypress, kept fixed so CI runs stay reproducible.
#    see concourse/scripts/end-to-end-cypress-tests that forces to use Chromium intead of bundled Electron
#    Our current Cypress 13 version has v118 that is incompatible with OpenDavCal (#6930)
# Debian 13 is by default on Chromium 151.0.7922.137-1~deb13u1
ARG CHROMIUM_VERSION=151.0.7922.137-1~deb13u1

RUN \
    # Python versions to install in the image. \
    # Tested Python version is set via the PYTHON_VERSION env var in concourse/pipelines/pull-request.yml \
    ./concourse/scripts/install_backend_python 3.13.14 && \
    # frontend dependencies \
    ./install_frontend_dependencies.sh root && \
    # cypress \
    ./setup_functionnal_tests.sh root && \
    ./concourse/scripts/install_chromium "$CHROMIUM_VERSION" && \
    # docker & docker compose \
    ./concourse/scripts/install_docker
