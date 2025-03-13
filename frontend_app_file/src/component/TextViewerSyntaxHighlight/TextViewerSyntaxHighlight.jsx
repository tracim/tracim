import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { HTMLContent } from 'tracim_frontend_lib'

require('./TextViewerSyntaxHighlight.styl')

export const TextViewerSyntaxHighlight = (props) => {
  const [contentAsText, setContentAsText] = useState('')

  useEffect(() => {
    if (!props.contentRawUrl || !props.language) return

    async function loadContentAsText (rawUrl) {
      const contentResponse = await fetch(rawUrl)
      const contentAsText = await contentResponse.text()

      // INFO - CH - 2025-03-12 - Don't add line break on the line bellow.
      // They would be interpreted by Prism js which would break the design
      const contentWithPrismJsWrapper = `
        <pre class='language-${props.language}'><code>${contentAsText}</code></pre>
      `

      setContentAsText(contentWithPrismJsWrapper)
    }

    loadContentAsText(props.contentRawUrl)
  }, [props.contentRawUrl])

  return (
    <div className='TextViewerSyntaxHighlight'>
      <HTMLContent>{contentAsText}</HTMLContent>
    </div>
  )
}

export default TextViewerSyntaxHighlight

TextViewerSyntaxHighlight.propTypes = {
  contentRawUrl: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired
}
