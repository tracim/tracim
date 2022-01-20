# Concourse

## Tracim's CI
```
https://ci.algoo.fr:4443
```
use your github credentials

## Download fly

Fly is a utility tool to access concourse docker images

linux: https://ci.algoo.fr:4443/api/v1/cli?arch=amd64&platform=linux

macos: https://ci.algoo.fr:4443/api/v1/cli?arch=amd64&platform=darwin

windows: https://ci.algoo.fr:4443/api/v1/cli?arch=amd64&platform=windows

## Access the docker images

Create a target logged with your github account
```
fly --target algoo login --team-name algoo --concourse-url https://ci.algoo.fr:4443
```

List all available images to look for their ids
```
fly builds
```

Connect to a specific docker image by its id
```
fly -t algoo intercept -b build_id
```
