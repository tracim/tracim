import React from 'react'
import PropTypes from 'prop-types'
import {
  IconButton,
  displayFileSize
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

export const FileTooHeavyWarning = props => {
  return (
    <pre className='TextViewerSyntaxHighlight__blocked language-none'>
      <div className='TextViewerSyntaxHighlight__blocked__msg'>
        {props.t('The file weight {{ fileSize }}.', { fileSize: displayFileSize(props.contentSize, 2) })}
        <br />
        {props.t('Viewing it online might slow down the page.')}
      </div>

      <div className='TextViewerSyntaxHighlight__blocked__btn'>
        <IconButton
          onClick={props.onRunAnyway}
          text={props.t('View anyway')}
          icon='far fa-eye'
          customClass='TextViewerSyntaxHighlight__blocked__btn__run'
        />
      </div>
    </pre>
  )
}

export default translate()(FileTooHeavyWarning)

FileTooHeavyWarning.propTypes = {
  onRunAnyway: PropTypes.func.isRequired,
  contentSize: PropTypes.number.isRequired
}
