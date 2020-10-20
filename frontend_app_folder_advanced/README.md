# App Folder Advanced for Tracim

This repo is the advanced mode on the folder app loaded by Tracim.

### Development
To see your changes without importing the app into Tracim you need to be logged in to the frontend's dev server to have an auth cookie an run:
- run `$ npm run servdev`
Which will create a web server (webpack) where you will see the app loaded with some default values.
For this command the configuration file debug.js is used which follows the template of the file debug.sample.js. To adapt the configuration to your content, you need to change the variables:
 - content_id: integer
 - workspace_id: integer
 - apiUrl: /api (this can be a full URL)
Another needed configuration is made in the backend/development.ini, where you need to add http://MACHINE_ADRESS:8077 in to the variable cors.access-control-allowed-origin
