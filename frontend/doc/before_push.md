### Before push

Before pushing modifications to the frontend code (any folders starting with "frontend"), you must

###### 1) Linting and unit tests
Run the script for linting and unit tests without any errors

    yarn run test

###### 2) Translation
Run the translation generation script and if you want to contribute to the keys not translated, you can use the [Weblate](https://hosted.weblate.org/projects/tracim/) platform. Notify your PR if some translations are missing.

    yarn run build:translation

If the translation you want to add is in the `frontend_lib/caldav_translation/{language code}/translation.json`, in addition to translating on the Weblate platform is required:

  - If the language already exists
    - and the key also exists, update the string at `frontend_lib/dist/assets/_caldavzap/localization.js` to the json file version escaping special characters (e.g. `'` => `\'`)
    - and the key does not exits, find the right location and add the key to all languages + the translation (with escape characters) or an empty string
  - If the language does not exists
    - Add the four objects below (at the end if the file?)
      - localization[`{language code}`]
      - localizationShared[`{language code}`]
      - localizationSharedCalDAV[`{language code}`]
      - localizationCalDAV[`{language code}`]
    - For each object add the good keys and translations, with escape characters and without simple quotes for true/false values (e.g. `_default_AMPM_format_` key)
