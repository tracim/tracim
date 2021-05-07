#
# Pushpin Dockerfile
#
# https://github.com/fanout/docker-pushpin
#
# NOTE - S.G. - 2021-05-05
# This dockerfile is based on the official Dockerfile from fanout
# But changes the configuration zurl changes so that it properly
# works with mongrel2.

# Pull the base image
FROM ubuntu:18.04
MAINTAINER Justin Karneges <justin@fanout.io>

# Add private APT repository
RUN \
  apt-get update && \
  apt-get install -y apt-transport-https software-properties-common && \
  echo deb https://fanout.jfrog.io/artifactory/debian fanout-bionic main \
    | tee /etc/apt/sources.list.d/fanout.list && \
  apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys \
    EA01C1E777F95324

ENV PUSHPIN_VERSION 1.31.0-1~bionic1

# Install Pushpin
RUN \
  apt-get update && \
  apt-get install -y mongrel2-core pushpin=$PUSHPIN_VERSION

# Cleanup
RUN \
  apt-get clean && \
  rm -fr /var/lib/apt/lists/* && \
  rm -fr /tmp/*

COPY start.sh /usr/local/bin/
CMD ["/usr/local/bin/start.sh"]

# Expose ports.
# - 7999: HTTP port to forward on to the app
# - 5560: ZMQ PULL for receiving messages
# - 5561: HTTP port for receiving messages and commands
# - 5562: ZMQ SUB for receiving messages
# - 5563: ZMQ REP for receiving commands
EXPOSE 7999
EXPOSE 5560
EXPOSE 5561
EXPOSE 5562
EXPOSE 5563
