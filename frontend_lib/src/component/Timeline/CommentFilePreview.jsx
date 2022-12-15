import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Lightbox from 'react-image-lightbox'
import AttachedFile from '../AttachedFile/AttachedFile.jsx'
import {
  buildFilePreviewUrl,
  removeExtensionOfFilename,
  getFileDownloadUrl,
  handleFetchResult
} from '../../helper.js'
import { getFileRevisionPreviewInfo } from '../../action.async.js'

export class CommentFilePreview extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      fileCurrentPage: 1,
      previewInfo: {
        content_id: props.apiContent.content_id,
        revision_id: props.apiContent.current_revision_id,
        page_nb: 1,
        has_jpeg_preview: false
      },
      previewLoaded: false,
      fallbackPreview: false,
      displayLightbox: false
    }
  }

  componentDidUpdate = async () => {
    const { props, state } = this

    if (state.previewLoaded) return

    const previewInfoResponse = await handleFetchResult(
      await getFileRevisionPreviewInfo(
        props.apiUrl,
        props.apiContent.workspace_id,
        props.apiContent.content_id,
        props.apiContent.current_revision_id
      )
    )
    this.setState({
      previewInfo: previewInfoResponse.body,
      previewLoaded: true
    })
  }

  handleError = () => {
    this.setState({ fallbackPreview: true })
  }

  handleClickPreview = (e) => {
    const { state } = this

    if (state.previewLoaded && !state.previewInfo.has_jpeg_preview) return
    e.preventDefault()
    this.handleClickShowImageRaw()
  }

  handleClickShowImageRaw = () => {
    this.setState({ displayLightbox: true })
  }

  handleClickHideImageRaw = () => {
    this.setState({ displayLightbox: false })
  }

  handleClickPreviousPage = () => {
    const { state } = this
    if (state.previewInfo.page_nb <= 0) return
    this.setState(previousState => ({
      fileCurrentPage: previousState.fileCurrentPage - 1,
      previewLoaded: false
    }))
  }

  handleClickNextPage = () => {
    const { state } = this
    if (state.previewInfo.page_nb <= state.fileCurrentPage) return
    this.setState(previousState => ({
      fileCurrentPage: previousState.fileCurrentPage + 1,
      previewLoaded: false
    }))
  }

  render () {
    const { state, props } = this

    const workspaceId = props.apiContent.workspace_id || props.apiContent.workspaceId
    const filename = props.apiContent.filename || props.apiContent.fileName
    const id = props.apiContent.content_id || props.apiContent.id
    const currentRevisionId = props.apiContent.revision_id || props.apiContent.currentRevisionId
    const filenameWithoutExtension = removeExtensionOfFilename(props.apiContent.filename)

    const lightboxUrlList = (new Array(state.previewInfo.page_nb))
      .fill(null)
      .map((n, index) =>
        buildFilePreviewUrl(
          props.apiUrl,
          props.apiContent.workspace_id,
          props.apiContent.content_id,
          props.apiContent.current_revision_id,
          filenameWithoutExtension,
          index + 1,
          1280,
          720
        )
      )

    const previewUrl = buildFilePreviewUrl(
      props.apiUrl,
      workspaceId,
      id,
      currentRevisionId,
      removeExtensionOfFilename(filename),
      1, // page
      380, // width
      380 // height
    )

    const title = props.t('Download {{filename}}', { filename })
    const fileDownloadUrl = getFileDownloadUrl(
      props.apiUrl,
      workspaceId,
      id,
      filename
    )

    return (
      <>
        <a
          className='CommentFilePreview'
          title={title}
          onClick={this.handleClickPreview}
          href={fileDownloadUrl}
          download
        >
          <AttachedFile fileName={filename} />
          {(!state.fallbackPreview &&
            <img
              className={classnames(`${props.customClass}__body__text__asFile`, 'comment__body__text__asFile')}
              src={previewUrl}
              alt={filename}
              onError={this.handleError}
            />
          )}
        </a>
        {(state.displayLightbox && state.previewInfo.has_jpeg_preview
          ? (
            <Lightbox
              prevSrc={lightboxUrlList[state.fileCurrentPage - 2]}
              mainSrc={lightboxUrlList[state.fileCurrentPage - 1]} // INFO - CH - 2019-07-09 - fileCurrentPage starts at 1
              nextSrc={lightboxUrlList[state.fileCurrentPage]}
              onCloseRequest={this.handleClickHideImageRaw}
              onMovePrevRequest={this.handleClickPreviousPage}
              onMoveNextRequest={this.handleClickNextPage}
              imageCaption={`${state.fileCurrentPage} ${props.t('of')} ${state.previewInfo.page_nb}`}
              imagePadding={55}
              toolbarButtons={[(
                <a
                  className='btn gallery__action__button__lightbox__openRawContent'
                  download
                  href={fileDownloadUrl}
                  key='CommentFilePreview__download'
                  title={props.t('Download')}
                >
                  <i className='fa-fw fas fa-download' />
                </a>
              )]}
            />
          )
          : null
        )}
      </>
    )
  }
}

export default translate()(CommentFilePreview)

CommentFilePreview.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  apiContent: PropTypes.object.isRequired
}
