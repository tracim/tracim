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

See [backend documentation](/docs/developer/setup_env/setup_backend.md) for more information.


## Working on the frontend

See [frontend documentation](/docs/developer/setup_env/setup_frontend.md).


## Submit your modifications to tracim repo

See [before push documentation](/docs/contribution/code/before_push.md).


## Advanced

### Connect and use Tracim api

See [API documentation](/docs/working_with_api/api.md).

### Connect to Tracim live event socket

Connect to the live endpoint to receive every change as they appear on the server.

See [Tracim Live Message documentation](/docs/working_with_api/tlm_event_socket.md).
