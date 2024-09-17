# Tracim

![logo_tracim](./docs/development/logos/logo_tracim.png)

[Tracim](https://www.tracim.fr) is a tool designed to help you and your team to a better collaboration.
It's officially supported in Arabic, English, French, German and Portuguese.

Any questions, remarks? Reach us on [Tracim Community](https://public-community.tracim.fr).  
More informations on our [website](https://www.tracim.fr).

All documentations are available directly in [/docs/](/docs/) folder.

## Quick start (using Docker)

An easy way to start using Tracim is to use the [Docker image](https://hub.docker.com/r/algoo/tracim/).

```bash
mkdir -p ~/tracim/etc
mkdir -p ~/tracim/var
docker run \
    -e DATABASE_TYPE=sqlite \
    -e TRACIM_WEBSITE__BASE_URL=http://{ip_address}:{port} \
    -p 8080:80 \
    -v ~/tracim/etc:/etc/tracim \
    -v ~/tracim/var:/var/tracim \
    algoo/tracim:latest
```

Then, you can access the application at <http://localhost:8080>

The credentials to access the application are:

- email: `admin@admin.admin`
- password: `admin@admin.admin`

<!-- We have to update Docker documentation according to this one -->
For advanced docker-based usage, look at the full [Tracim Docker documentation](./tools_docker/)

## Build Tracim from source

See [Building Tracim from source](./docs/development/app_building.md)

## Testing Tracim

In order to test in a development context, see [Testing Tracim](./docs/development/test/testing.md)

## Run Tracim for production

If you are interested in production-ready deployment of tracim, then look at the [Tracim administration documentation](./docs/administration), which includes 3 main parts:

- [Installation](./docs/administration/installation) and an entry point for [production installation](./docs/administration/installation/production.md)
- A second part dedicated to [Tracim server configuration](./docs/administration/configuration)
- A third part dedicated to [Exploitation of a Tracim server](./docs/administration/exploitation) (CLI commands, database migrations, etc)

## Contribute

There are several ways to contribute to Tracim, here are some tips:

- Submit [bugs and feature requests](https://github.com/tracim/tracim/issues)
- Review the [code and propose changes](https://github.com/tracim/tracim/pulls)
- Contribute to the [translations](https://hosted.weblate.org/projects/tracim/)

<!-- We should explain in CONTRIBUTING.md how to build from source,   -->
<!-- how to start tests, the code guidelines we respect how to submit -->
<!-- a pull request, how to find an issue to work on and how to       -->
<!-- contribute to the translations.                                  -->
For more information about contributing to Tracim, see the [Contributing to Tracim](./CONTRIBUTING.md) page.

## Translation status

We are adding to Tracim interface every translations that once reached 50%.

![Translation status](https://hosted.weblate.org/widgets/tracim/en/multi-auto.svg)

## Licence

Tracim is distributed under the terms of 4 distinct licenses. See [LICENSE.md](./LICENSE.md) for details

## Support

<img src="docs/development/logos/logo_weblate.png" alt="logo_weblate" width="200"/>

[Weblate](https://weblate.org) is an open source translation service, they are helping us to translate Tracim by providing a hosting service.

<img src="docs/development/logos/logo_browserstack.png" alt="logo_browserstack" width="150"/>

[BrowserStack](https://www.browserstack.com) supports open source projects, and graciously helps us testing Tracim on every devices.

<!-- END -->
