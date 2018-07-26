import React from 'react'
import { translate } from 'react-i18next'

const FileItemHeader = props => {
  return (
    <div className='content__header'>
      <div className='content__header__type'>
        {props.t('FileItemHeader.type')}
      </div>
      <div className='content__header__name'>
        {props.t('FileItemHeader.document_name')}
      </div>
      <div className='content__header__status'>
        {props.t('FileItemHeader.status')}
      </div>
    </div>
  )
}

export default translate()(FileItemHeader)
