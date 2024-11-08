import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { CUSTOM_EVENT } from '../../customEvent.js'

import Prism from 'prismjs'

/*
  INFO - G.B. - 2022-10-10 - To add a plugin, change babel.plugins.prismjs.plugins at frontend_lib/package.json
  The rest is done automatically by the Prism.highlightAll() command.
  For some plugins it is necessary to add extra things like line-numbers class name, to know all the
  details, click on the plugin name at https://prismjs.com/#plugins
*/

function onClick (e) {
  const t = e.target
  if (t instanceof HTMLAnchorElement && t.href && t.href.startsWith(location.origin + '/')) {
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REDIRECT, data: { url: t.href.substr(location.origin.length) } })
    e.preventDefault()
  }
}

const HTMLContent = (props) => {
  useEffect(() => {
    Prism.highlightAll()
  })

  return (
    <article
      onClick={onClick}
      className={classnames(
        'line-numbers',
        props.isTranslated ? 'html-content--translated' : 'html-content',
        props.showImageBorder ? 'showImageBorder' : ''
      )}
      dangerouslySetInnerHTML={{ __html: props.children }}
    />
  )
}

HTMLContent.propTypes = {
  isTranslated: PropTypes.bool,
  showImageBorder: PropTypes.bool,
}

HTMLContent.defaultProps = {
  isTranslated: false,
  showImageBorder: true,
}

export default HTMLContent
