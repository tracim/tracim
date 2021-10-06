ARG OPTIONAL_PACKAGE_LISTS="optional_preview"
ARG PACKAGE_DIR="/tracim/system_packages/debian"
ARG REPO="https://github.com/tracim/tracim.git"
ARG GIT_REF="master"
###
# Base install stages:
####
# Base image for installing some base dependencies
####

FROM debian:bullseye AS base
RUN apt-get update \
   && apt-get upgrade -qy \
   && apt-get install apt-utils git -qy --no-install-recommends \
   && apt-get autoremove -qy \
   && rm -rf /var/lib/{apt,dpkg,cache,log}/ /tmp/* /var/tmp/*

# Clone repo
FROM base as base_install
ARG REPO
ARG PACKAGE_DIR
#RUN git clone -b $GIT_REF --single-branch "$REPO" tracim
COPY . /tracim
RUN cat $PACKAGE_DIR/base_packages.list > packages.list
RUN for package_list in $OPTIONAL_PACKAGE_LISTS; do cat "${PACKAGE_DIR}/${package_list}_packages.list" >> packages.list; done
RUN \
    apt-get update \
    && apt-get upgrade -qy \
    && xargs -a packages.list apt-get install -qy --no-install-recommends\
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
FROM base_install AS build_backend
ARG PACKAGE_DIR
# required packages for building the backend dependencies
RUN xargs -a $PACKAGE_DIR/backend_packages.list apt-get install -qy
RUN \
# Go in backend folder
    cd /tracim/backend \
# Install backend
    && python3 -m pip install -r requirements-build.txt -r requirements.txt -r requirements-db-postgres.txt -r requirements-db-mysql.txt \
    && python3 -m pip install -r requirements-full-preview-generator.txt


###
# Frontend build stage
####
# Stage which:
# - installs javascript dependencies
# - setups backend translation
# - builds frontend
####
FROM node:14-buster AS build_frontend
COPY --from=base_install /tracim /tracim
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


FROM base_install

LABEL org.opencontainers.image.authors="contact@tracim.fr"

ENV DEFAULT_APP_LIST="contents/thread,contents/file,contents/html-document,contents/folder,share_content,upload_permission,gallery"
ENV START_WEBDAV=1
ENV START_CALDAV=1
ENV ENABLE_COLLABORATIVE_DOCUMENT_EDITION=0
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8
ENV ENABLE_GOCRYPTFS_ENCRYPTION=0
ENV DOCKER_SCRIPT_DIR="/tracim/tools_docker/tracim_debian_uwsgi"
ARG PACKAGE_DIR
RUN printf "Package: pushpin\nPin: version 1.31.*\nPin-Priority: 999\nPackage: condure\nPin: version *\nPin-Priority: -1" > /etc/apt/preferences.d/pushpin \
    && xargs -a $PACKAGE_DIR/server_packages.list apt-get install -qy --no-install-recommends \
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

# Force pushpin config
RUN mv /etc/pushpin/pushpin.conf /etc/pushpin/pushin.conf.default \
    && mv /etc/pushpin/routes /etc/pushpin/routes.default \
    && cp tracim/tools_docker/tracim_debian_uwsgi/pushpin_config/routes /etc/pushpin/routes \
    && chmod 644 /etc/pushpin/routes \
    && cp tracim/tools_docker/tracim_debian_uwsgi/pushpin_config/pushpin.conf /etc/pushpin/pushpin.conf \
    && chmod 644 /etc/pushpin/routes

VOLUME ["/etc/tracim", "/var/tracim"]
EXPOSE 80

CMD ["/bin/bash","/tracim/tools_docker/tracim_debian_uwsgi/entrypoint.sh"]
