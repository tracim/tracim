App Thread for Tracim
===================

This folder is a feature app loaded by Tracim.

It is meant to handle Tracim contents of type thread.

Threads are real time discussion between any users that have access to the space.

The app allows creation, renaming, status change and suppression of the content.


### Build the app

#### For production

see [FrontEnd dev doc](/docs/developer/setup_env/setup_frontend.md#production)

#### For development

see [FrontEnd dev doc](/docs/developer/setup_env/setup_frontend.md#development)

##### Specific `debug.js` configuration

- Create a content of type thread (in any space) using Tracim's frontend interface
- In `src/debug.js`, change:
  - `content.content_id` to the id of the content you just created
  - `content.workspace_id` to the id of the space you just created the content in

___

### Other available yarn scripts

see [Yarn Scripts doc](/docs.legacy/development/frontend/scripts.md)

### Before pushing changes to this app, you must

see [Before Push doc](/docs/contribution/code/before_push.md)
