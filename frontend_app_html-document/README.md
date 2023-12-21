App Html Document for Tracim
===================

This folder is a feature app loaded by Tracim.

It is meant to handle Tracim html document which are text document that allows text formatting. It allows creating, renaming, download, status change, public share and modification, and shows the history of the content and its comments.

### Build the app

#### For production

see [doc/frontend/app_building#Production](../doc/frontend/app_building.md#production)

#### For development

see [doc/frontend/app_building#Development](../doc/frontend/app_building.md#development)

##### Specific `debug.js` configuration

- Create a content of type html document (in any space) using Tracim's frontend interface
- In `src/debug.js`, change:
  - `content.content_id` to the id of the content you just created
  - `content.workspace_id` to the id of the space you just created the content in
  
___

### Other available yarn scripts

see [doc/frontend/yarn_scripts.md](../doc/frontend/yarn_scripts.md)

### Before pushing changes to this app, you must

see [doc/frontend/before_push.md](../doc/frontend/before_push.md)
