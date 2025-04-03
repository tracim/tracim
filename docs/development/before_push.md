# Before push

## Backend

### Pre-commit

To enforce most required guidelines, please use [pre-commit](https://pre-commit.com/).  
This will perform some automatic checks before committing.  
This is required to contribute to Tracim.

Install pre-commit:
```bash
pip install -r requirements-dev.txt
pre-commit install
```

It will run automatically when using `git commit`.

### Tests

Run backend tests.  
See [testing backend](/docs/development/test/backend_test.md).

### Translation

Generate backend translation files.  
See [i18n-backend](/docs/development/i18n/i18n-backend.md).

## Frontend

Before pushing modifications to the frontend code (any folders starting with "frontend"), you must:

### Lint and unit tests

Run the script for linting and unit tests without any errors.  
See [testing frontend](/docs/development/test/frontend_test.md).

### Translation

If you have added or edited translation keys, run the translation generation script:
```bash
yarn run build:translation
```

If you want to contribute to the keys not translated, you can use the [Weblate](https://hosted.weblate.org/projects/tracim/) platform.  
Notify your PR if some translations are missing.

More information in [i18n-frontend](/docs/development/i18n/i18n-frontend.md).
