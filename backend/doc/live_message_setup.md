
## Install Pushpin

On ubuntu/debian:

~~~bash
apt install pushpin
~~~

## Some configuration needed

if you use pushpin with dev config (pushpin_dev.conf) for development purpose,
you need to set tracim config like this:

~~~ini
basic_setup.website_base_url = http://localhost:7998
live_messages.control_uri = http://localhost:5571
~~~

## Run tracim with Pushpin (dev)

First Run tracim :
~~~bash
cd backend
pserve development.ini
~~~

~~~bash
pushpin --config pushpin_dev.conf --route '* localhost:6543' &
~~~

then you can check if pushpin reverse-proxy work correctly:

~~~bash
firefox localhost:7998
~~~

## Manually testing live messages

To manually test live messages, you can first open a connexion on live message stream for one user:
(this use the default admin user, of course you can do this with other users too)

~~~bash
http -S -a admin@admin.admin:admin@admin.admin localhost:7998/api/v2/users/1/live_messages
~~~


And you can test message with this command:
(in this example, we use use also the default admin user)

~~~bash
tracim dev test live-messages -u 1 -d
~~~
