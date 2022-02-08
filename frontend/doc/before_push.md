### Before push

Before pushing modifications to the frontend code (any folders starting with "frontend"), you must

###### 1) Linting and unit tests
Run the script for linting and unit tests without any errors

    yarn run test

###### 2) Translation
Run the translation generation script and if you want to contribute to the translations marked `__NOT_TRANSLATED__`, you can use the [Weblate](https://hosted.weblate.org/projects/tracim/) platform. Notify your PR if some translations are missing.

    yarn run build:translation
