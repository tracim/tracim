# Frontend Tests

To run frontend test, you need to be able to build the frontend.
See [frontend_build](/docs/development/frontend_build.md).

## Unit tests

Run frontend unit test using node 16.
```bash
nvm install 16
nvm use 16
```

Run every frontend unit tests
```bash
./run_frontend_unit_test.sh
```

Run frontend tests of a single app
```bash
cd <frontend_app_folder>
yarn run test
```

Example, to test the `file` frontend application:
```bash
cd frontend_app_file
yarn run test
```


## Functional tests

### Prerequisites

Install Cypress
```bash
./setup_functionnal_tests.sh
```
This script uses sudo, make sure it is installed and configured.
Alternatively, under root:
```bash
./setup_functionnal_tests.sh root
```

Run every functional tests
```bash
./run_dev_backend.sh cypress run
```

Open Cypress UI
```bash
./run_dev_backend.sh cypress open
```

For more advanced usage, refer to the [cypress documentation](https://docs.cypress.io/).

### Information

Cypress tests run on their own database.
But it doesn't use their own `depot/` folder.
`depot/` folder stores the files uploaded in app file or some other data.
This means that running Cypress tests will break your uploaded files.
