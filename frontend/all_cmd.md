
# First Install Tracim

## tracim_frontend_lib

A generic repo containing generic components for `tracim_frontend_lib` and apps.

#### get the source of tracim_frontend_lib

```
git clone git@github.com:tracim/tracim_frontend_lib.git
```

#### install tracim_frontend_lib

```
cd tracim_frontend_lib
npm i
```

#### build tracim_frontend_lib and add the "eslint-disabled" and "eslint-enable" on top and bottom of builded file

```
npm run build && echo '/* eslint-disable */' | cat - dist/tracim_lib.js > temp && mv temp dist/tracim_lib.js && printf '\n/* eslint-enable */\n' >> dist/tracim_lib.js
```

##### For Dev Only : Create a npm link for tracim_frontend_lib

```
npm link
```

Note: link is called tracim_lib, it will be changed

## tracim_frontend

The main repository

#### Get the Source of tracim_frontend

```
git clone git@github.com:tracim/tracim_frontend.git
```

#### install tracim_frontend

```
cd tracim_frontend
npm i
```

#### For Dev Only : Link tracim_frontend to tracim_frontend_lib with npm

```
npm link tracim_lib
```

This will replace the remote dependency tracim_lib in package.json by local dependency tracim_frontend_lib allowing auto propagation of tracim_frontend_lib updates without having to increment the version number

#### build tracim_frontend

```
npm run build
```

## Tracim Apps

For EACH app, do: (here, tracim_frontend_app_pagehtml as an exemple)

#### Get the Source of the App

```
git clone git@github.com:tracim/tracim_frontend_app_pagehtml.git
```

#### Install the App

```
cd tracim_frontend_app_pagehtml
npm i
```

#### For Dev Only: Link tracim_frontend_app_pagehtml to tracim_frontend_lib with npm

```
npm link tracim_lib
```

This will replace the remote dependency tracim_lib in package.json by local dependency tracim_frontend_lib allowing auto propagation of tracim_frontend_lib updates without having to increment the version number

#### build tracim_frontend

```
npm run build
```

#### copy the builded source to tracim_frontend

```
cp dist/pageHtml.app.js "tracim_frontend repo"/dist/app
```

# Update All Tracim

### For Development

```
cd tracim_frontend_lib
git pull origin develop
npm i
npm run build && echo '/* eslint-disable */' | cat - dist/tracim_lib.js > temp && mv temp dist/tracim_lib.js && printf '\n/* eslint-enable */\n' >> dist/tracim_lib.js
# the npm link will then update the lib in tracim_frontend and in all apps repositories
cd ..
./update_all_apps_develop.sh # this will update the repo app's, build the source and copy the result to tracim_frontend
cd tracim_frontend
git pull origin develop
npm i
npm run servdev-dashboard
```
#### update_all_apps_develop.sh :
```
#!/bin/bash
echo '=== Start build all apps
'
declare -a listApp=('pageHtml' 'thread')

for app in "${listApp[@]}"
do
  echo "= building of ${app}
"
  cd "folder of app"
  git pull origin develop
  npm i
  npm run build
  if cp ~/repo/tracim_app/${app}/dist/${app}.app.js ~/repo/tracim_frontend/dist/app ; then
    echo "- ${app}.app.js copy successful"
  else
    echo "=> ${app}.app.js copy failed"
  fi
done

echo '
=== End build'
```

### For Production
No need to build `tracim_frontend_lib`, each repo will get the last version with `npm i`. Assuming `tracim_frontend_lib` version in package.json has been updated accordingly.

```
./update_all_apps_master.sh # this will update the app's repo, build the source and copy the result to tracim_frontend
cd tracim_frontend
git pull origin master
npm i
npm run build
```
