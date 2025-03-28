App File for Tracim
===================

This folder is a feature app that runs in Tracim.

It is meant to handle Tracim contents of any format. Allowing creating, renaming, download, status change, public share and modification. It also shows the history of the content and its comments.

It will try to generate a jpeg preview of the uploaded file using [Preview Generator](https://github.com/algoo/preview-generator). See [here](https://github.com/algoo/preview-generator/blob/develop/doc/supported_mimetypes.rst) the list of currently handled file format by Preview Generator.

This app also allows opening online collaborative edition documents.

### Build the app

#### For production

see [docs/development/app_building.md#Production](/docs/development/app_building.md#production)

#### For development

see [docs/development/app_building.md#Development](/docs/development/app_building.md#development)

##### Specific `debug.js` configuration

- Create a content of type file (in any space) using Tracim's frontend interface
- In `src/debug.js`, change:
  - `content.content_id` to the id of the content you just created
  - `content.workspace_id` to the id of the space you just created the content in

___

### Other available yarn scripts

see [docs/development/yarn_scripts.md](/docs/development/advanced/yarn_scripts.md)

### Before pushing changes to this app, you must

see [docs/development/before_push.md](/docs/development/before_push.md)
