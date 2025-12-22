# Translating the Frontend

In each folder related to the frontend (frontend, frontend_app_..., frontend_lib), a folder i18next.scanner holds
translation files in JSON.

## I found a translation error, how do I fix it?

__If the error is in the translation key:__

Open an issue on [https://github.com/tracim/tracim/issues](https://github.com/tracim/tracim/issues).

If you are a developer and would like to fix it:

1. You must find the key in the corresponding `.jsx` file of that same repo
2. Fix the error
3. Rebuild the translation files with: `yarn build:translation`  
  This will add your new key in the translation files and remove the old one.
4. Commit/push your changes

__If the error is in the translations:__

You can make suggestions or, if you already have an account, modify them directly on [Weblate](https://hosted.weblate.org/projects/tracim/).

## I found an untranslated key in a language, how do I fix it?

An untranslated key leads to an English string appearing in the Tracim interface while using another language.

### The key appears in the `.json` file

Same as the errors: you can make suggestions or, if you already have an account, modify them directly on [Weblate](https://hosted.weblate.org/projects/tracim/).

### The key does not appear in the `.json` file

Open an issue on [https://github.com/tracim/tracim/issues](https://github.com/tracim/tracim/issues)
or rebuild the translation files with:

```bash
yarn build:translation
```

If the key still isn't in the `.json` file, it means the text in the `.jsx` file does not implement the translation process.

You can open an issue on [https://github.com/tracim/tracim/issues](https://github.com/tracim/tracim/issues).

If you want to resolve it, you must:

1. Find the corresponding `.jsx` file containing the untranslated key
2. Wrap the untranslated key with the translation function `t`  
For instance, `<div>My untranslated key</div>` will become `<div>{props.t('My untranslated key')}</div>`
3. Make sure that `t` in available in your component by wrapping it with the `translate()` HOC function as follows:

``` javascript
import React from 'react'
import { translate } from 'react-i18next'

class MyComponent extends React.Component {
  render () {
    return (<div>{this.props.t('My untranslated key')}</div>)
  }
}

export default translate()(MyComponent)
```

4. You can destruct `t` from `props` in the `render()` like it is done in most components.
5. Rebuild the translation files with: `yarn build:translation`
6. Commit/push your changes

### CalDav

If the translation you want to add is a caldav file
(named `frontend_lib/caldav_translation/{language code}/translation.json`),
in addition to translating on the Weblate platform you will have to modify `frontend_lib/dist/assets/_caldavzap/localization.js`.

- If the language exists, and you modified an existing translations: update the string in the `.js` file. Don't forget to escape special characters (e.g. `'` => `\'`)
- If the language exists, and you added translations: find the right location in the `.js` file and add the key to all languages + the translation or an empty string. Don't forget to escape special characters (e.g. `'` => `\'`)
- If the language does not exist:
  - Add the four objects below (at the end if the file?)
    - localization[`{language code}`]
    - localizationShared[`{language code}`]
    - localizationSharedCalDAV[`{language code}`]
    - localizationCalDAV[`{language code}`]
  - Add the right keys and translations in each object. Don't forget to escape special characters and do not quote `true`/`false` values (e.g. `_default_AMPM_format_` key).
