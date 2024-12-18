# Before push

## Backend

### Pre-commit

See pre-commit install in [CONTRIBUTING](/CONTRIBUTING.md#pre-commit)

### Tests

Run backend tests.
See [testing doc](/docs/development/test/testing.md#backend).

### Translation

Generate backend translation files.
See [i18n-backend](/docs/development/i18n/i18n-backend.md).

## Frontend

Before pushing modifications to the frontend code (any folders starting with "frontend"), you must

### Linting and unit tests

Run the script for linting and unit tests without any errors

```bash
yarn run test
```

### Translation

Run the translation generation script and if you want to contribute to the keys not translated, you can use the
[Weblate](https://hosted.weblate.org/projects/tracim/) platform. Notify your PR if some translations are missing.

```bash
yarn run build:translation
```

More information in [i18n-frontend](/docs/development/i18n/i18n-frontend.md).
