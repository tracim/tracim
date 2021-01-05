App Collaborative Edition for Tracim
===================

This folder is an app loaded by Tracim.

It is meant to create and open collaborative documents.

Collaborative documents are contents of type File (handled by the app File) that can be opened using an online edition software.

The software used here is [Collabora Online](https://www.collaboraoffice.com/collabora-online/).

### How it works

The `index.js` expose a function `getOnlineEditionAction`.  
The app File call this function that returns the data to display the button to open the collaborative document in the app File.  
When the users click it, it redirects the url and the frontend handles the new route to call the function `renderAppFullscreen` of the `index.js` (which is the basic process for opening Tracim apps)  
The component then opened will create the iframe for Collabora Online.

### Build the app

#### For production

see [frontend/doc/app_building#Production](../frontend/doc/app_building.md#production)

#### For development

see [frontend/doc/app_building#Development](../frontend/doc/app_building.md#development)

##### Specific `debug.js` configuration

No specification required, you can only open the popup to create a collaborative document with servdev.

___

### Other available yarn scripts

see [frontend/doc/yarn_scripts.md](../frontend/doc/yarn_scripts.md)

### Before pushing changes to this app, you must

see [frontend/doc/before_push.md](../frontend/doc/before_push.md)
