ARG PACKAGE_DIR="/tracim/system_packages/debian"
ARG REPO="https://github.com/tracim/tracim.git"
ARG BRANCH=""
ARG TAG=""
ARG VERSION="0000.00.00"
ARG CONTAINER_TRACIM_DIR="/tracim"

###
# Base install stages:
####
# Base image for installing some base dependencies
####

FROM debian:trixie AS base
ARG REPO
ARG PACKAGE_DIR
ARG BRANCH
ARG TAG
ARG VERSION
ARG CONTAINER_TRACIM_DIR
RUN apt-get update \
   && apt-get upgrade -qy \
   && apt-get install apt-utils git -qy
COPY ./clone_repo.sh /clone_repo.sh
RUN /clone_repo.sh "${REPO}" "${BRANCH}" "${TAG}" "${CONTAINER_TRACIM_DIR}"
RUN rm /clone_repo.sh
COPY ./tracim_set_version.sh /tracim_set_version.sh
RUN /tracim_set_version.sh "${VERSION}" "${CONTAINER_TRACIM_DIR}"
RUN rm /tracim_set_version.sh
RUN apt-get install -qy --no-install-recommends \
    $(cat "${PACKAGE_DIR}/run_backend_packages.list") \
    && apt-get autoremove -qy \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/ /tmp/* /var/tmp/*


###
# Backend install stage
####
# Stage which:
# - installs python dependencies
# - installs tracim backend
# - installs optional dependencies
####
FROM base AS build_backend
# 2026-07-20 - INFO - PGO PIP_BREAK_SYSTEM_PACKAGES env var to workaround "This environment is externally managed" error
# this would happen since Debian 12, see https://pythonspeed.com/articles/externally-managed-environment-pep-668/
ENV PIP_BREAK_SYSTEM_PACKAGES=1
ARG PACKAGE_DIR
# required packages for building the backend dependencies
RUN apt-get install -qy $(cat "${PACKAGE_DIR}/build_backend_packages.list") \
    # Go in backend folder \
    && cd /tracim/backend \
    #--- pip install section \
    # 2026-07-20 - INFO - PGO \
    # With Debian 12 Bullseye we were using `--force-reinstall` to force installing our Python packages instead of the system Python packages \
    # This is no longer possible with Debian 13 Trixie : apt-installed Python packages are shipped without RECORD files (PEP 668) so pip cannot uninstall them \
    # instead we are using `--ignore-installed` which writes everything fresh into `/usr/local/ instead`. \
    && pip install --ignore-installed \
    -r requirements-build.txt \
    -r requirements.txt \
    -r requirements-db-postgres.txt \
    -r requirements-db-mysql.txt \
    -r requirements-storage-s3.txt \
    -r requirements-full-preview-generator.txt \
    -e "."
RUN cp -r /tracim/frontend/dist/assets/font/Nunito/ /usr/share/fonts/nunito


###
# Frontend build stage
####
# Stage which:
# - installs javascript dependencies
# - setups backend translation
# - builds frontend
####
FROM debian:trixie AS build_frontend
COPY --from=base /tracim /tracim
ARG TRACIM_GANTT_ENABLED
# 2026-07-20 - INFO - PGO D.A Install Node.js 16 via nvm (nodejs is available in Trixie but this is not the v16 - which is required for Tracim build)
ENV NVM_DIR=/root/.nvm
RUN apt-get update \
    && apt-get install -qy curl bash \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install v16.20.2
ENV PATH="$NVM_DIR/versions/node/v16.20.2/bin:$PATH"
RUN \
    npm install -g yarn \
    && cd /tracim/backend \
    && npm install "i18next-conv@<8" -g \
    && ./update_i18n_json_file.sh
# Install frontend
RUN \
    cd /tracim/ \
    && ./install_frontend_dependencies.sh root \
    && ./build_full_frontend.sh
# Clean frontend installation
RUN \
    rm -rf /tracim/frontend*/node_modules \
    && rm -rf /tracim/node_modules


FROM base

LABEL org.opencontainers.image.authors="contact@tracim.fr"

ENV DEFAULT_APP_LIST="contents/thread,contents/file,contents/html-document,contents/folder,contents/kanban,contents/todo,contents/logbook,share_content,upload_permission,gallery"
ENV START_WEBDAV=1
ENV START_CALDAV=1
ENV ENABLE_COLLABORATIVE_DOCUMENT_EDITION=0
ENV TRACIM_CONFIG__FILEPATH="/etc/tracim/development.ini"
ENV LANG=C.UTF-8
ENV LANGUAGE=C.UTF-8
ENV LC_ALL=C.UTF-8
ARG PACKAGE_DIR
# Install Pushpin from official pushpin.org apt repository (not available in Trixie)
RUN apt-get install -qy curl gpg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://pushpin.org/pushpin-package.asc | gpg --dearmor -o /etc/apt/keyrings/pushpin.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/pushpin.gpg] https://packages.pushpin.org/deb pushpin-jammy main" > /etc/apt/sources.list.d/pushpin.list \
    && apt-get update \
    # HACK - PGO - 2026-08-11 Pushpin is in server_packages.list but doing install directly to avoid googleapis 400 bad request error (#6924) \
    && apt-get install -qy pushpin
RUN apt-get install -qy $(cat "${PACKAGE_DIR}/server_packages.list" "${PACKAGE_DIR}/optional_preview_packages.list") vim wget curl \
    && apt-get autoremove -qy \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/ /tmp/* /var/tmp/* \
    # Remove default apache2 conf \
    && rm /etc/apache2/sites-enabled/000-default.conf \
    # Do not show apache version \
    && sed -i "s|ServerTokens OS|ServerTokens Prod|g" /etc/apache2/conf-enabled/security.conf \
    && sed -i "s|ServerSignature On|ServerSignature Off|g" /etc/apache2/conf-enabled/security.conf

# Tracim code: backend
COPY --from=build_backend /tracim /tracim
# backend dependencies installed through pip
COPY --from=build_backend /usr/local /usr/local
# backend font to generate avatars
COPY --from=build_backend /usr/share/fonts/nunito /usr/share/fonts/nunito
# 2026-07-20 - INFO - PGO Pre-build system font cache and create www-data's per-user cache/config dirs.
# Without these, fontconfig and inkscape attempt to write to /var/www/.cache and /var/www/.config
# at runtime as www-data and fail with "No writable cache directories" / "Permission denied".
RUN fc-cache -f \
    && mkdir -p /var/www/.cache/fontconfig /var/www/.config/inkscape \
    && chown -R www-data:www-data /var/www/.cache /var/www/.config
# Tracim code: frontend
COPY --from=build_frontend /tracim/frontend/dist /tracim/frontend/dist
# backend translation
COPY --from=build_frontend /tracim/backend/tracim_backend/locale /tracim/backend/tracim_backend/locale

VOLUME ["/etc/tracim", "/var/tracim"]
EXPOSE 80

CMD ["/bin/bash","/tracim/tools_docker/Debian_Uwsgi/entrypoint.sh"]
