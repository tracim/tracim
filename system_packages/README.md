# System packages used by Tracim

This directory contains listing of system packages that can be used by Tracim.

- `build_backend_packages.list`: packages needed to build and install Tracim's backend.
- `debug_packages.list`: useful debug packages for a production environment
- `encryption_packages.list`: packages needed to enable encryption of stored previews (to be used with the docker images available in tools_docker/Debian_New_UWsgi)
- `optional_preview_packages.list`: packages of external applications (inkscape, libreoffice…) that Tracim can use to preview contents.
- `run_backend_packages.list`: minimal packages needed to run Tracim's backend.
- `server_packages.list`: packages needed to run Tracim's backend with apache2 and uwsgi.
