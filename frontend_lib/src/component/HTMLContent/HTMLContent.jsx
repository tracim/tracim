import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Prism from 'prismjs'
import { CUSTOM_EVENT } from '../../customEvent.js'

/*
  INFO - G.B. - 2022-10-10 - To add a plugin, change babel.plugins.prismjs.plugins at frontend_lib/package.json
  The rest is done automatically by the Prism.highlightAll() command.
  For some plugins it is necessary to add extra things like line-numbers class name, to know all the
  details, click on the plugin name at https://prismjs.com/#plugins
*/

function onClickHtmlContentText (e) {
  const t = e.target
  if (t instanceof HTMLAnchorElement && t.href && t.href.startsWith(location.origin + '/')) {
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REDIRECT, data: { url: t.href.substr(location.origin.length) } })
    e.preventDefault()
  }
}

const HTMLContent = (props) => {
  const refHTMLContent = useRef(null)

  useEffect(() => {
    Prism.highlightAllUnder(refHTMLContent.current)
  }, [props.children])

  return (
    <article
      ref={refHTMLContent}
      onClick={onClickHtmlContentText}
      className={classnames(
        'line-numbers',
        props.isTranslated ? 'HTMLContent--translated' : 'HTMLContent',
        props.showImageBorder ? 'showImageBorder' : ''
      )}
      dangerouslySetInnerHTML={{ __html: props.children }}
    />
  )
}

export default HTMLContent

HTMLContent.propTypes = {
  isTranslated: PropTypes.bool,
  showImageBorder: PropTypes.bool
}

HTMLContent.defaultProps = {
  isTranslated: false,
  showImageBorder: true
}
