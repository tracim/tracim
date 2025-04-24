# Getting started

## Development installation

Install basic tracim with the default configuration for development purposes.

```bash
./setup_default_backend.sh
./install_frontend_dependencies.sh
./build_full_frontend.sh
```

Run Tracim for development
```bash
./run_dev_backend.sh
```

Open `localhost:7999`.
Connect using `admin@admin.admin:admin@admin.admin`.

## Working on the backend

See [backend documentation](/docs/development/backend/working_in_backend.md) for more information.

## Working on the frontend

See [frontend documentation](/docs/development/frontend/working_in_frontend.md).

## Submit your modifications to tracim repo

See [before push documentation](/docs/development/getting_started/before_push.md).


## Advanced

### Connect and use Tracim api

See [API documentation](/docs/api-integration/api.md).

### Connect to Tracim live event socket

Connect to the live endpoint to receive every change as they appear on the server.

See [Tracim Live Message documentation](/docs/api-integration/tlm_event_socket.md).
