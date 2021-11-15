import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Dropzone from 'react-dropzone' // INFO - GB- 2019-07-31 - react-dropzone is in an older version because of a persistent problem with Hooks
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

import {
  CardPopup,
  IconButton
} from 'tracim_frontend_lib'

require('../css/PopupSelectImage.styl')

const MODE = {
  SELECT: 'SELECT',
  CROP: 'CROP'
}

const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/webp'
]

const SelectFilePlaceHolder = (props) => {
  return (
    <>
      <div
        className='filecontent__form__instruction text-center'
        style={{ color: props.hexcolor }}
      >
        {props.t('Drag and drop your file here')}
      </div>

      <div className='filecontent__form__text text-center'>
        {props.t('You can also import your file by clicking here')}
      </div>

    </>
  )
}

/**
 * INFO - SG - 2021-11-09
 * This component allows the user to select an image then crop it.
 * The image is then passed as a blob to props.onValidate().
 */
class PopupSelectImage extends React.Component {
  constructor (props) {
    super(props)
    this.croppedImageRef = React.createRef()
    this.state = {
      imageBlobURL: null,
      mode: MODE.SELECT,
      errorMessage: null
    }
  }

  componentWillUnmount () {
    // INFO - SG - 2021-11-09 - ensure the blob represented by imageBlobURL
    // is properly de-allocated when the component is destroyed
    const { state } = this
    if (!state.imageBlobURL) return
    console.log(`Revoking object URL ${state.imageBlobURL}`)
    URL.revokeObjectURL(state.imageBlobURL)
  }

  handleDropFile = async (droppedFileList, rejectedFileList, event) => {
    const { props } = this
    if (!droppedFileList || droppedFileList.length === 0) return
    const file = droppedFileList[0]

    if (!ALLOWED_IMAGE_MIMETYPES.includes(file.type)) {
      this.setState({ errorMessage: props.t('The type of this file is not allowed') })
      return
    }
    if (props.maximumFileSize && file.size > props.maximumFileSize) {
      this.setState({ errorMessage: props.t('The file is too big') })
      return
    }

    this.setState({ imageBlobURL: URL.createObjectURL(file) })
    // NOTE - 2021-11-10 - SG - Directly go to crop when the file has
    // been added through a click + file selector.
    // Going to crop in case of a drag event is handled by handleDragLeave()
    // so that cypress upload() command properly works in functional tests.
    if (!(event instanceof DragEvent)) this.setState({ mode: MODE.CROP })
  }

  handleDragLeave = () => {
    this.setState({ mode: MODE.CROP })
  }

  handleValidate = async () => {
    const { props } = this
    const cropper = this.croppedImageRef.current.cropper
    const blob = await new Promise((resolve) => {
      cropper.getCroppedCanvas().toBlob(resolve)
    })
    props.onValidate(blob)
  }

  handleBack = async () => {
    this.setState({ mode: MODE.SELECT })
  }

  render () {
    const { props, state } = this
    return (
      <CardPopup
        onClose={props.onClose}
        onValidate={this.handleValidate}
        label={state.mode === MODE.SELECT ? props.t('Select an image') : props.t('Crop the image')}
        customColor={GLOBAL_primaryColor} // eslint-disable-line camelcase
        faIcon='fas fa-upload'
        customClass={classnames('PopupSelectImage', props.customClass)}
      >
        {state.mode === MODE.SELECT && (
          <>
            <Dropzone
              onDrop={this.handleDropFile}
              onDragLeave={this.handleDragLeave}
              multiple={false}
              className='PopupSelectImage__dropZone'
            >
              <SelectFilePlaceHolder t={props.t} />
            </Dropzone>
            {props.recommendedDimensions && (
              <div>
                <i className='fas fa-fw fa-expand-arrows-alt' /> {props.t('Recommended dimensions: {{dimensions}} px', { dimensions: props.recommendedDimensions })}<br />
              </div>
            )}
            <div><i className='far fa-fw fa-image' /> {props.t('Maximum size: {{size}} MB', { size: props.maximumImageSize / (1024 * 1024) })}</div>
          </>
        )}
        {state.mode === MODE.CROP && (
          <Cropper
            className='PopupSelectImage__cropper'
            src={state.imageBlobURL}
            aspectRatio={props.aspectRatio}
            guides={false}
            autoCropArea={1.0}
            zoomable={false}
            scalable={false}
            rotatable={false}
            viewMode={2}
            ref={this.croppedImageRef}
          />
        )}
        {state.errorMessage && (
          <div className='PopupSelectImage__errorMessage'>
            <i title={state.errorMessage} className='fas fa-fw fa-exclamation-triangle' />
            {state.errorMessage}
          </div>
        )}
        <div className='PopupSelectImage__buttons'>
          {state.mode === MODE.SELECT && (
            <IconButton
              text={props.t('Close')}
              icon='fas fa-times'
              intent='secondary'
              mode='dark'
              onClick={props.onClose}
              customClass='PopupSelectImage__buttons__close'
              dataCy='popup-select-image-close'
            />
          )}
          {state.mode === MODE.CROP && (
            <IconButton
              text={props.t('Back')}
              icon='fas fa-arrow-left'
              intent='secondary'
              mode='dark'
              onClick={this.handleBack}
              customClass='PopupSelectImage__buttons__back'
              dataCy='popup-select-image-back'
            />
          )}
          <IconButton
            text={props.t('Validate')}
            icon='fas fa-check'
            intent='primary'
            mode='light'
            onClick={this.handleValidate}
            customClass='PopupSelectImage__buttons__validate'
            disabled={state.mode !== MODE.CROP || state.errorMessage}
            dataCy='popup-select-image-validate'
          />
        </div>
      </CardPopup>
    )
  }
}

PopupSelectImage.propTypes = {
  onValidate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  recommendedDimensions: PropTypes.string,
  maximumImageSize: PropTypes.number,
  aspectRatio: PropTypes.number,
  customClass: PropTypes.string
}

PopupSelectImage.defaultProps = {
  recommendedDimensions: null,
  maximumImageSize: 10 * 1024 * 1024,
  // NOTE - SG - 20211109 - the default value matches cropperjs's one:
  // https://www.npmjs.com/package/cropperjs#options
  aspectRatio: NaN,
  customClass: null
}

export default translate()(PopupSelectImage)
