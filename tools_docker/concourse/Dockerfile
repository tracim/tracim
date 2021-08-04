FROM debian:stretch AS base_install

COPY . tracim
WORKDIR tracim

ENV HOME=/root
ENV PATH=${HOME}/.pyenv/shims:${HOME}/.pyenv/bin:${PATH}
# Tracim needs UTF-8 to properly work
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8

SHELL ["/bin/bash", "-c"]

# Backend dependencies
RUN ./concourse/scripts/install_pyenv && \
    ./concourse/scripts/install_backend_packages && \
    ./concourse/scripts/install_backend_python 3.5.10 3.6.14 3.7.11

# docker & docker-compose
RUN ./concourse/scripts/install_docker

# Frontend dependencies
RUN ./install_frontend_dependencies.sh root && \
    ./setup_functionnal_tests.sh root
