import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import PropTypes from 'prop-types'
import { ShareLink } from 'tracim_frontend_lib'

const color = require('color')

const UploadFilesManagement = props => {
  const customColor = props.customColor
  return (
    <div className='share_folder_advanced__content'>
      <div className='share_folder_advanced__content__title'>
        {props.t('Public upload links')}

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
          data-cy='share_folder_advanced__content__btnupload'
        >
          {props.t('New')}
          <i className='fas fa-fw fa-plus-circle' />
        </button>
      </div>

      {(props.uploadLinkList.length > 0
        ? props.uploadLinkList.map(shareLink =>
          <ShareLink
            hexcolor={customColor}
            email={shareLink.email}
            link={shareLink.url}
            isProtected={shareLink.has_password}
            onClickDeleteShareLink={() => props.onClickDeleteImportAuthorization(shareLink.upload_permission_id)}
            userRoleIdInWorkspace={props.userRoleIdInWorkspace}
            key={shareLink.url}
          />
        )
        : (
          <div className='share_folder_advanced__content__empty'>
            {props.t('No upload link has been created yet')}
          </div>
        )
      )}
    </div>
  )
}

export default translate()(Radium(UploadFilesManagement))

UploadFilesManagement.propTypes = {
  uploadLinkList: PropTypes.array.isRequired,
  onClickDeleteShareLink: PropTypes.func,
  customColor: PropTypes.string
}

UploadFilesManagement.defaultProps = {
  onClickDeleteShareLink: () => {},
  customColor: ''
}
