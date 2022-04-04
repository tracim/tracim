# Tracim

![logo_tracim](logo_tracim.png)

<!-- Display code coverage here -->

## What is Tracim?

[Tracim](https://www.algoo.fr/fr/tracim) is a **free** and **open source** collaborative platform software intended for team collaboration. Providing a lot of [features](), it is simple to use, offers a user-friendly interface and runs on every computer.

<!-- Add better description here -->

[Tracim](https://www.algoo.fr/fr/tracim) is officially supported in Arabic, English, French, German and Portuguese.


<!-- To move to the bottom (and add english version) -->
More information on the website: https://www.tracim.fr

## Quick start (using Docker)

An easy way to start using Tracim is to use the [Docker image](https://hub.docker.com/r/algoo/tracim/).

```
mkdir -p ~/tracim/etc
mkdir -p ~/tracim/var
docker run -e DATABASE_TYPE=sqlite -p 8080:80 -v ~/tracim/etc:/etc/tracim -v ~/tracim/var:/var/tracim algoo/tracim
```
Then, you can access the application at http://localhost:8080

The credentials to access the application are:

- email: `admin@admin.admin`
- password: `admin@admin.admin`

<!-- We have to update Docker documentation according to this one -->
For more advanced docker-based usage, look at the full [Tracim Docker documentation](https://github.com/tracim/tracim/tree/develop/tools_docker)

## Contribute

There are several ways to contribute to Tracim, here are some tips:
 - Submit [bugs and feature requests](https://github.com/tracim/tracim/issues)
 - Review the [code and propose changes](https://github.com/tracim/tracim/pulls)
 - Contribute to the [translations](https://hosted.weblate.org/projects/tracim/)

<!-- We should explain in CONTRIBUTING.md how to build from source,   -->
<!-- how to start tests, the code guidelines we respect how to submit -->
<!-- a pull requrest, how to find an issue to work on and how to      -->
<!-- contribute to the translations.                                  -->
For more information about contributing to Tracim, see the [Contributing to Tracim](./CONTRIBUTING.md) page.

## Translation status

![Translation status](https://hosted.weblate.org/widgets/tracim/en/multi-auto.svg)

## Licence
See [LICENCE.md](./LICENCE.md)

## Build Tracim from source
See [Building Tracim from source](./doc/BUILD.md)

## Testing Tracim
See [Testing Tracim](./doc/TESTING.md)

## Run Tracim for production
See [Running Tracim for production](./doc/PRODUCTION.md)

<!-- END -->

<!-- [![logo_browserstack](logo_browserstack.png)](https://www.browserstack.com)

BrowserStack supports open source projects and graciously helps us testing Tracim on every devices. -->
