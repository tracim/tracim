App Collaborative Edition for Tracim
===================

This folder is a fullscreen app loaded by Tracim.

It is meant to create and open collaborative documents.

Collaborative documents are contents of type File (handled by the app File) that can be opened using an online edition software.

The software used here is [Collabora Online](https://www.collaboraoffice.com/collabora-online/).

### How it works

The `index.js` expose a function `getOnlineEditionAction`.  
The app File call this function that returns the data to display the button to open the collaborative document from the app File.  
When the users click it, it redirects the url, and the frontend handles the new route to call the function `renderAppFullscreen` of the `index.js` (which is the basic process for opening Tracim apps)  
The opened component will then create the iframe for Collabora Online.

### Build the app

#### For production

see [docs/development/app_building.md#Production](/docs/development/app_building.md#production)

#### For development

see [docs/development/app_building.md#Development](/docs/development/app_building.md#development)

##### Specific `debug.js` configuration
none

___

### Other available yarn scripts

see [docs/development/yarn_scripts.md](/docs/development/advanced/yarn_scripts.md)

### Before pushing changes to this app, you must

see [docs/development/before_push.md](/docs/development/before_push.md)
