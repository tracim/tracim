npm run buildwindoz && echo '/* eslint-disable */' | cat - dist/tracim_lib.js > temp && mv temp dist/tracim_lib.js && printf '\n/* eslint-enable */\n' >> dist/tracim_lib.js
