import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import PreviewComponent from './PreviewComponent.jsx'
import PopupProgressUpload from './PopupProgressUpload.jsx'
import {
  DisplayState,
  FileDropzone,
  APP_FEATURE_MODE
} from 'tracim_frontend_lib'
import { ALLOWED_VIDEO_MIME_TYPE_LIST } from '../helper.js'

const color = require('color')

export const FileComponent = props => (
  <div className={classnames(
    'file__contentpage__statewrapper',
    { 'displayState': props.isArchived || props.isDeleted || props.isDeprecated }
  )}>
    <div style={{ visibility: 'hidden' }} ref={props.myForwardedRef} />

    {props.isArchived && (
      <DisplayState
        msg={props.t('This content is archived')}
        btnType='button'
        icon='archive'
        btnLabel={props.t('Restore')}
        onClickBtn={props.onClickRestoreArchived}
      />
    )}

    {props.isDeleted && (
      <DisplayState
        msg={props.t('This content is deleted')}
        btnType='button'
        icon='trash'
        btnLabel={props.t('Restore')}
        onClickBtn={props.onClickRestoreDeleted}
      />
    )}

    {props.isDeprecated && (
      <DisplayState
        msg={props.t('This content is deprecated')}
        icon={props.deprecatedStatus.faIcon}
      />
    )}

    {(props.mode === APP_FEATURE_MODE.VIEW || props.mode === APP_FEATURE_MODE.REVISION) && (
      <PreviewComponent
        color={props.customColor}
        downloadRawUrl={props.downloadRawUrl}
        isPdfAvailable={props.isPdfAvailable}
        isJpegAvailable={props.isJpegAvailable}
        downloadPdfPageUrl={props.downloadPdfPageUrl}
        downloadPdfFullUrl={props.downloadPdfFullUrl}
        previewUrl={props.previewUrl}
        filePageNb={props.filePageNb}
        fileCurrentPage={props.fileCurrentPage}
        lightboxUrlList={props.lightboxUrlList}
        onClickPreviousPage={props.onClickPreviousPage}
        onClickNextPage={props.onClickNextPage}
      />
    )}

    {ALLOWED_VIDEO_MIME_TYPE_LIST.includes(props.mimeType) && (
      <div
        className={classnames('file__previewVideo', props.previewVideo ? 'open' : '')}
        style={{ visibility: props.previewVideo ? 'visible' : 'hidden' }}
        onClick={props.onClickClosePreviewVideo}
      >
        <video controls>
          <source
            src={props.downloadRawUrl}
            type={props.mimeType}
          />
          {props.t("Unfortunately, your browser can't play the video.")}
        </video>
      </div>
    )}

    {props.mode === APP_FEATURE_MODE.EDIT &&
      <div className='file__contentpage__dropzone'>
        {props.progressUpload.display &&
          <PopupProgressUpload
            color={props.customColor}
            percent={props.progressUpload.percent}
            filename={props.newFile ? props.newFile.name : ''}
          />
        }

        <FileDropzone
          onDrop={props.onChangeFile}
          onClick={props.onChangeFile}
          hexcolor={props.customColor}
          preview={props.newFilePreview}
          filename={props.newFile ? props.newFile.name : ''}
        />

        <div className='file__contentpage__dropzone__btn'>
          <button
            type='button'
            className='file__contentpage__dropzone__btn__cancel btn outlineTextBtn nohover'
            style={{ borderColor: props.customColor }}
            onClick={props.onClickDropzoneCancel}
          >
            {props.t('Cancel')}
          </button>

          <button
            type='button'
            className='file__contentpage__dropzone__btn__validate btn highlightBtn'
            style={{
              backgroundColor: props.customColor,
              ':hover': {
                backgroundColor: color(props.customColor).darken(0.15).hex()
              }
            }}
            onClick={props.onClickDropzoneValidate}
            disabled={props.newFile === ''}
          >
            {props.t('Validate')}
          </button>
        </div>
      </div>
    }
  </div>
)

// INFO - CH - 2019-09-13 - FileComponentWithHOC const is used to be able to forward the ref though HOC
const FileComponentWithHOC = translate()(Radium(FileComponent))

export default React.forwardRef((props, ref) => <FileComponentWithHOC {...props} myForwardedRef={ref} />)
