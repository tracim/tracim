
# Install Live Message mecanism for development purpose

## Install Pushpin in docker

On ubuntu/debian:

~~~bash
apt install docker.io
docker pull fanout/pushpin
~~~

## Some configuration needed

First you need to verify that both zurl and pushpin service are not running locally,
on debian/ubuntu(you can also verify if pushpin or zurl package are installed on your OS).

with systemd:

~~~bash
systemctl status pushpin
sudo systemctl disable pushpin
sudo systemctl stop pushpin

systemctl status zurl
sudo systemctl disable zurl
sudo systemctl stop zurl
~~~

you need to set tracim config like this to use default pushpin port:

~~~ini
basic_setup.website_base_url = http://localhost:7999
live_messages.control_uri = http://localhost:5561
~~~

:warning:  Temporary, you also need to ensure "email.processing_mode" parameter is unset or set to "sync".

## Run tracim with Pushpin (dev)

First Run tracim :
~~~bash
cd backend
pserve development.ini
~~~

create pushpin docker (from tracim root dir):
~~~bash
ls pushpin_config # just a verification
docker create --net host -v ${PWD}/pushpin_config:/etc/pushpin --name pushpin fanout/pushpin
~~~

then you can start it:
~~bash
docker start pushpin
~~

then you can check if pushpin reverse-proxy work correctly:

~~~bash
firefox localhost:7999
~~~
### More info about docker

to recreate the pushpin container, you may need to drop the named container "pushpin":
~~bash
docker rm pushpin
~~

to stop "pushpin" containers:
~~bash
docker stop pushpin
~~

to see running container list:
~~bash
docker ps
~~

## Manually testing live messages

To manually test live messages, you can first open a connexion on live message stream for one user:
(this use the default admin user, of course you can do this with other users too)

~~~bash
http -S -a admin@admin.admin:admin@admin.admin localhost:7999/api/v2/users/1/live_messages
~~~


And you can test message with this command:
(in this example, we use use also the default admin user)

~~~bash
tracimcli dev test live-messages -u 1 -d
~~~
