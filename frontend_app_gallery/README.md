App Gallery for Tracim
===================

This folder is a fullscreen app loaded by Tracim.

It is meant to display the "previewable" contents in a slider and a slideshow.

"previewable" means that [Preview Generator](https://github.com/algoo/preview-generator) can create a jpeg preview of the content.

The list of previewable format handled by Preview Generator is available [here](https://github.com/algoo/preview-generator/blob/develop/doc/supported_mimetypes.rst).

### Build the app

#### For production

see [doc/frontend/app_building#Production](../doc/frontend/app_building.md#production)

#### For development

see [doc/frontend/app_building#Development](../doc/frontend/app_building.md#development)

##### Specific `debug.js` configuration

- Create a folder and some content of type file (in any space) in it using Tracim's frontend interface
- In `src/debug.js`, change:
  - `config.folderId` to the id of the folder you just created

___

### Other available yarn scripts

see [doc/frontend/yarn_scripts.md](../doc/frontend/yarn_scripts.md)

### Before pushing changes to this app, you must

see [doc/frontend/before_push.md](../doc/frontend/before_push.md)
