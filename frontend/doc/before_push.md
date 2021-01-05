### Before push

Before pushing modifications to the frontend code (any folders starting with "frontend"), you must

###### 1) Run the script for linting and unit tests without any errors

    yarn run test

###### 2) Run the translation generation script and update any values marked `__NOT_TRANSLATED__` at least in the english translation ([here](./i18next.scanner/en/translation.json)). Notify your PR if some translations are missing

    yarn run build-translation
