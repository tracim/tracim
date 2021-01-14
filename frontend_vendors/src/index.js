/* eslint-disable quote-props */

module.exports = {
  classnames: require('classnames'),
  'core-js/stable': require('core-js/stable'),
  'date-fns': require('date-fns'),
  'lodash': require('lodash'),
  'lodash/debounce': require('lodash/debounce'),
  'prop-types': require('prop-types'),
  radium: require('radium'),
  react: require('react'),
  'react-dom': require('react-dom'),
  'react-image-lightbox': require('react-image-lightbox'),
  // INFO - CH - Keep the line below or <Link> components will fail
  // See https://github.com/tracim/tracim/issues/3999
  'react-router-dom': require('react-router-dom'),
  'regenerator-runtime/runtime': require('regenerator-runtime/runtime')
}
