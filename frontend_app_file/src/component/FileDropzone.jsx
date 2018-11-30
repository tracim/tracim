import React from 'react'
import Dropzone from 'react-dropzone'
import { translate } from 'react-i18next'

require('./FileDropzone.styl')

export const FileDropzone = props => {
  return (
    <Dropzone
      onDrop={props.onDrop}
      onClick={props.onClick}
      multiple={false}
      style={{}} // to reset default style
      inputProps={{'data-cy': 'filecontent__form_input_file'}}
    >
      <div className='filecontent__form mb-4' drop='true'>
        {(() => {
          switch (props.preview) {
            case null: return (
              <div>
                <div
                  className='filecontent__form__icon d-flex justify-content-center'
                  style={{color: props.hexcolor}}
                >
                  <i className='fa fa-download' />
                </div>

                <div
                  className='filecontent__form__instruction text-center'
                  style={{color: props.hexcolor}}
                >
                  {props.t('Drag and drop your file here')}
                </div>

                <div className='filecontent__form__text text-center'>
                  {props.t('You can also import your file by clicking here')}
                </div>
              </div>
            )
            case false: return (
              <div className='filecontent__preview' drop='true'>
                <i className='filecontent__preview__nopreview-icon fa fa-paperclip' style={{color: props.hexcolor}} />
                <div className='filecontent__preview__nopreview-msg'>
                  {props.filename}
                </div>
              </div>
            )
            default: return (
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
