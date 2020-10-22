# The Tracim Frontend

This project is the frontend part of Tracim.

## Installation

Install all dependencies
`$ yarn install`

Build the sources
`$ yarn run build`

Load `dist/index.html` in your webserver.

## Development

Install all dependencies
`$ yarn install`

Start development server (webpack dev server)
`$ yarn run servdev`

Start mockapi server
`$ yarn run mockapi`


## Apps

Tracim is a skeleton that runs apps to do the actual work. (like managing Documents, Files, Threads ...)

Apps are all independant React applications.
They can be freely added to or removed from Tracim without the need for a rebuild.
They can be run outside of Tracim as well.
In Tracim, they act as plugins.

### To add Apps to your Tracim instance

You need to separately get the built version of each apps and add them to `dist/app` folder.
App file names should be of the form of '__appName__.app.js'.

1. install and build the app using `yarn install && yarn run buildwithextvendors`
2. copy the bundle generated at `dist/__appName__.app.js` to tracim_frontend/dist/app folder

By default, for development, the Tracim frontend expects every apps but won't crash if one is missing.

## Developing Apps

Apps are independent React applications. They can be tested and run outside Tracim and tested using Webpack's servdev feature.

:warning: Documentation on Apps interface is work in progress.

To test them inside Tracim, you need to build them and copy the generated bundle to `tracim_frontend/dist/app`.
This is automatically done by the build script of the apps of this repository.

You also need to allow the mock api to tell the Tracim Frontend that it handles your app:
- add an entry for the app in tracim_frontend/jsonserver/static_db.json in the `app_config` property
- reload the mock api server
- add the source of your app in tracim_frontend/dist/index.html and an entry to the switch case of the function `GLOBAL_renderAppFeature`. All of this will be handled by backend later on. This is in a work in progress state.


## URL list
- __/__ => detail of the first workspace
- __/login__ => login page
- __/workspace/:idws__ => detail of the workspace :idws
- __/workspace/:idws/content/:idc__ => detail of the workspace :idws with the app of the content :idc openned
- __/account__ => profile page of the connected user
- __/dashboard__ => dashboard of a workspace (code not plugged in therefore no :idws in url)

## Documentation
- [doc/i18n.md](doc/i18n.md): How to Translate the Frontend
