App Share Folder for Tracim
===================

This folder is a feature app loaded by Tracim.

It is meant to handle Tracim share folder in spaces that have the feature activated.

Share folders allows uploading files to a space without the need of being connected to Tracim or having an account.

This app allows the management (creation, suppression) of share links. Share links are the public links that shows a form to upload files into a space.


### Build the app

#### For production

see [FrontEnd dev doc](/docs/developer/setup_env/setup_frontend.md#production)

#### For development

see [FrontEnd dev doc](/docs/developer/setup_env/setup_frontend.md#development)

##### Specific `debug.js` configuration

- Create a space using Tracim's frontend interface
- Open advanced dashboard and check "Upload activated" and "Download activated"
- In `src/debug.js`, change:
  - `content.workspace_id` to the id of the space you just created

___

### Other available yarn scripts

see [Yarn Scripts doc](/docs.legacy/development/frontend/scripts.md)

### Before pushing changes to this app, you must

see [Before Push doc](/docs/contribution/code/before_push.md)
