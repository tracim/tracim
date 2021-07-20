ARG PG_DEP="full"
ARG DEBUG_DEP="minimal"
ARG ENCRYPTION_DEP="full"
ARG DB_DEP="full"

###
# Base install stages:
####
# Base image for installing some base dependencies
####

# level 1 : base
FROM debian:bullseye AS base
RUN \
    apt update \
    && apt upgrade -qy \
    && apt install -qy \
        git \
        libfile-mimeinfo-perl \
        libimage-exiftool-perl \
        locales \
        python3

# level 2: debug tools
FROM base as debug_dep_minimal
FROM base as debug_dep_full
RUN \
    apt update \
    && apt upgrade -qy \
    && apt install -qy\
       vim \
       httpie \
       wget \
       curl \
       iproute2 \
       htop \
       nano \
       strace \
       ncdu \
       lsof \
       traceroute \
       whois \
       inetutils-ping
FROM debug_dep_${DEBUG_DEP} as debug_dep

# level 3 : Preview-Gen Dep stage
FROM debug_dep as pg_dep_minimal
RUN \
    apt update \
    && apt upgrade -qy \
    && apt install -qy \
    # Preview generator dependencies
    ghostscript \
    imagemagick \
    qpdf \
    poppler-utils
FROM pg_dep_minimal as pg_dep_full
RUN \
    apt update \
    && apt upgrade -qy \
    && apt install -qy \
        # Preview generator optionals dependencies
        ffmpeg \
        xvfb \
        inkscape \
        libreoffice
FROM pg_dep_${PG_DEP} AS pg_dep

# level 4 : Encryption stage
FROM pg_dep as encryption_dep_minimal
FROM pg_dep as encryption_dep_full
RUN \
    apt update \
    && apt upgrade -qy \
    && apt install -qy \
    # Encryption
      gocryptfs \
      fuse
# end of all stages:
FROM encryption_dep_${ENCRYPTION_DEP} as base_install


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
ARG TAG=""
ARG BRANCH=""
ARG REPO="https://github.com/tracim/tracim.git"
RUN if ([ "$TAG" != "" ] && [ "$BRANCH" != "" ]); \
    then echo "Its not possible to use ARG TAG and ARG BRANCH in same time." && exit 1;fi
# Install required packages
RUN apt install -qy \
        build-essential \
        libjpeg-dev \
        libmagickwand-dev \
        libpq-dev \
        python3-dev \
        python3-pip \
        python3-venv
# Clone repo
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
    python3 -m pip install -r requirements-full-preview-generator.txt
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
FROM debian:stretch AS frontend
COPY --from=base_backend /tracim /tracim
RUN \
    apt update \
    && apt install -qy \
    curl \
    build-essential \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt install -qy nodejs
# install translation
RUN \
    cd /tracim/backend \
    npm install "i18next-conv@<8" -g \
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
ENV DOCKER_SCRIPT_DIR="/tracim/tools_docker/Debian_New_Uwsgi"
RUN printf "Package: pushpin\nPin: version 1.31.*\nPin-Priority: 999\nPackage: condure\nPin: version *\nPin-Priority: -1" > /etc/apt/preferences.d/pushpin \
    && apt install -qy \
        apt-transport-https \
        software-properties-common \
        gnupg2 \
    && apt update \
    && apt install -qy \
        mongrel2-core \
        apache2 \
        gnupg \
        libapache2-mod-proxy-uwsgi \
        postgresql-client \
        pushpin \
        redis-server \
        supervisor \
        uwsgi \
        uwsgi-plugin-python3 \
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
COPY --from=frontend /tracim/backend/tracim_backend/locale /tracim/backend/tracim_backend/llocale
# backend dependencies installed through pip
COPY --from=backend /usr/local /usr/local

# Force pushpin config
RUN mv /etc/pushpin/pushpin.conf /etc/pushpin/pushin.conf.default \
    && mv /etc/pushpin/routes /etc/pushpin/routes.default \
    && cp tracim/tools_docker/Debian_New_Uwsgi/pushpin_config/routes /etc/pushpin/routes \
    && chmod 644 /etc/pushpin/routes \
    && cp tracim/tools_docker/Debian_New_Uwsgi/pushpin_config/pushpin.conf /etc/pushpin/pushpin.conf \
    && chmod 644 /etc/pushpin/routes

VOLUME ["/etc/tracim", "/var/tracim"]
EXPOSE 80

CMD ["/bin/bash","/tracim/tools_docker/Debian_New_Uwsgi/entrypoint.sh"]
