import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {
  buildFilePreviewUrl,
  removeExtensionOfFilename,
  getFileDownloadUrl
} from '../../helper.js'
import AttachedFile from '../AttachedFile/AttachedFile.jsx'

export class CommentFilePreview extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      fallbackPreview: false
    }
  }

  handleError = () => {
    this.setState({ fallbackPreview: true })
  }

  render () {
    const { props } = this

    const workspaceId = props.apiContent.workspace_id || props.apiContent.workspaceId
    const filename = props.apiContent.filename || props.apiContent.fileName
    const id = props.apiContent.content_id || props.apiContent.id
    const currentRevisionId = props.apiContent.revision_id || props.apiContent.currentRevisionId

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
      <a
        className='CommentFilePreview'
        title={title}
        href={fileDownloadUrl}
        download
      >
        {(!props.isPublication) && <AttachedFile fileName={filename} />}
        {(!this.state.fallbackPreview &&
          <img
            className={classnames(`${props.customClass}__body__text__asFile`, 'comment__body__text__asFile')}
            src={previewUrl}
            alt={filename}
            onError={this.handleError}
          />
        )}
      </a>
    )
  }
}

export default translate()(CommentFilePreview)

CommentFilePreview.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  apiContent: PropTypes.object.isRequired,
  isPublication: PropTypes.bool.isRequired
}
