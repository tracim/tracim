# Concourse

Concourse files are in [/concourse/](/concourse/)

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

## Get the screenshot of the failing Cypress tests

### Helper script

`concourse/utils/fetch-cypress-screenshots.sh` allows to get all the screenshots of a build at one time.

> [!IMPORTANT]
> Requires being logged in already:  
> `fly --target algoo login`  
> See "Access the docker images" above for details

```bash
./concourse/utils/fetch-cypress-screenshots.sh [build_id] [output_dir] [fly_target]
```

- `build_id`:
  - first column of `fly -t algoo builds`
  - if omitted, it lists the 20 most recent **failed** builds and
  prompts you to pick one (`m` to show 20 more, `a` to toggle showing all
  statuses). `LIST_BUILD_COUNT` only controls how many are shown per page —
  under the hood it searches a much larger pool of builds (growing further on
  `m` if needed), so a failed build isn't missed just because other jobs filled
  up the most recent history.
- `output_dir`:
  - defaults to `./cypress-screenshots-<build_id>`  
  - if omitted defaults to
    `./cypress-screenshots-<build_id>-<build_label>`. Characters not safe
    in a directory name (`/ \ : * ? " < > |`) are replaced with `_`
- `fly_target`: defaults to `algoo`

> [!NOTE]
> Only works while the failed build's container still exists — Concourse
garbage-collects it a while after the build finishes, so run this soon after
a failure.

### Manually

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

#### Where

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

#### Example

```
touch /tmp/failed_cypress_test.png
./fly hijack -t algoo -b 137189888 -s end-to-end-cypress-tests cat /tmp/build/c061bd25/pull-request/functionnal_tests/cypress/screenshots/dashboard/information_spec.js/'Dashboard -- should show email notification dropdown (failed).png' > /tmp/failed_cypress_test.png
eog /tmp/failed_cypress_test.png
```
