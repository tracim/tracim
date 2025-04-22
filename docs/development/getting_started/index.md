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

To update the backend, restart the server: `./run_dev_backend.sh`  
See [backend doc](/docs/development/backend/working_in_backend.md) for more information.

## Working on the frontend

See [frontend doc](/docs/development/frontend/working_in_frontend.md).

## Submit your modifications to tracim repo

See [before push](/docs/development/getting_started/before_push.md).

## Connect to Tracim live event

Connect to the live endpoint to receive every change as they appear on the server.

See [Tracim Live Message documentation](/docs/api-integration/tlm_event_socket.md).
