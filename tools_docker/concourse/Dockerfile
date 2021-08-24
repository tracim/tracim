# This image should be built from the root of tracim repository, e.g.:
# docker build -f tools_docker/concourse -t algooci/tracim:latest .
FROM debian:stretch AS base_install

COPY . tracim
WORKDIR tracim

# Backend dependencies, installed in /root/.pyenv
RUN ./concourse/scripts/install_pyenv && \
    ./concourse/scripts/install_backend_packages && \
    ./concourse/scripts/install_backend_python 3.5.10 3.6.14 3.7.11

# Frontend dependencies
RUN ./install_frontend_dependencies.sh root && \
    ./setup_functionnal_tests.sh root

FROM debian:stretch
COPY --from=base_install /root /root

ENV HOME=/root
ENV PATH=${HOME}/.pyenv/shims:${HOME}/.pyenv/bin:${PATH}
# Tracim needs UTF-8 to properly work
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8

# docker & docker-compose
RUN ./concourse/scripts/install_docker
