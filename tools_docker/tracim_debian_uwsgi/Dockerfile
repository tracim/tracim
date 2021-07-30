ARG PG_DEP="full"
ARG DEBUG_DEP="minimal"
ARG ENCRYPTION_DEP="full"
ARG DB_DEP="full"
ARG REPOSITORY_TYPE="remote"
ARG PACKAGE_DIR="/tracim/tools_docker/tracim_debian_uwsgi/packages"
ARG LOCAL_REPO_DIR=""
ARG TAG=""
ARG BRANCH=""
ARG REPO="https://github.com/tracim/tracim.git"
###
# Base install stages:
####
# Base image for installing some base dependencies
####

FROM debian:bullseye AS base
ARG PG_DEP
ARG DEBUG_DEP
ARG ENCRYPTION_DEP
ARG DB_DEP
RUN apt update \
   && apt upgrade -qy \
   && apt install git -qy --no-install-recommends \
   && apt autoremove -qy \
   && rm -rf /var/lib/{apt,dpkg,cache,log}/ /tmp/* /var/tmp/*

 # Clone repo
FROM base as base_repository_local
ARG LOCAL_REPO_DIR
RUN if [ "$LOCAL_REPO_DIR" = "" ]; then echo "No local repository dir LOCAL_REPO_DIR given." && exit 2; fi
ADD ${LOCAL_REPO_DIR} /tracim

FROM base as base_repository_remote
ARG TAG
ARG BRANCH
ARG REPO
RUN if ([ "$TAG" != "" ] && [ "$BRANCH" != "" ]); \
    then echo "Its not possible to use ARG TAG and ARG BRANCH in same time." && exit 1;fi
RUN \
    get_source_from_github() { \
    if ([ "$TAG" != "" ] && [ "$BRANCH" = "" ]); \
    then git clone -b $TAG --single-branch "$REPO" tracim; \
    elif ([ "$TAG" = "" ] && [ "$BRANCH" != "" ]); \
    then git clone "$REPO" tracim && cd tracim/ && git checkout $BRANCH && cd -; \
    else git clone "$REPO" tracim; \
    fi \
    } \
    && get_source_from_github $TAG $BRANCH
FROM base_repository_${REPOSITORY_TYPE} as base_repository

FROM base_repository as base_install
ARG PACKAGE_DIR
RUN cat $PACKAGE_DIR/base_packages.list > packages.list
RUN cat $PACKAGE_DIR/pg_minimal_packages.list >> packages.list
RUN if [ "$DEBUG_DEP" = "full" ]; then cat $PACKAGE_DIR/debug_packages.list >> packages.list ; fi
RUN if [ "$ENCRYPTION_DEP" = "full" ]; then cat $PACKAGE_DIR/encryption_packages.list >> packages.list ; fi
RUN if [ "$PG_DEP" = "full" ]; then cat $PACKAGE_DIR/pg_full_packages.list >> packages.list ; fi
RUN \
    apt update \
    && apt upgrade -qy \
    && xargs -a packages.list apt install -qy --no-install-recommends\
    && apt autoremove -qy \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/ /tmp/* /var/tmp/*




###
# Backend install stage
####
# Stage who:
# - install python dependencies
# - install tracim backend
# - install optionals dependencies
####

# level 1 : base builder
FROM base_install AS base_backend
ARG PACKAGE_DIR
# Install required packages
RUN xargs -a $PACKAGE_DIR/install_backend_packages.list apt install -qy
RUN \
# Go in backend folder
    cd /tracim/backend \
# Install backend
    && python3 -m pip install -r requirements-build.txt \
    && python3 -m pip install -r requirements.txt \
    && python3 -m pip install -e "."

# level 2 : db requirement stage
FROM base_backend as db_install_minimal
FROM base_backend as db_install_full
RUN \
    # Go in backend folder
    cd /tracim/backend \
    && python3 -m pip install -r requirements-db-postgres.txt \
    && python3 -m pip install -r requirements-db-mysql.txt
FROM db_install_${DB_DEP} as db_install

# level 3 : PG dependencies stage
FROM db_install as pg_install_minimal
FROM db_install as pg_install_full
RUN \
    # Go in backend folder
    cd /tracim/backend \
    && python3 -m pip install -r requirements-full-preview-generator.txt
# end of all stages:
from pg_install_${PG_DEP} as backend


###
# Frontend build stage
####
# Stage who:
# - install javascript dependencies
# - setup backend translation
# - build frontend
####
FROM node:14-buster AS frontend
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

MAINTAINER contact@tracim.fr

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
    && xargs -a $PACKAGE_DIR/server_apt_http_packages.list apt install -qy --no-install-recommends \
    && apt update \
    && xargs -a $PACKAGE_DIR/server_packages.list apt install -qy --no-install-recommends \
    && apt autoremove -qy \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/ /tmp/* /var/tmp/* \
# Remove default conf about apache2
    && rm /etc/apache2/sites-enabled/000-default.conf \
# Do not show apache version
    && sed -i "s|ServerTokens OS|ServerTokens Prod|g" /etc/apache2/conf-enabled/security.conf \
    && sed -i "s|ServerSignature On|ServerSignature Off|g" /etc/apache2/conf-enabled/security.conf

# Tracim code: backend
COPY --from=backend /tracim /tracim
# Tracim code: frontend
COPY --from=frontend /tracim/frontend/dist /tracim/frontend/dist
# backend translation
COPY --from=frontend /tracim/backend/tracim_backend/locale /tracim/backend/tracim_backend/locale
# backend dependencies installed through pip
COPY --from=backend /usr/local /usr/local

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
