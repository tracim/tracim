FROM debian:jessie
MAINTAINER contact@algoo.fr

# TODO: See GOOD PRATICE (remove apt lists, cache, etc)

# Install required packages
RUN apt-get update -q \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
      git \
      locales \
      realpath \
      python3 \
      python3-dev \
      python3-pip \
      build-essential \
      libxml2-dev \
      libxslt1-dev \
      python-lxml \
      postgresql-server-dev-all \
      postgresql \
      postgresql-client \
      uwsgi \
      uwsgi-plugin-python3 \
      mysql-client \
      libmysqld-dev \
      sqlite3 \
      nginx \
      redis-server

# Ensure UTF-8
RUN locale-gen en_US.UTF-8 en_us \
    && dpkg-reconfigure locales \
    && locale-gen C.UTF-8 \
    && /usr/sbin/update-locale LANG=C.UTF-8
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8

# Download and install Tracim
RUN git clone https://github.com/tracim/tracim.git \
     && cd /tracim/tracim \
     && python3 setup.py develop \
     && cd /tracim \
     && pip3 install -r install/requirements.txt\
     && pip3 install https://launchpad.net/oursql/py3k/py3k-0.9.4/+download/oursql-0.9.4.zip \
     && echo 20161216001

# Prepare volumes
RUN mkdir /etc/tracim \
    && mkdir /var/tracim \
    && mkdir /var/tracim/logs \
    && mkdir /var/tracim/assets
VOLUME ["/etc/tracim", "/var/tracim"]

COPY uwsgi.ini /etc/tracim/uwsgi.ini
COPY nginx.conf /etc/tracim/nginx.conf
COPY wsgi.py /tracim/tracim/wsgi.py
COPY check_env_vars.sh /tracim/check_env_vars.sh
COPY entrypoint.sh /tracim/entrypoint.sh

RUN ln -s /etc/tracim/uwsgi.ini /etc/uwsgi/apps-available/tracim.ini && \
    ln -s /etc/uwsgi/apps-available/tracim.ini /etc/uwsgi/apps-enabled/tracim.ini && \
    ln -s /etc/tracim/nginx.conf /etc/nginx/sites-available/tracim.conf && \
    ln -s /etc/nginx/sites-available/tracim.conf /etc/nginx/sites-enabled/tracim.conf && \
    chown root:www-data -R /var/tracim/logs && \
    chmod 775 -R /var/tracim/logs && \
    rm /etc/nginx/sites-enabled/default

CMD ["/tracim/entrypoint.sh"]
