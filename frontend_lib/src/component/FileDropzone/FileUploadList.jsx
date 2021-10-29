import React from 'react'
import PropTypes from 'prop-types'
import { displayFileSize } from '../../helper'
import { translate } from 'react-i18next'

export const FileUploadList = (props) => {
  const title = props.customTitle ? props.customTitle : props.t('Uploaded files')

  return (
    <div className='file__upload'>
      <div className='file__upload__title'>
        {props.fileUploadList.length > 0
          ? title
          : props.t('You have not yet chosen any files to upload.')}
      </div>

      <div className='file__upload__list'>
        {props.fileUploadList.map((fileUpload) =>
          <div className='file__upload__list__item' key={fileUpload.file.name}>
            <i className='far fa-fw fa-file m-1' />
            <div className='file__upload__list__item__label'>
              {fileUpload.file.name} ({displayFileSize(fileUpload.file.size)})
            </div>

            <button
              className='transparentButton primaryColorFontHover'
              onClick={() => props.onDeleteFile(fileUpload)}
              title={props.t('Delete')}
              disabled={props.deleteFileDisabled}
              data-cy='file__upload__list__item__delete'
            >
              <i className='far fa-fw fa-trash-alt' />
            </button>
            {fileUpload.errorMessage && (
              <i title={fileUpload.errorMessage} className='file__upload__list__item__error fas fa-fw fa-exclamation-triangle' />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default translate()(FileUploadList)

FileUploadList.propTypes = {
  onDeleteFile: PropTypes.func.isRequired,
  fileUploadList: PropTypes.array,
  customTitle: PropTypes.string,
  deleteFileDisabled: PropTypes.bool
}

FileUploadList.defaultProps = {
  fileUploadList: [],
  deleteFileDisabled: false,
  customTitle: ''
}
