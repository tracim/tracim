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
FROM debian:trixie-slim
MAINTAINER Algoo team <contact@algoo.fr>


# Install Pushpin from official pushpin.org apt repository
RUN \
  apt-get update && \
  apt-get install -y curl gpg && \
  mkdir -p /etc/apt/keyrings && \
  curl -fsSL https://pushpin.org/pushpin-package.asc | gpg --dearmor -o /etc/apt/keyrings/pushpin.gpg && \
  echo "deb [signed-by=/etc/apt/keyrings/pushpin.gpg] https://packages.pushpin.org/deb pushpin-jammy main" > /etc/apt/sources.list.d/pushpin.list && \
  apt-get update && \
  apt-get install -y pushpin

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
