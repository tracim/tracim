import React from 'react'
import { withTranslation } from 'react-i18next'
import Radium from 'radium'
import PropTypes from 'prop-types'
import { ShareLink } from 'tracim_frontend_lib'

const color = require('color')

const UploadFilesManagement = props => {
  const customColor = props.customColor
  return (
    <div className='share_folder_advanced__content'>
      <div className='share_folder_advanced__content__title'>
        {props.t('Import authorizations')}

        <button
          className='share_folder_advanced__content__btnupload btn highlightBtn'
          key='newUpload'
          style={{
            backgroundColor: customColor,
            ':hover': {
              backgroundColor: color(customColor).darken(0.15).hex()
            }
          }}
          onClick={props.onClickNewUploadComponent}
        >
          {props.t('New')}
          <i className='fa fa-fw fa-plus-circle' />
        </button>
      </div>
      {props.shareLinkList.length > 0
        ? props.shareLinkList.map(shareLink =>
          <ShareLink
            email={shareLink.email}
            link={shareLink.url}
            onClickDeleteShareLink={() => props.onClickDeleteShareLink(shareLink.share_id)}
            hexcolor={customColor}
            isProtected={shareLink.has_password}
          />
        )
        : <div className='share_folder_advanced__content__empty'>
          {props.t('No upload link has been created yet')}
        </div>
      }
    </div>
  )
}

export default withTranslation()(Radium(UploadFilesManagement))

UploadFilesManagement.propTypes = {
  shareLinkList: PropTypes.array.isRequired,
  onClickDeleteShareLink: PropTypes.func,
  customColor: PropTypes.string
}

UploadFilesManagement.defaultProps = {
  onClickDeleteShareLink: () => {},
  customColor: ''
}
