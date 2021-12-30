App Workspace Advanced for Tracim
===================

This folder is a feature app loaded by Tracim.

It is meant to manage Tracim spaces.

It allows changing the description, the name, the default role, the member list and their roles, the activation of optional features and to delete the space.

### Build the app

#### For production

see [frontend/doc/app_building#Production](../frontend/doc/app_building.md#production)

#### For development

see [frontend/doc/app_building#Development](../frontend/doc/app_building.md#development)

##### Specific `debug.js` configuration

- Create a content of type file (in any space) using Tracim's frontend interface
- In `src/debug.js`, change:
  - `content.workspace_id` to the id of the space you just created the content in

___

### Other available yarn scripts

see [frontend/doc/yarn_scripts.md](../frontend/doc/yarn_scripts.md)

### Before pushing changes to this app, you must

see [frontend/doc/before_push.md](../frontend/doc/before_push.md)
