import React from 'react'
import PropTypes from 'prop-types'
import { CUSTOM_EVENT } from '../../customEvent.js'

import Prism from 'prismjs'

import 'prismjs/plugins/line-numbers/prism-line-numbers.js'
import 'prismjs/plugins/toolbar/prism-toolbar.js'
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.js'

import 'prismjs/components/prism-java'

/*
  INFO - G.B. - 2022-09-28 - Apparently to add a plugin, you just import it, the rest is done automatically by the Prism.highlightAll() command.
  The same is true for the support of new languages.
  Also, a new css file has been added in frontend/dist/assets/prism.css.
  This file is generated on the Prism website according to the options chosen. See https://prismjs.com/download.html
*/

function onClick (e) {
  const t = e.target
  if (t instanceof HTMLAnchorElement && t.href && t.href.startsWith(location.origin + '/')) {
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REDIRECT, data: { url: t.href.substr(location.origin.length) } })
    e.preventDefault()
  }
}

const HTMLContent = (props) => {
  Prism.highlightAll()
  return (
    <article
      onClick={onClick}
      className={`line-numbers ${props.isTranslated ? 'html-content--translated' : 'html-content'}`}
      dangerouslySetInnerHTML={{ __html: props.children }}
    />
  )
}

HTMLContent.propTypes = {
  isTranslated: PropTypes.bool
}

HTMLContent.defaultPropTypes = {
  isTranslated: false
}

export default HTMLContent
