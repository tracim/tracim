# Getting started

## Development installation

Install basic tracim with default configuration for development purpose.

```bash
./setup_default_backend.sh
./install_frontend_dependencies.sh
./build_full_frontend.sh
./run_dev_backend.sh
```

Open `localhost:7999`.
Connect using `admin@admin.admin:admin@admin.admin`.

## Working in backend

To update the backend, restart the server: `./run_dev_backend.sh`

See [backend doc](/docs/development/backend_build.md) for more information.

## Working in frontend

See [frontend doc](/docs/development/frontend_build.md).

## Submit your modifications to tracim repo

See [before push](/docs/development/before_push.md).
