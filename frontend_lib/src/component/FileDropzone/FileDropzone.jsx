import React from 'react'
import PropTypes from 'prop-types'
import Dropzone from 'react-dropzone' // INFO - GB- 2019-07-31 - react-dropzone is in an older version because of a persistent problem with Hooks
import { translate } from 'react-i18next'
import { FILE_PREVIEW_STATE } from '../../helper.js'

export const FileDropzone = props => {
  const isPreviewObjectUrl = props.preview.startsWith('blob:')
  if (isPreviewObjectUrl) {
    React.useEffect(() => {
      console.log(`Revoking object URL ${props.preview}`)
      URL.revokeObjectURL(props.preview)
    })
  }
  return (
    <Dropzone
      onDrop={props.onDrop}
      onClick={props.onClick}
      multiple={props.multipleFiles}
      style={{}} // to reset default style
      inputProps={{ 'data-cy': 'filecontent__form_input_file' }}
    >
      <div className='filecontent__form mb-4' drop='true'>
        {(() => {
          switch (props.preview) {
            case FILE_PREVIEW_STATE.NO_FILE:
              return (
                <div>
                  <div
                    className='filecontent__form__icon d-flex justify-content-center'
                    style={{ color: props.hexcolor }}
                  >
                    <i className='fa fa-upload' />
                  </div>

                  <div
                    className='filecontent__form__instruction text-center'
                    style={{ color: props.hexcolor }}
                  >
                    {props.multipleFiles ? props.t('Drag and drop your files here') : props.t('Drag and drop your file here')}
                  </div>

                  <div className='filecontent__form__text text-center'>
                    {props.multipleFiles ? props.t('You can also import your files by clicking here') : props.t('You can also import your file by clicking here')}
                  </div>
                </div>
              )
            case FILE_PREVIEW_STATE.NO_PREVIEW:
              return (
                <div className='filecontent__preview' drop='true'>
                  <i className='filecontent__preview__nopreview-icon fa fa-paperclip' style={{ color: props.hexcolor }} />
                  <div className='filecontent__preview__nopreview-msg'>
                    {props.filename}
                  </div>
                </div>
              )
            default:
              return (
                <div className='filecontent__preview' drop='true'>
                  <img src={props.preview} />
                </div>
              )
          }
        })()}
      </div>
    </Dropzone>
  )
}

export default translate()(FileDropzone)

FileDropzone.propTypes = {
  onDrop: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  multipleFiles: PropTypes.bool,
  hexcolor: PropTypes.string,
  filename: PropTypes.string,
  preview: PropTypes.string
}

FileDropzone.defaultProps = {
  multipleFiles: false,
  preview: FILE_PREVIEW_STATE.NO_FILE,
  hexcolor: '',
  filename: ''
}
