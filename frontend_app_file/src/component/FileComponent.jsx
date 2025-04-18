import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import {
  APP_FEATURE_MODE,
  FileDropzone,
  IconButton,
  PromptMessage,
  PopupProgressUpload,
  RefreshWarningMessage
} from 'tracim_frontend_lib'
import ViewerSelector from './ViewerSelector.jsx'

export class FileComponent extends React.Component {
  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.previewVideo && !props.previewVideo) {
      this.unLoadVideoPlayer()
    } else if (!prevProps.previewVideo && props.previewVideo) {
      this.loadVideoPlayer(props.downloadRawUrl, props.content.mimetype)
    }
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
    videoWrapper.onclick = this.props.onTogglePreviewVideo

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
          { promptMessageWrapper: props.content.is_archived || props.content.is_deleted || props.isDeprecated }
        )}
      >
        <div style={{ visibility: 'hidden' }} ref={props.myForwardedRef} />
        <div className='file__contentpage__option'>
          {props.mode === APP_FEATURE_MODE.REVISION && (
            <IconButton
              customClass='wsContentGeneric__option__menu__lastversion file__lastversionbtn'
              color={props.customColor}
              intent='primary'
              mode='light'
              onClick={props.onClickLastVersion}
              icon='fas fa-history'
              text={props.t('Last version')}
              title={props.t('Last version')}
              dataCy='appFileLastVersionBtn'
            />
          )}
          {props.isRefreshNeeded && (
            <RefreshWarningMessage
              tooltip={props.t('The content has been modified by {{author}}', { author: props.editionAuthor, interpolation: { escapeValue: false } })}
              onClickRefresh={props.onClickRefresh}
            />
          )}
        </div>
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

        {props.content.is_archived && (
          <PromptMessage
            msg={props.t('This content is archived')}
            btnType='button'
            icon='archive'
            btnLabel={props.t('Restore')}
            onClickBtn={props.onClickRestoreArchived}
          />
        )}

        {props.content.is_deleted && (
          <PromptMessage
            msg={props.t('This content is deleted')}
            btnType='button'
            btnIcon='fas fa-trash-restore'
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
          <ViewerSelector
            system={props.system}
            content={props.content}
            color={props.customColor}
            contentRawUrl={props.downloadRawUrl}
            isPdfAvailable={props.isPdfAvailable}
            isJpegAvailable={props.isJpegAvailable}
            isVideo={props.isVideo}
            downloadPdfPageUrl={props.downloadPdfPageUrl}
            downloadPdfFullUrl={props.downloadPdfFullUrl}
            previewList={props.previewList}
            preview={props.preview}
            filePageNb={props.filePageNb}
            fileCurrentPage={props.fileCurrentPage}
            lightboxUrlList={props.lightboxUrlList}
            onClickPreviousPage={props.onClickPreviousPage}
            onClickNextPage={props.onClickNextPage}
            onTogglePreviewVideo={props.onTogglePreviewVideo}
          />
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
              <IconButton
                customClass='file__contentpage__dropzone__btn__cancel'
                color={props.customColor}
                intent='secondary'
                onClick={props.onClickDropzoneCancel}
                icon='fas fa-times'
                text={props.t('Cancel')}
              />

              <IconButton
                customClass='file__contentpage__dropzone__btn__validate'
                color={props.customColor}
                disabled={props.newFile === ''}
                intent='primary'
                mode='light'
                onClick={props.onClickDropzoneValidate}
                icon='fas fa-check'
                text={props.t('Validate')}
              />
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

FileComponent.propTypes = {
  system: PropTypes.object.isRequired,
  customColor: PropTypes.string,
  editionAuthor: PropTypes.string,
  isRefreshNeeded: PropTypes.bool,
  isVideo: PropTypes.bool,
  mode: PropTypes.string,
  onClickLastVersion: PropTypes.func,
  onClickRefresh: PropTypes.func,
  onTogglePreviewVideo: PropTypes.func,
  preview: PropTypes.object,
  previewList: PropTypes.array
}

FileComponent.defaultProps = {
  customColor: '#252525',
  editionAuthor: '',
  isRefreshNeeded: false,
  isVideo: false,
  mode: APP_FEATURE_MODE.VIEW,
  onClickLastVersion: () => { },
  onClickRefresh: () => { },
  onTogglePreviewVideo: () => { },
  previewList: []
}
