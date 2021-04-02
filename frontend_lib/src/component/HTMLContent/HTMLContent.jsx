import React from 'react'
import PropTypes from 'prop-types'
// require('./HTMLContent.styl')

const HTMLContent = (props) => (
  <article
    className={props.isTranslated ? 'html-content--translated' : 'html-content'}
    dangerouslySetInnerHTML={{ __html: props.children }}
  />
)

HTMLContent.propTypes = {
  isTranslated: PropTypes.bool
}

HTMLContent.defaultPropTypes = {
  isTranslated: false
}

export default HTMLContent
