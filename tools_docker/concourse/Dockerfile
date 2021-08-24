# This image should be built from the root of tracim repository, e.g.:
# docker build -f tools_docker/concourse -t algooci/tracim:latest .
FROM debian:bullseye AS base_install

COPY . tracim
WORKDIR tracim
RUN ./concourse/scripts/install_backend_packages

FROM base_install as builder
RUN \
    # needed to install different python versions
    ./concourse/scripts/install_pyenv && \
    # tested python versions
    ./concourse/scripts/install_backend_python 3.5.10 3.6.14 3.7.11

# Frontend dependencies
RUN ./install_frontend_dependencies.sh root && \
    ./setup_functionnal_tests.sh root

FROM base_install
COPY --from=builder /root /root

ENV HOME=/root
# Tracim needs UTF-8 to properly work
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8

# docker & docker-compose
RUN ./concourse/scripts/install_docker
