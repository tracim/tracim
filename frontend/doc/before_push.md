### Before push

Before pushing modifications to the frontend code (any folders starting with "frontend"), you must

###### 1) Linting and unit tests
Run the script for linting and unit tests without any errors

    yarn run test

###### 2) Translation
Run the translation generation script and if you want to contribute to the keys not translated, you can use the [Weblate](https://hosted.weblate.org/projects/tracim/) platform. Notify your PR if some translations are missing.

    yarn run build:translation

If the translation you want to add is a caldav file (named `frontend_lib/caldav_translation/{language code}/translation.json`), in addition to translating on the Weblate platform you will have to modify `frontend_lib/dist/assets/_caldavzap/localization.js`:

  - If the language and you modified existing translations: update the string in the `.js` file. Don't forget to escape special characters (e.g. `'` => `\'`)
  - If the language exist and you added translations: find the right location in the `.js` file and add the key to all languages + the translation or an empty string. Don't forget to escape special characters (e.g. `'` => `\'`)
  - If the language does not exist:
    - Add the four objects below (at the end if the file?)
      - localization[`{language code}`]
      - localizationShared[`{language code}`]
      - localizationSharedCalDAV[`{language code}`]
      - localizationCalDAV[`{language code}`]
    - Add the right keys and translations in each object. Don't forget to escape special characters and do not quote `true`/`false` values (e.g. `_default_AMPM_format_` key).
