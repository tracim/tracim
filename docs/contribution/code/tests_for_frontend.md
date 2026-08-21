# Frontend Tests

To run frontend test, you need to be able to build the frontend.
See [frontend_build](/docs.legacy/development/frontend_build.md).

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

### Run all tests

> [!IMPORTANT]
> By default Cypress will use your installed Chromium version.  
> You can use embedded Electron Chromium version by using the Cypress home screen

Run every functional tests
```bash
./run_dev_backend.sh cypress run
```

### Run specific tests

Open Cypress UI, allowing the selection of a specific test
```bash
./run_dev_backend.sh cypress open
```

Directly launch a specific test:

```bash
./run_dev_backend.sh cypress run --spec "cypress/e2e/app_agenda/switching_app_agenda.cy.js"
```

> [!NOTE]
> `run_dev_backend.sh` can pass its parameters to Cypress since september 2026 (#6930)

> [!WARNING]
> By default, Cypress will use its embedded Electron browser, which can be quite old.  
> To use a locally installed browser, use the `--browser` parameter (see below)

> [!TIP]
> Other available params:
> - `--headed`: opens up a browser window
> - `--no-exit`: keep the browser window opened
> - `--browser chromium`: use locally installed Chromium


### Information

> [!NOTE]
> For more advanced usage, refer to the [cypress documentation](https://docs.cypress.io/).


Cypress tests run on their own database.
But it doesn't use their own `depot/` folder.
`depot/` folder stores the files uploaded in app file or some other data.
This means that running Cypress tests will break your uploaded files.
