# Install Live Message mechanism for development purpose

Live message connection is required to allow a frontend to be informed about everything that happens on the server
in real time.

Protocol detail available [here](/docs/api-integration/tlm_event_socket.md).

## Install Pushpin in docker

On ubuntu/Debian:

```bash
apt install docker.io docker-compose-plugin
```

⚠️ do not install pushpin package as it will conflict with the docker based pushpin (`apt remove pushpin` if installed).

## Configuration

Configuration of live messages is done in the tracim configuration file (default is development.ini).

Use default pushpin port:
```ini
basic_setup.website_base_url = http://localhost:7999
live_messages.control_zmq_uri = tcp://localhost:5563,
```

Several pushpin instances can be provided, as a comma-separated list:
```ini
live_messages.control_zmq_uri = tcp://localhost:5563,tcp://remote.example.com:5563
```

Set job processing mode to synchronous:
```ini
jobs.processing_mode = sync
```

If Pushpin's accessible ports are different from the ports in the configuration (like with docker port mappings), make
sure to fill these variables too, since tracim won't be able to resolve them automatically.
```ini
live_messages.pub_zmq_uri = tcp://localhost:5562,
live_messages.push_zmq_uri = tcp://localhost:5560,
```

## Run tracim with Pushpin (dev)

Run pushpin docker:
```bash
cd backend
docker compose up -d pushpin
```

Then run tracim:
```bash
pserve development.ini
```

⚠️ pushpin for dev and pushpin for cypress cannot be started at the same time (they use the same ports)

you can check if the pushpin reverse-proxy works correctly:

```bash
firefox localhost:7999
```

### More info about docker

To stop "pushpin" containers:
```bash
cd backend
docker compose down
```

To see the running container list (pushpin container will be named `backend_pushpin_1`):
```bash
docker ps
```

## Manually testing live messages

To manually test live messages, you can first open a connexion on the live message stream for one user:
```bash
http -S -a admin@admin.admin:admin@admin.admin localhost:7999/api/users/1/live_messages
```
It uses the default admin user, you can do this with any users.

Test message with this command:
```bash
tracimcli dev test live-messages -u 1 -d
```
"1" is the id of the user.
