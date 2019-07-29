# Tracim internationalization

## How to for Frontend part

In each frontend repo (frontend, frontend_app_..., frontend_lib), there is a folder i18next.scanner that holds every translation files in JSON.

### Important notice
:bulb: :warning: There is currently an unknown issue with some translation key that lead to a crash of apps on load.
  
While this issue is beeing resolved, the workaround is to not use '.' (dots) in translation keys and/or translation values.
  
:bug: see https://github.com/tracim/tracim/issues/1045 for more info
___

### I have found a translation error, how do I fix it ?

**If the error is in any language other than english:**

a) you can edit the values of the json files.

b) Then commit/push your changes

**If the error is in en.json:**

1) You must find the key in the according .jsx file of that same repo.

2) Fix the error
 
3) Rebuild the translation files with:

`npm run build-translation`

This will add your new key in the translation files and remove the old one.

4) Add translations for your new key in other .json files.

5) commit/push your changes

___

### I have found an untranslated key in a language, how do I fix it ?

It means you have found an english text even though you have selected another language. 

Do task a) and b) in the according .json file, in folder i18next.scanner.

___

### I have found an untranslated key in a language but the key does not appear in the .json file.

Do step 3).

If the key still isn't in the .json file, it means the text in the .jsx file does not implement the translation process.

So you must:

I) Find the according .jsx file that have your untranslated key

II) wrap your untranslated key in the translation function `t`:

Exemple: `<div>My untranslated key</div>` will become `<div>{this.props.t('My untranslated key')}</div>`

III) Check that `t` in available in your component, meanings your component must be wraped in the `translate()` higher order function

``` javascript
import React from 'react'
import { withTranslation } from 'react-i18next'

class MyComponent extends React.Component {
  render () {
    return (<div>{this.props.t('My untranslated key')}</div>)
  }
}

export default withTranslation()(MyComponent)
```

IV) You can destruct `t` from `this.props` in the `render()` like it is done in most components.

V) Do steps 3), 4), 5)
