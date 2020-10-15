#!/bin/bash
pip install pytest testinfra python-dotenv
cp tracim.sample.env tracim.env
cp test_config.sample.env test_config.env
docker run --name dns_docker_solver --hostname dns.mageddo --restart=unless-stopped -p 5380:5380 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /etc/resolv.conf:/etc/resolv.conf \
defreitas/dns-proxy-server
