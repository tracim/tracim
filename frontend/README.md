# The Tracim Frontend

This project is the frontend part of Tracim.

## Installation

Install all dependencies
`$ npm install`

Build the sources
`$ npm run build`

Load `dist/index.html` in your webserver.

## Development

Install all dependencies
`$ npm install`

Start development server (webpack dev server)
`$ npm run servdev`

Alternatively, you can use `$ npm run servdev-dashboard` to use webpack-dashboard to have a better server interface.

Start mockapi server
`$ npm run mockapi`


## Apps

Tracim is a skeleton that rely on apps to do stuffs. (like to manage Documents, Files, Threads ...)

Apps all are independant React applications and have their own repositories and can be freely added or removed from Tracim without the needs for a rebuild.

Apps acts like plugins.

### To add Apps to your Tracim instance

You need to separately get the built version of each apps and add them to `dist/app` folder. Apps file names should be of the form of '__appName__.app.js'.

To do that
1) go to each Apps repositories; currently 2: (more to come)
- https://github.com/tracim/tracim_frontend_app_pagehtml
- https://github.com/tracim/tracim_frontend_app_thread
2) install and build the sources `npm install && npm run build`
3) copy the __appRepository__/dist/__appName__.app.js file generated and past it to tracim_frontend/dist/app folder

By default, for development, the Tracim frontend expects every apps but wont crash if one is missing (currenlt not all of them are exists anyway)

## Developing Apps

Apps are independents React application so you can test them out on their own.

/!\ Documentation on Apps interface is work in progress. /!\

To test them inside Tracim, you need to build them and copy-past them to `tracim_frontend/dist/app`.

You also need to make the mock api able to tell the Tracim Frontend that it handle you app:
- add an entry for you App in tracim_frontend/jsonserver/static_db.json in the `app_config` property
- reload your mock api server
- add the source of your app in tracim_frontend/dist/index.html and an entry to the switch case of the function `GLOBAL_renderAppFeature`. All of this will be handled by backend later on, this is all work in progress stuffs.


## URL list
- __/__ => detail of the first workspace
- __/login__ => login page
- __/workspace/:idws__ => detail of the workspace :idws
- __/workspace/:idws/content/:idc__ => detail of the workspace :idws with the app of the content :idc openned
- __/account__ => profile page of the connected user
- __/dashboard__ => dashboard of a workspace (code not plugged in therefore no :idws in url) 

## Documentation
- [doc/i18n.md](doc/i18n.md): How to Translate the Frontend
