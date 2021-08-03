FROM debian:stretch AS base_install

COPY . tracim
WORKDIR tracim

RUN ./concourse/scripts/install_pyenv
ENV HOME=/root
ENV PATH=${HOME}/.pyenv/bin:${PATH}
RUN pyenv install 3.5.10
RUN pyenv install 3.6.14
RUN pyenv install 3.7.11
RUN ./concourse/scripts/install_docker
RUN ./concourse/scripts/install_backend_packages

RUN ./install_frontend_dependencies.sh root
RUN ./setup_functionnal_tests.sh root
