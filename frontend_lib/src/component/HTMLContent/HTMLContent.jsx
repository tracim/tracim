import React from 'react'
import PropTypes from 'prop-types'
import { CUSTOM_EVENT } from '../../customEvent.js'
// require('./HTMLContent.styl')

function onClick (e) {
  const t = e.target
  if (t instanceof HTMLAnchorElement && t.href && t.href.startsWith(location.origin + '/')) {
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REDIRECT, data: { url: t.href.substr(location.origin.length) } })
    e.preventDefault()
  }
}

const HTMLContent = (props) => (
  <article
    onClick={onClick}
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
