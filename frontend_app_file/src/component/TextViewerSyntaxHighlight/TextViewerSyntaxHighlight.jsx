import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  HTMLContent,
  IconButton,
  displayFileSize
} from 'tracim_frontend_lib'

require('./TextViewerSyntaxHighlight.styl')

const SYNTAX_HIGHLIGHT_MAX_FILE_SIZE_IN_OCTET = 10000

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

      const contentResponseAsText = await contentResponse.text()

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
        ? (
          <HTMLContent>{contentAsText}</HTMLContent>
        )
        : (
          <pre className='TextViewerSyntaxHighlight__blocked language-none'>
            <div className='TextViewerSyntaxHighlight__blocked__msg'>
              {props.t('The file weight {{ fileSize }}.', { fileSize: displayFileSize(props.contentSize, 2) })}
              <br />
              {props.t('Viewing it online might slow down the page.')}
            </div>

            <div className='TextViewerSyntaxHighlight__blocked__btn'>
              <IconButton
                onClick={() => setShouldRunSyntaxHighlight(true)}
                text={props.t('View anyway')}
                icon='far fa-eye'
                customClass='TextViewerSyntaxHighlight__blocked__btn__run'
              />
            </div>
          </pre>
        )
      )}
    </div>
  )
}

export default translate()(TextViewerSyntaxHighlight)

TextViewerSyntaxHighlight.propTypes = {
  contentRawUrl: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  contentSize: PropTypes.number.isRequired
}
