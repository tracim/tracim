FROM debian:stretch AS base_install
RUN \
    apt update \
    && apt upgrade -qy \
    && apt install -qy \
        git \
        libfile-mimeinfo-perl \
        libimage-exiftool-perl \
        locales \
        python3

FROM base_install AS builder

ARG TAG=""
ARG BRANCH=""
ARG REPO="https://github.com/tracim/tracim.git"

RUN if ([ "$TAG" != "" ] && [ "$BRANCH" != "" ]); \
    then echo "Its not possible to use ARG TAG and ARG BRANCH in same time." && exit 1;fi

# Install required packages
RUN \
    apt install -qy curl \
    # Node.JS 10
    && curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt install -qy \
        build-essential \
        libjpeg-dev \
        libmagickwand-dev \
        libpq-dev \
        nodejs \
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
    && python3 -m pip install -r requirements-full-preview-generator.txt \
    && python3 -m pip install -r requirements-db-postgres.txt \
    && python3 -m pip install -r requirements-db-mysql.txt \
    && python3 -m pip install -e "." \
    && npm install "i18next-conv@<8" -g \
    && ./update_i18n_json_file.sh

RUN \
# Go in tracim folder
    cd /tracim/ \
# Install frontend
    && ./install_frontend_dependencies.sh root \
    && ./build_full_frontend.sh

RUN \
# Clean frontend installation
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
RUN \
    printf "Package: pushpin\nPin: version 1.31.*\nPin-Priority: 999\nPackage: condure\nPin: version *\nPin-Priority: -1" > /etc/apt/preferences.d/pushpin \
    && apt install -qy \
        apt-transport-https \
        software-properties-common \
        gnupg2 \
    && echo deb https://fanout.jfrog.io/artifactory/debian fanout-stretch main \
        | tee /etc/apt/sources.list.d/fanout.list \
    && apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 \
        --recv-keys EA01C1E777F95324 \
    && apt update \
    && apt install -qy \
        apache2 \
        ffmpeg \
        ghostscript \
        gnupg \
        imagemagick \
        inkscape \
        libapache2-mod-proxy-uwsgi \
        libreoffice \
        poppler-utils \
        postgresql-client \
        pushpin \
        qpdf \
        redis-server \
        supervisor \
        ufraw-batch \
        uwsgi \
        uwsgi-plugin-python3 \
        vim \
        xvfb \
        gocryptfs \
        fuse \
# Remove default conf about apache2
    && rm /etc/apache2/sites-enabled/000-default.conf \
# Do not show apache version
    && sed -i "s|ServerTokens OS|ServerTokens Prod|g" /etc/apache2/conf-enabled/security.conf \
    && sed -i "s|ServerSignature On|ServerSignature Off|g" /etc/apache2/conf-enabled/security.conf

# Tracim code (backend & frontend)
COPY --from=builder /tracim /tracim
# backend dependencies installed through pip
COPY --from=builder /usr/local /usr/local

VOLUME ["/etc/tracim", "/var/tracim"]
EXPOSE 80

CMD ["/bin/bash","/tracim/tools_docker/Debian_New_Uwsgi/entrypoint.sh"]
