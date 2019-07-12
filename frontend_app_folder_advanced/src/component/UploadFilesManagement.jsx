import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import { ShareLink } from 'tracim_frontend_lib'

const UploadFilesManagement = props => {
  const customColor = props.tracimContentTypeList[1] ? props.tracimContentTypeList[1].hexcolor : props.customColor
  return (
    <div className='folder_advanced-content'>
      <div className='formBlock folder_advanced__content'>
        <div className='formBlock__title folder_advanced__content__title'>
          {props.t('Import authorizations')}
        </div>

        <div className='d-flex'>
          <button
            className='btn outlineTextBtn d-flex mt-3 mr-3 ml-auto'
            key='delete_all_shares'
            style={{
              borderColor: customColor,
              ':hover': {
                backgroundColor: customColor
              }
            }}
          >
            {props.t('Delete all')}
            <i className='fa fa-fw fa-trash-o' />
          </button>
          <button
            className='btn highlightBtn mt-3'
            key='new_share_file'
            style={{
              backgroundColor: customColor,
              ':hover': {
                backgroundColor: color(customColor).darken(0.15).hexString()
              }
            }}
          >
            {props.t('New')}
            <i className='fa fa-fw fa-plus-circle' />
          </button>
        </div>
        <ShareLink
          email='test@test.test'
          link='https://test.test.tst'
          hexcolor={customColor}
        />
        <ShareLink
          email='test@test.test'
          link='https://test.test.tst'
          hexcolor={customColor}
        />
      </div>
    </div>
  )
}

export default translate()(Radium(UploadFilesManagement))
