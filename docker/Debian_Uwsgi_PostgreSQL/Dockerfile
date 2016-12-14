FROM debian:jessie
MAINTAINER contact@algoo.fr

# TODO: See GOOD PRATICE (remove apt lists, etc)

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
      uwsgi-plugin-python3

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
     && pip3 install -r install/requirements.txt

# Prepare volumes
RUN mkdir /etc/tracim
VOLUME ["/etc/tracim"]
VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

# Copy needed files
COPY uwsgi.ini /tracim/tracim/uwsgi.ini
COPY wsgi.py /tracim/tracim/wsgi.py
COPY entrypoint.sh /tracim/entrypoint.sh

# Set the default entry point
CMD ["/tracim/entrypoint.sh"]
