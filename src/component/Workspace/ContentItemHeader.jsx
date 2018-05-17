import React from 'react'
import { translate } from 'react-i18next'

const FileItemHeader = props => {
  return (
    <div className='file__header'>
      <div className='file__header__type'>
        {props.t('FileItemHeader.type')}
      </div>
      <div className='file__header__name'>
        {props.t('FileItemHeader.document_name')}
      </div>
      <div className='file__header__status'>
        {props.t('FileItemHeader.status')}
      </div>
    </div>
  )
}

export default translate()(FileItemHeader)
