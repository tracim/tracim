# Tracim lib

This project is used to centralize generic components that are used either in Tracim and in Tracim's apps.

### For development
While working on Tracim and on tracim_lib, if you change tracim_lib, for the changes to be effective in Tracim you must:
- run `$ npm run build` on tracim_lib
- add the generated dist/tracim_lib.js to git stage
- commit and push changes to tracim_lib
- increase version number of tracim_lib (package.json)
- commit push the new version
- run `$ npm update tracim_lib` in Tracim to get the new version

The debug.js file is used for all app debug files and it's based at debug.js.sample file. To adapt the template to your system you must change the variables:
 - loggedUser: object in which all parameters must be changed in relation to the current user logged on in Tracim

#### Alternatively you can (faster for development)
- create a link of tracim_lib using npm: in tracim_lib `$ npm link`
- get that link in tracim: in tracim (repo) `$ npm link tracim_lib`
- in tracim_lib: run `$ npm run build`

now, you only have to rebuild tracim_lib and tracim will update it's tracim_lib dependency automatically

Problem: eslint will parse tracim_lib.js since it will come from another repository.

Solution: you must add `/* eslint-disable */` at the beginning and  `/* eslint-enable */` at the end of tracim_lib.js

To automatize this: build tracim_lib with that command:

`npm run build && echo '/* eslint-disable */' | cat - dist/tracim_lib.js > temp && mv temp dist/tracim_lib.js && printf '\n/* eslint-enable */\n' >> dist/tracim_lib.js`

You can also create an alias for this in your .bashrc
