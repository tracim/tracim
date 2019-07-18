import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import PropTypes from 'prop-types'
// import { ShareLink } from 'tracim_frontend_lib'

const UploadFilesManagement = props => {
  const customColor = props.tracimContentTypeList[1] ? props.tracimContentTypeList[1].hexcolor : props.customColor
  return (
    <div className='folder_advanced-content'>
      <div className='d-flex justify-content-between'>
        <div className='formBlock__title folder_advanced__content__title'>
          {props.t('Import authorizations')}
        </div>

        <button
          className='folder_advanced__content__btnupload btn highlightBtn'
          key='new_upload'
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
      {/* {props.shareLinkList.length > 0
        ? props.shareLinkList.map(shareLink =>
          <ShareLink
            email={shareLink.email}
            link={shareLink.link}
            onClickDeleteShareLink={() => props.onClickDeleteShareLink(shareLink.id)}
            hexcolor={customColor}
          />
        )
        : <div className='m-auto'>No upload link has been created yet.</div>
      } */}
    </div>
  )
}

export default translate()(Radium(UploadFilesManagement))

UploadFilesManagement.propTypes = {
  // shareLinkList: PropTypes.array.isRequired,
  customColor: PropTypes.string
}

UploadFilesManagement.defaultProps = {
  customColor: ''
}
