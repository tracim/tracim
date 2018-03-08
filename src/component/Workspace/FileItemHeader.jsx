import React from 'react'
import { translate } from 'react-i18next'

const FileItemHeader = props => {
  return (
    <div className='file__header'>
      <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
        <div className='file__header__type'>
          {props.t('FileItemHeader.type')}
        </div>
      </div>
      <div className='col-8 col-sm-8 col-md-8 col-lg-8 col-xl-10'>
        <div className='file__header__name'>
          {props.t('FileItemHeader.document_name')}
        </div>
      </div>
      <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
        <div className='file__header__status'>
          {props.t('FileItemHeader.status')}
        </div>
      </div>
    </div>
  )
}

export default translate()(FileItemHeader)
