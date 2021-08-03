FROM debian:stretch AS base_install

COPY . tracim
WORKDIR tracim

ENV HOME=/root
ENV PATH=${HOME}/.pyenv/bin:${PATH}
# Backend dependencies
RUN ./concourse/scripts/install_pyenv
RUN ./concourse/scripts/install_backend_python 3.5.10 3.6.14 3.7.11
RUN ./concourse/scripts/install_backend_packages

# docker & docker-compose
RUN ./concourse/scripts/install_docker

# Frontend dependencies
RUN ./install_frontend_dependencies.sh root
RUN ./setup_functionnal_tests.sh root
