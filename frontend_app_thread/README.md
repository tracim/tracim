App Thread for Tracim
===================

This folder is a feature app loaded by Tracim.

It is meant to handle Tracim contents of type thread.

Threads are real time discussion between any users that have access to the space.

The app allows creation, renaming, status change and suppression of the content.


### Build the app

#### For production

see [docs/development/app_building.md#Production](/docs/development/app_building.md#production)

#### For development

see [docs/development/app_building.md#Development](/docs/development/app_building.md#development)

##### Specific `debug.js` configuration

- Create a content of type thread (in any space) using Tracim's frontend interface
- In `src/debug.js`, change:
  - `content.content_id` to the id of the content you just created
  - `content.workspace_id` to the id of the space you just created the content in

___

### Other available yarn scripts

see [docs/development/yarn_scripts.md](/docs/development/advanced/yarn_scripts.md)

### Before pushing changes to this app, you must

see [docs/development/before_push.md](/docs/development/before_push.md)
