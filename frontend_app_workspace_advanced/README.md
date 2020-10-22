# App Workspace Advanced for Tracim

This repo is an app loaded by Tracim.

### To update this repo
- commit and push changes
- run `$ npm run build`
- copy dist/pageHtml.app.js and past it into Tracim(repo)/dist/app

### Development
To see your changes without importing the app into Tracim you need to be logged in to the frontend's dev server to have an auth cookie an run:
- run `$ npm run servdev`
Which will create a web server (webpack) where you will see the app loaded with some default values
For this command the configuration file debug.js is used which follows the template of the file debug.sample.js. To adapt the configuration to your content, you need to change the variables:
 - workspaceId: integer
 - agendaUrl: string composed of 'http://MACHINE_ADRESS/agenda/workspace/${workspaceId}/'
 - contentReadStatusList: array of integers
 - description: string
 - label: string
 - memberList: array of objects
 - recentActivityList: array of objects
 - apiUrl: /api (this can be a full URL)
 - slug: string
Another needed configuration is made in the backend/development.ini, where you need to add http://MACHINE_ADRESS:8076 in to the variable cors.access-control-allowed-origin
