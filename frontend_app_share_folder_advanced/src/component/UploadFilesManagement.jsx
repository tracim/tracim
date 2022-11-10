import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import PropTypes from 'prop-types'
import { IconButton, ShareLink } from 'tracim_frontend_lib'

const UploadFilesManagement = props => {
  const customColor = props.customColor
  return (
    <div className='share_folder_advanced__content'>
      <div className='share_folder_advanced__content__title'>
        {props.t('Public upload links')}

        <IconButton
          customClass='share_folder_advanced__content__btnupload'
          color={customColor}
          dataCy='share_folder_advanced__content__btnupload'
          key='newUpload'
          icon='fas fa-plus-circle'
          intent='primary'
          mode='light'
          onClick={props.onClickNewUploadComponent}
          text={props.t('New')}
        />
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
  onClickDeleteShareLink: () => { },
  customColor: ''
}
