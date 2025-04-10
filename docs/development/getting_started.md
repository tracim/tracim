# Getting started

## Development installation

Install basic tracim with default configuration for development purpose.

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

## Connect to Tracim live event

Connect to the live endpoint to receive every change as they appear on the server.

See [Tracim Live Message documentation](/docs/api-integration/tlm_event_socket.md).

## Working in backend

To update the backend, restart the server: `./run_dev_backend.sh`  
See [backend doc](/docs/development/backend_build.md) for more information.

## Working in frontend

See [frontend doc](/docs/development/frontend_build.md).

## Submit your modifications to tracim repo

See [before push](/docs/development/before_push.md).
