import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { HTMLContent } from 'tracim_frontend_lib'
import FileTooHeavyWarning from '../FileTooHeavyWarning/FileTooHeavyWarning'

require('./TextViewerSyntaxHighlight.styl')

const SYNTAX_HIGHLIGHT_MAX_FILE_SIZE_IN_OCTET = 100000

export const TextViewerSyntaxHighlight = (props) => {
  const [contentAsText, setContentAsText] = useState('')
  const [shouldRunSyntaxHighlight, setShouldRunSyntaxHighlight] = useState(false)

  useEffect(() => {
    setShouldRunSyntaxHighlight(props.contentSize <= SYNTAX_HIGHLIGHT_MAX_FILE_SIZE_IN_OCTET)
  }, [props.contentSize])

  useEffect(() => {
    if (shouldRunSyntaxHighlight === false) return
    if (!props.contentRawUrl || !props.language) return

    async function loadContentAsText (rawUrl) {
      const contentResponse = await fetch(rawUrl)

      if (contentResponse.status !== 200 && contentResponse.status !== 204) {
        return
      }

      let contentResponseAsText = await contentResponse.text()
      if (props.language === 'html' || props.language === 'xhtml') {
        const div = document.createElement('div')
        // INFO - CH - 2025-03-21 - Line bellow makes browser convert contentResponseAsText to html entities
        // to be able to display unprocessed html
        div.textContent = contentResponseAsText
        contentResponseAsText = div.innerHTML
      }

      // INFO - CH - 2025-03-12 - Don't add line break on the line bellow.
      // They would be interpreted by Prism js which would break the design
      const contentWithPrismJsWrapper = `
        <pre class='language-${props.language}'><code>${contentResponseAsText}</code></pre>
      `

      setContentAsText(contentWithPrismJsWrapper)
    }

    try {
      loadContentAsText(props.contentRawUrl)
    } catch (e) {
      console.error('Error in TextViewerSyntaxHighlight', e)
      setContentAsText('')
    }
  }, [props.contentRawUrl, shouldRunSyntaxHighlight])

  return (
    <div className='TextViewerSyntaxHighlight'>
      {(shouldRunSyntaxHighlight
        ? <HTMLContent>{contentAsText}</HTMLContent>
        : (
          <FileTooHeavyWarning
            contentSize={props.contentSize}
            onRunAnyway={() => setShouldRunSyntaxHighlight(true)}
          />
        )
      )}
    </div>
  )
}

export default TextViewerSyntaxHighlight

TextViewerSyntaxHighlight.propTypes = {
  contentRawUrl: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  contentSize: PropTypes.number.isRequired
}
