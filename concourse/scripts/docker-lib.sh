#!/bin/bash
# Based on https://github.com/concourse/docker-image-resource/blob/master/assets/common.sh

LOG_FILE=${LOG_FILE:-/tmp/docker.log}
SKIP_PRIVILEGED=${SKIP_PRIVILEGED:-false}
STARTUP_TIMEOUT=${STARTUP_TIMEOUT:-20}
DOCKER_DATA_ROOT=${DOCKER_DATA_ROOT:-/scratch/docker}
# IP address used to discover which interface will route to internet
IP_FOR_WAN_INTERFACE=8.8.8.8

sanitize_cgroups() {
  # cgroup v2 unified hierarchy only (the only mode on Debian 13/Trixie):
  # dockerd handles it natively, we just need it mounted read-write.
  mkdir -p /sys/fs/cgroup
  mountpoint -q /sys/fs/cgroup || \
    mount -t cgroup2 -o nsdelegate cgroup2 /sys/fs/cgroup

  mount -o remount,rw /sys/fs/cgroup
}

start_docker() {
  echo "Starting Docker..."

  if [ -f /tmp/docker.pid ]; then
    echo "Docker is already running"
    return
  fi

  mkdir -p /var/log
  mkdir -p /var/run

  if [ "$SKIP_PRIVILEGED" = "false" ]; then
    sanitize_cgroups

    # check for /proc/sys being mounted readonly, as systemd does
    if grep '/proc/sys\s\+\w\+\s\+ro,' /proc/mounts >/dev/null; then
      mount -o remount,rw /proc/sys
    fi
  fi

  local mtu=$(cat /sys/class/net/$(ip route get $IP_FOR_WAN_INTERFACE|awk '{ print $5 }')/mtu)
  local server_args="--mtu ${mtu}"
  local registry=""

  for registry in $1; do
    server_args="${server_args} --insecure-registry ${registry}"
  done

  if [ -n "$2" ]; then
    echo "Using registry mirror: $2"
    server_args="${server_args} --registry-mirror $2"
  fi

  export server_args LOG_FILE DOCKER_DATA_ROOT
  trap stop_docker EXIT

  try_start() {
    dockerd --data-root "$DOCKER_DATA_ROOT" ${server_args} > "$LOG_FILE" 2>&1 &
    echo $! > /tmp/docker.pid

    sleep 1

    echo waiting for docker to come up...
    until docker info >/dev/null 2>&1; do
      sleep 1
      if ! kill -0 "$(cat /tmp/docker.pid)" 2>/dev/null; then
        return 1
      fi
    done
  }

  if [ "$(command -v declare)" ]; then
    declare -fx try_start

    if ! timeout ${STARTUP_TIMEOUT} bash -ce 'while true; do try_start && break; done'; then
      echo Docker failed to start within ${STARTUP_TIMEOUT} seconds.
      return 1
    fi
  else
    try_start
  fi
}

stop_docker() {
  echo "Stopping Docker..."

  if [ ! -f /tmp/docker.pid ]; then
    return 0
  fi

  local pid=$(cat /tmp/docker.pid)
  if [ -z "$pid" ]; then
    return 0
  fi

  kill -TERM $pid
  rm /tmp/docker.pid
}
