# App Kanban for Tracim

This repo is an app loaded by Tracim.

### Development
To see your changes without importing the app into Tracim you need to be logged in to the frontend's dev server to have an auth cookie an run:
- run `yarn run servdev`
Which will create a web server (webpack) where you will see the app loaded with some default values.
For this command the configuration file debug.js is used which follows the template of the file debug.sample.js. To adapt the configuration to your content, you need to change the variables:
 - content_id: integer
 - workspace_id: integer
 - apiUrl: /api (this can be a full URL)
