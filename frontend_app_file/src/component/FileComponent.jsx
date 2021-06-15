import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import PreviewComponent from './PreviewComponent.jsx'
import {
  APP_FEATURE_MODE,
  Breadcrumbs,
  BREADCRUMBS_TYPE,
  FileDropzone,
  PromptMessage,
  PAGE,
  PopupProgressUpload
} from 'tracim_frontend_lib'

const color = require('color')

export class FileComponent extends React.Component {
  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.previewVideo && !props.previewVideo) this.unLoadVideoPlayer()
    else if (!prevProps.previewVideo && props.previewVideo) this.loadVideoPlayer(props.downloadRawUrl, props.mimeType)
  }

  loadVideoPlayer (videoUrl, videoMimeType) {
    const source = document.createElement('source')
    source.src = videoUrl
    source.type = videoMimeType

    const video = document.createElement('video')
    video.controls = true
    video.preload = 'metadata'

    video.appendChild(source)

    const videoWrapper = document.createElement('div')
    videoWrapper.id = 'videoWrapperDiv'
    videoWrapper.className = 'file__previewVideo open'
    videoWrapper.onclick = (e) => {
      this.props.onClickClosePreviewVideo(e)
    }

    videoWrapper.appendChild(video)

    const browserCanPlayType = video.canPlayType(videoMimeType)
    if (browserCanPlayType === '' || browserCanPlayType === 'maybe') {
      const warningMsg = document.createElement('div')
      warningMsg.innerHTML = `
        <div class='file__previewVideo__error'>
          ${this.props.t('Note: Your browser might not be able to read this file.')}
          <br />
          ${this.props.t('In that case, you can download the video and try opening it manually.')}
          <br />
          ${this.props.t('To download the video, leave the fullscreen mode and click on download button {{icon}}.', { icon: '<i class="fas fa-download"></i>', interpolation: { escapeValue: false } })}
        </div>
      `
      videoWrapper.appendChild(warningMsg)
    }

    const body = document.getElementsByTagName('body')[0]
    body.appendChild(videoWrapper)
  }

  unLoadVideoPlayer () {
    const videoWrapper = document.getElementById('videoWrapperDiv')
    videoWrapper.remove()
  }

  render () {
    const { props } = this
    return (
      <div
        className={classnames(
          'file__contentpage__statewrapper',
          { promptMessageWrapper: props.isArchived || props.isDeleted || props.isDeprecated }
        )}
      >
        <div style={{ visibility: 'hidden' }} ref={props.myForwardedRef} />

        {props.displayNotifyAllMessage && (
          <PromptMessage
            msg={
              <span>{props.t('To notify all members of the space of your modification')},
                <button
                  className='btn buttonLink'
                  onClick={props.onClickNotifyAll}
                >
                  {props.t('click here!')}
                </button>
              </span>
            }
            btnType='link'
            icon='far fa-hand-point-right'
            btnLabel={<i className='fas fa-times' />}
            onClickBtn={props.onClickCloseNotifyAllMessage}
          />
        )}

        {props.isArchived && (
          <PromptMessage
            msg={props.t('This content is archived')}
            btnType='button'
            icon='archive'
            btnLabel={props.t('Restore')}
            onClickBtn={props.onClickRestoreArchived}
          />
        )}

        {props.isDeleted && (
          <PromptMessage
            msg={props.t('This content is deleted')}
            btnType='button'
            icon='far fa-trash-alt'
            btnLabel={props.t('Restore')}
            onClickBtn={props.onClickRestoreDeleted}
          />
        )}

        {props.isDeprecated && (
          <PromptMessage
            msg={props.t('This content is deprecated')}
            icon={props.deprecatedStatus.faIcon}
          />
        )}

        {(props.mode === APP_FEATURE_MODE.VIEW || props.mode === APP_FEATURE_MODE.REVISION) && (
          <span>
            <Breadcrumbs
              root={{
                link: PAGE.HOME,
                label: '',
                icon: 'fas fa-home',
                type: BREADCRUMBS_TYPE.CORE,
                isALink: true
              }}
              breadcrumbsList={props.breadcrumbsList}
            />

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
          </span>
        )}

        {props.mode === APP_FEATURE_MODE.EDIT && (
          <div className='file__contentpage__dropzone'>
            {props.progressUpload.display && (
              <PopupProgressUpload
                color={props.customColor}
                percent={props.progressUpload.percent}
                filename={props.newFile ? props.newFile.name : ''}
              />
            )}

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
        )}
      </div>
    )
  }
}

// INFO - CH - 2019-09-13 - FileComponentWithHOC const is used to be able to forward the ref though HOC
const FileComponentWithHOC = translate()(Radium(FileComponent))

export default React.forwardRef((props, ref) => <FileComponentWithHOC {...props} myForwardedRef={ref} />)
