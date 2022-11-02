import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Lightbox from 'tracim_app_gallery/src/Lightbox.js'
import AttachedFile from '../AttachedFile/AttachedFile.jsx'
import {
  buildFilePreviewUrl,
  removeExtensionOfFilename,
  getFileDownloadUrl
} from '../../helper.js'

export class CommentFilePreview extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      fallbackPreview: false,
      displayLightbox: false
    }
  }

  handleError = () => {
    this.setState({ fallbackPreview: true })
  }

  handleClickPreview = (e) => {
    e.preventDefault()
    this.handleClickShowImageRaw()
  }

  handleClickShowImageRaw = () => {
    this.setState({ displayLightbox: true })
  }

  handleClickHideImageRaw = () => {
    this.setState({ displayLightbox: false })
  }

  render () {
    const { state, props } = this

    const workspaceId = props.apiContent.workspace_id || props.apiContent.workspaceId
    const filename = props.apiContent.filename || props.apiContent.fileName
    const id = props.apiContent.content_id || props.apiContent.id
    const currentRevisionId = props.apiContent.revision_id || props.apiContent.currentRevisionId
    const filenameWithoutExtension = removeExtensionOfFilename(props.apiContent.filename)

    const lightboxUrlList = [
      buildFilePreviewUrl(
        props.apiUrl,
        props.apiContent.workspace_id,
        props.apiContent.content_id,
        props.apiContent.current_revision_id,
        filenameWithoutExtension,
        1,
        1920,
        1080
      )
    ]

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
          // download
        >
          <AttachedFile fileName={filename} />
          {(!this.state.fallbackPreview &&
            <img
              className={classnames(`${props.customClass}__body__text__asFile`, 'comment__body__text__asFile')}
              src={previewUrl}
              alt={filename}
              onError={this.handleError}
            />
          )}
        </a>
        {(state.displayLightbox
          ? (
            <Lightbox
              prevSrc={lightboxUrlList[1 - 2]}
              mainSrc={lightboxUrlList[1 - 1]} // INFO - CH - 2019-07-09 - fileCurrentPage starts at 1
              nextSrc={lightboxUrlList[1]}
              onCloseRequest={this.handleClickHideImageRaw}
              onMovePrevRequest={props.onClickPreviousPage}
              onMoveNextRequest={props.onClickNextPage}
              imageCaption={`${1} ${props.t('of')} ${1}`}
              imagePadding={55}
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
