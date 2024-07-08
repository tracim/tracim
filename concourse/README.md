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

## Get the screenshot of failing Cypress test

List the first <number_image> available image from algoo CI
```
./fly builds -t algoo -c <number_image>
```

Create a file where you want to retrieve the image on local
```
touch <local_file_location>
```

Recuperate the image to the file created from it
```
./fly hijack -t <team_name> -b <build_id> -s <step_name> cat <image_location> > <local_file_location>
```

### Where

- <number_image>: number of image wanted, by default is 50
- <team_name>: `algoo`
- <build_id>: first column of `./fly builds -t algoo`
- <step_name>: `end-to-end-cypress-tests`
  - other available values are
    - end-to-end-cypress-tests
    - pull-request
    - tracim-status-update
- <imgae_location>: failed test in concourse will display the location after "(Screenshots)"
- <local_file_location>: local file to put the screenshot in
