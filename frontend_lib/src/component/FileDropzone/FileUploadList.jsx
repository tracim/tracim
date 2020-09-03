import React from 'react'
import PropTypes from 'prop-types'
import { displayFileSize } from '../../helper'
import { translate } from 'react-i18next'

export const FileUploadList = (props) => {
  const title = props.customTitle ? props.customTitle : props.t('Uploaded files')

  return (
    <div className='file__upload'>
      <div className='file__upload__title font-weight-bold'>
        {props.fileToUploadList.length > 0
          ? title
          : props.t('You have not yet chosen any files to upload.')}
      </div>

      <div className='file__upload__list'>
        {props.fileToUploadList.map((file) =>
          <div className='file__upload__list__item' key={file.name}>
            <i className='fa fa-fw fa-file-o m-1' />
            <div className='file__upload__list__item__label'>
              {file.name} ({displayFileSize(file.size)})
            </div>

            <button
              className='iconBtn primaryColorFontHover'
              onClick={() => props.onDeleteFile(file)}
              title={props.t('Delete')}
              disabled={props.deleteFileDisabled}
              data-cy='file__upload__list__item__delete'
            >
              <i className='fa fa-fw fa-trash-o' />
            </button>
            {file.errorMessage && (
              <i title={file.errorMessage} className='file__upload__list__item__error fa fa-fw fa-exclamation-triangle' />
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
  fileToUploadList: PropTypes.array,
  customTitle: PropTypes.string,
  deleteFileDisabled: PropTypes.bool
}

FileUploadList.defaultProps = {
  fileToUploadList: [],
  deleteFileDisabled: false,
  customTitle: ''
}
