ARG PACKAGE_DIR="/tracim/system_packages/debian"
ARG REPO="https://github.com/tracim/tracim.git"
ARG BRANCH=""
ARG TAG=""

###
# Base install stages:
####
# Base image for installing some base dependencies
####

FROM debian:bullseye AS base
ARG REPO
ARG PACKAGE_DIR
ARG BRANCH
ARG TAG
RUN apt-get update \
   && apt-get upgrade -qy \
   && apt-get install apt-utils git -qy \
COPY ./clone_repo.sh /clone_repo.sh
RUN /clone_repo.sh "${REPO}" "${BRANCH}" "${TAG}"
RUN rm /clone_repo.sh
RUN apt-get install -qy $(cat "${PACKAGE_DIR}/run_backend_packages.list") \
    && apt-get autoremove -qy \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/ /tmp/* /var/tmp/*


###
# Backend install stage
####
# Stage which:
# - installs python dependencies
# - installs tracim backend
# - installs optional dependencies
####
FROM base AS build_backend
ENV SETUPTOOLS_USE_DISTUTILS=stdlib
ARG PACKAGE_DIR
# required packages for building the backend dependencies
RUN apt-get install -qy $(cat "${PACKAGE_DIR}/build_backend_packages.list") \
    # Go in backend folder
    && cd /tracim/backend \
    # Install backend
    && pip install --force-reinstall \
    -r requirements-build.txt \
    -r requirements.txt \
    -r requirements-db-postgres.txt \
    -r requirements-db-mysql.txt \
    -r requirements-storage-s3.txt \
    -r requirements-full-preview-generator.txt \
    -e "."


###
# Frontend build stage
####
# Stage which:
# - installs javascript dependencies
# - setups backend translation
# - builds frontend
####
FROM node:14-buster AS build_frontend
COPY --from=base /tracim /tracim
RUN \
    cd /tracim/backend \
    && npm install "i18next-conv@<8" -g \
    && ./update_i18n_json_file.sh
# Install frontend
RUN \
    cd /tracim/ \
    && ./install_frontend_dependencies.sh root \
    && ./build_full_frontend.sh
# Clean frontend installation
RUN \
    rm -rf /tracim/frontend*/node_modules \
    && rm -rf /tracim/node_modules


FROM base

LABEL org.opencontainers.image.authors="contact@tracim.fr"

ENV DEFAULT_APP_LIST="contents/thread,contents/file,contents/html-document,contents/folder,share_content,upload_permission,gallery"
ENV START_WEBDAV=1
ENV START_CALDAV=1
ENV ENABLE_COLLABORATIVE_DOCUMENT_EDITION=0
ENV ENABLE_GOCRYPTFS_ENCRYPTION=0
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8
ARG PACKAGE_DIR
# NOTE - 2021-10-21 - S.G. - pin condure (used by pushpin) to a lower priority so that mongrel2 is used instead.
# This is due to automated tests randomly failing with condure.
RUN printf "Package: condure\nPin: version *\nPin-Priority: -1" > /etc/apt/preferences.d/pushpin \
    && apt-get install -qy $(cat "${PACKAGE_DIR}/server_packages.list" "${PACKAGE_DIR}/optional_preview_packages.list" "${PACKAGE_DIR}/encryption_packages.list") vim wget curl \
    && apt-get autoremove -qy \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/ /tmp/* /var/tmp/* \
# Remove default apache2 conf
    && rm /etc/apache2/sites-enabled/000-default.conf \
# Do not show apache version
    && sed -i "s|ServerTokens OS|ServerTokens Prod|g" /etc/apache2/conf-enabled/security.conf \
    && sed -i "s|ServerSignature On|ServerSignature Off|g" /etc/apache2/conf-enabled/security.conf

# Tracim code: backend
COPY --from=build_backend /tracim /tracim
# backend dependencies installed through pip
COPY --from=build_backend /usr/local /usr/local
# Tracim code: frontend
COPY --from=build_frontend /tracim/frontend/dist /tracim/frontend/dist
# backend translation
COPY --from=build_frontend /tracim/backend/tracim_backend/locale /tracim/backend/tracim_backend/locale

VOLUME ["/etc/tracim", "/var/tracim"]
EXPOSE 80

CMD ["/bin/bash","/tracim/tools_docker/Debian_New_Uwsgi/entrypoint.sh"]
