FROM debian:stretch
MAINTAINER contact@tracim.fr

ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8

# Install required packages
RUN apt update && apt upgrade -qy \
    && apt install -qy \
    apache2 \
    build-essential \
    curl \
    git \
    gnupg \
    ghostscript \
    imagemagick \
    inkscape \
    libapache2-mod-wsgi-py3 \
    libfile-mimeinfo-perl \
    libimage-exiftool-perl \
    libjpeg-dev \
    libmagickwand-dev \
    libreoffice \
    locales \
    mysql-client \
    poppler-utils \
    postgresql-client \
    python3 \
    python3-dev \
    python3-pip \
    python3-venv \
    uwsgi \
    uwsgi-plugin-python3 \
    redis-server \
    zlib1g-dev \
# Install nodejs
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt update \
    && apt install -qy nodejs \
# Remove default conf about apache2
    && rm /etc/apache2/sites-enabled/000-default.conf \
# Clean install
    && apt autoremove -qy \
    && apt clean -qy \
    && rm -rf /var/lib/apt/list/* \
# Get the source from GitHub
    && git clone https://github.com/tracim/tracim_v2.git tracim \
    && cd /tracim/ \
    && git checkout -- \
    && git pull origin develop \
# Go in repo folder
    && cd /tracim \
# install frontend
    && ./install_frontend_dependencies.sh root \
    && ./build_full_frontend.sh \
# Clean frontend installation
    && rm -r frontend/node_modules \
    && rm -r frontend_app_admin_workspace_user/node_modules \
    && rm -r frontend_app_file/node_modules \
    && rm -r frontend_app_html-document/node_modules \
    && rm -r frontend_app_thread/node_modules \
    && rm -r frontend_app_workspace/node_modules \
    && rm -r frontend_app_workspace_advanced/node_modules \
    && rm -r frontend_lib/node_modules \
# Go in backend folder
    && cd backend \
# install backend
    && pip3 install -r requirements.txt \
    && pip3 install -e ".[postgresql]" \
    && pip3 install -e ".[mysql]" \
    && npm install i18next-conv -g \
    && ./update_i18n_json_file.sh \
    && cd ../../ \
# activate a2enmod
    && a2enmod proxy \
    && a2enmod proxy_http \
    && a2enmod proxy_ajp \
    && a2enmod rewrite \
    && a2enmod deflate \
    && a2enmod headers \
    && a2enmod proxy_html \
# Purges useless packages
    && apt purge -yq \
    build-essential \
    curl \
    git \
    libjpeg-dev \
    libmagickwand-dev \
    nodejs \
    python3-dev \
    zlib1g-dev \
    && apt autoremove -qy \
    && apt clean -qy \
    && rm -rf /var/lib/apt/list/*

COPY uwsgi.ini /tracim/uwsgi.ini
COPY apache2.conf /tracim/apache2.conf
COPY check_env_vars.sh /tracim/check_env_vars.sh
COPY common.sh /tracim/common.sh
COPY entrypoint.sh /tracim/entrypoint.sh

VOLUME ["/etc/tracim", "/var/tracim"]

CMD ["/bin/bash","/tracim/entrypoint.sh"]
