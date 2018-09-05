import React from 'react'
import Dropzone from 'react-dropzone'
import { translate } from 'react-i18next'

require('./FileDropzone.styl')

export const FileDropzone = props =>
  <Dropzone
    onDrop={props.onDrop}
    onClick={props.onClick}
    multiple={false}
    style={{}} // to reset default style
  >
    <div className='filecontent__form mb-4' drop='true'>
      {props.preview === null
        ? (
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
        : (
          <div className='filecontent__preview' drop='true'>
            <img src={props.preview} />
          </div>
        )
      }
    </div>
  </Dropzone>

export default translate()(FileDropzone)
